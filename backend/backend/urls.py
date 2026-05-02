"""URL configuration for the backend project."""
from pathlib import Path

from django.contrib import admin
from django.urls import include, path, re_path

from .spa_views import spa_catch_all

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("users.urls")),
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
