"""URL configuration for the backend project."""
from pathlib import Path

from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path, re_path

from .spa_views import spa_catch_all


def root_health(request):
    return JsonResponse({
        "status": "healthy",
        "service": "SEPiCP Backend API",
        "admin": "/admin/",
        "api": "/api/",
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
