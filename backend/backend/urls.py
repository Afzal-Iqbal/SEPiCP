"""URL configuration for the backend project."""
from pathlib import Path
import os
import logging
import traceback

from django.conf import settings
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path, re_path

from .spa_views import spa_catch_all

logger = logging.getLogger(__name__)


def root_health(request):
    db_engine = settings.DATABASES["default"].get("ENGINE", "unknown")
    has_db_url = bool(os.environ.get("DATABASE_URL"))
    db_status = "unknown"
    user_count = 0
    error_msg = None
    seed_result = None

    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user_count = User.objects.count()
        db_status = "connected"
    except Exception as e:
        logger.warning("Database check failed, attempting auto-migration: %s", e)
        try:
            from django.core.management import call_command
            call_command("migrate", interactive=False)
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user_count = User.objects.count()
            db_status = "connected_after_migrate"
        except Exception as e2:
            db_status = "error"
            error_msg = str(e2)

    # Always ensure default admin user is seeded
    if db_status in ("connected", "connected_after_migrate"):
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
            "error": error_msg,
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
    import traceback
    from django.contrib.auth import authenticate, get_user_model
    User = get_user_model()
    info = {
        "db_tables": [],
        "user_count": 0,
        "users": [],
        "seed_result": None,
        "auth_test": None,
        "error": None,
        "traceback": None,
    }
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            info["db_tables"] = connection.introspection.table_names(cursor)

        from users.default_user import ensure_default_user
        ok, err = ensure_default_user()
        info["seed_result"] = {"ok": ok, "error": err}

        info["user_count"] = User.objects.count()
        for u in User.objects.all()[:5]:
            info["users"].append({
                "id": u.id,
                "email": u.email,
                "username": u.username,
                "role": getattr(u, "role", None),
                "is_staff": u.is_staff,
                "is_superuser": u.is_superuser,
            })

        auth_user = authenticate(email="admin@sepicp.com", password="Admin@123456")
        info["auth_test"] = {
            "success": auth_user is not None,
            "user": str(auth_user) if auth_user else None,
        }
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
