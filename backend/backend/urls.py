"""URL configuration for the backend project."""
from pathlib import Path
import os
import logging

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

    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user_count = User.objects.count()
        db_status = "connected"
    except Exception as e:
        logger.warning("Database check failed, attempting auto-migration: %s", e)
        # Attempt self-healing migration if database tables are missing
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
            logger.exception("Auto-migration also failed: %s", e2)

    # If connected and no users, ensure default admin exists
    if db_status in ("connected", "connected_after_migrate") and user_count == 0:
        try:
            from users.default_user import ensure_default_user
            ensure_default_user()
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user_count = User.objects.count()
        except Exception as e:
            logger.exception("Default user seed failed: %s", e)

    return JsonResponse({
        "status": "healthy",
        "service": "SEPiCP Backend API",
        "database": {
            "has_database_url": has_db_url,
            "engine": db_engine,
            "status": db_status,
            "error": error_msg,
            "user_count": user_count,
        },
        "endpoints": {
            "admin": "/admin/",
            "login": "/api/login/",
            "profile": "/api/profile/",
        },
    })


urlpatterns = [
    path("", root_health, name="root_health"),
    path("health/", root_health, name="health_check"),
    path("admin/", admin.site.urls),
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
