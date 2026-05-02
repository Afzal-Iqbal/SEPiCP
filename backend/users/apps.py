from django.apps import AppConfig


class UsersConfig(AppConfig):
    name = "users"

    def ready(self):
        # Register app signals (includes post_migrate admin seed hook).
        from . import signals  # noqa: F401
