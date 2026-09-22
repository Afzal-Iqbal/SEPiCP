"""Create the optional default user from settings (see .env)."""
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.utils import OperationalError, ProgrammingError


def ensure_default_user() -> bool:
    """
    If DEFAULT_USER_SEED is enabled and credentials are set, ensure one user exists.
    Intended to be called from post_migrate so setup happens during `manage.py migrate`.
    Returns True if a user was created, False otherwise.
    """
    if not getattr(settings, "DEFAULT_USER_SEED", False):
        return False
    email = (getattr(settings, "DEFAULT_USER_EMAIL", None) or "").strip()
    username = (getattr(settings, "DEFAULT_USER_USERNAME", None) or "").strip()
    password = getattr(settings, "DEFAULT_USER_PASSWORD", None) or ""
    if not email or not username or not password:
        return False

    User = get_user_model()
    try:
        if User.objects.filter(email=email).exists():
            return False
        User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_staff=getattr(settings, "DEFAULT_USER_IS_STAFF", True),
            is_superuser=getattr(settings, "DEFAULT_USER_IS_SUPERUSER", False),
        )
        return True
    except (OperationalError, ProgrammingError):
        return False
