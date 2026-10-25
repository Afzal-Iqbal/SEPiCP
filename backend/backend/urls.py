"""URL configuration for the backend project."""
from pathlib import Path
import os
import logging
import traceback
from io import StringIO

from django.conf import settings
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path, re_path

from .spa_views import spa_catch_all

logger = logging.getLogger(__name__)


def ensure_database_migrated():
    """Inspect schema, repair missing columns/fake migration records, and migrate."""
    from django.db import connection
    from django.core.management import call_command
    migrate_out = None
    migrate_err = None

    try:
        with connection.cursor() as cursor:
            tables = connection.introspection.table_names(cursor)

            # Fast-path: if core tables already exist, no migration check needed
            if "instructor_surveys" in tables and "student_surveys" in tables and "user" in tables:
                return "Already up-to-date", None
            
            # 1. Guarantee "role" column on "user" table
            if "user" in tables:
                if connection.vendor == "postgresql":
                    cursor.execute('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" varchar(20) NOT NULL DEFAULT \'student\';')
                elif connection.vendor == "sqlite":
                    cols = [c.name for c in connection.introspection.get_table_description(cursor, "user")]
                    if "role" not in cols:
                        cursor.execute('ALTER TABLE "user" ADD COLUMN "role" varchar(20) NOT NULL DEFAULT \'student\';')

            # 2. Check if migration 0005 was falsely marked applied while tables are missing
            if "django_migrations" in tables:
                cursor.execute("SELECT 1 FROM django_migrations WHERE app='users' AND name LIKE '0005%'")
                has_0005 = cursor.fetchone()
                if has_0005 and "instructor_surveys" not in tables:
                    cursor.execute("DELETE FROM django_migrations WHERE app='users' AND name LIKE '0005%'")

        # 3. Run migrate to apply migration 0005 or any pending migrations
        out = StringIO()
        call_command("migrate", interactive=False, stdout=out)
        migrate_out = out.getvalue()
    except Exception as e:
        migrate_err = str(e)
        logger.exception("Migration repair/run error: %s", e)

    return migrate_out, migrate_err


def root_health(request):
    db_engine = settings.DATABASES["default"].get("ENGINE", "unknown")
    has_db_url = bool(os.environ.get("DATABASE_URL"))
    db_status = "unknown"
    user_count = 0
    error_msg = None
    seed_result = None

    migrate_out, migrate_err = ensure_database_migrated()

    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user_count = User.objects.count()
        db_status = "connected"
    except Exception as e:
        db_status = "error"
        error_msg = str(e)

    # Always ensure default admin user is seeded
    if db_status == "connected":
        try:
            from users.default_user import ensure_default_user
            seed_ok, seed_err = ensure_default_user()
            seed_result = {"ok": seed_ok, "error": seed_err}
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user_count = User.objects.count()
        except Exception as e:
            seed_result = {"ok": False, "error": str(e)}

    return JsonResponse({
        "status": "healthy",
        "service": "SEPiCP Backend API",
        "database": {
            "has_database_url": has_db_url,
            "engine": db_engine,
            "status": db_status,
            "error": error_msg or migrate_err,
            "migrate_log": migrate_out,
            "user_count": user_count,
            "seed_result": seed_result,
        },
        "endpoints": {
            "admin": "/admin/",
            "login": "/api/login/",
            "profile": "/api/profile/",
            "debug": "/api/debug-auth/",
        },
    })


def debug_auth(request):
    import os, traceback
    from io import StringIO
    from django.core.management import call_command
    from django.db import connection

    info = {
        "migration_files": [],
        "applied_migrations": [],
        "db_tables": [],
        "makemigrations_log": None,
        "migrate_log": None,
        "error": None,
    }
    try:
        from pathlib import Path
        mig_dir = Path(__file__).resolve().parent.parent / "users" / "migrations"
        if mig_dir.is_dir():
            info["migration_files"] = sorted([f.name for f in mig_dir.iterdir() if f.is_file()])

        with connection.cursor() as cursor:
            info["db_tables"] = sorted(connection.introspection.table_names(cursor))
            cursor.execute("SELECT id, app, name, applied FROM django_migrations ORDER BY id")
            info["applied_migrations"] = [{"id": r[0], "app": r[1], "name": r[2], "applied": str(r[3])} for r in cursor.fetchall()]

        out_mm = StringIO()
        call_command("makemigrations", dry_run=True, stdout=out_mm)
        info["makemigrations_log"] = out_mm.getvalue()

        out_mig = StringIO()
        call_command("migrate", interactive=False, stdout=out_mig)
        info["migrate_log"] = out_mig.getvalue()

    except Exception as e:
        info["error"] = str(e)
        info["traceback"] = traceback.format_exc()

    return JsonResponse(info)


urlpatterns = [
    path("", root_health, name="root_health"),
    path("health/", root_health, name="health_check"),
    path("admin/", admin.site.urls),
    path("api/debug-auth/", debug_auth, name="debug_auth"),
    path("api/", include("users.urls")),
    path("api/assistant/", include("assistant.urls")),
]

_site_dist = Path(__file__).resolve().parent.parent / "static" / "site"
if (_site_dist / "index.html").is_file():
    urlpatterns.append(
        re_path(
            r"^(?P<path>.*)$",
            spa_catch_all,
            {"document_root": str(_site_dist)},
        )
    )
