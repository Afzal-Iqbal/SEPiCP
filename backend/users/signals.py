"""Users app signal handlers."""
from django.apps import apps
from django.db.models.signals import post_migrate
from django.dispatch import receiver

from .default_user import ensure_default_user


@receiver(post_migrate)
def seed_default_user_on_migrate(sender, **kwargs):
    """
    Seed default user during `manage.py migrate`.
    Runs after migrations and creates the configured user only if missing.
    """
    users_config = apps.get_app_config("users")
    if sender != users_config:
        return
    ensure_default_user()

