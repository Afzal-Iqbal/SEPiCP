"""Create default admin/staff users from settings or built-in student defaults."""
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.utils import OperationalError, ProgrammingError


def ensure_default_user() -> bool:
    """
    Ensure standard admin users exist in the database.
    Intended to be called from post_migrate so setup happens automatically during `manage.py migrate`.
    """
    if not getattr(settings, "DEFAULT_USER_SEED", True):
        return False

    User = get_user_model()
    created_or_updated = False

    # 1. Configured Admin User (from environment variables or defaults)
    email = (getattr(settings, "DEFAULT_USER_EMAIL", "") or "admin@sepicp.com").strip()
    username = (getattr(settings, "DEFAULT_USER_USERNAME", "") or "admin").strip()
    password = getattr(settings, "DEFAULT_USER_PASSWORD", "") or "Admin@123456"
    is_staff = getattr(settings, "DEFAULT_USER_IS_STAFF", True)
    is_superuser = getattr(settings, "DEFAULT_USER_IS_SUPERUSER", True)

    users_to_seed = [
        {
            "username": username,
            "email": email,
            "password": password,
            "role": "admin",
            "is_staff": is_staff,
            "is_superuser": is_superuser,
        },
        # Built-in demo admin matching frontend quick demo:
        {
            "username": "nedscholar",
            "email": "nedscholar@gmail.com",
            "password": "123456",
            "role": "admin",
            "is_staff": True,
            "is_superuser": True,
        },
    ]

    try:
        for uinfo in users_to_seed:
            user = User.objects.filter(email=uinfo["email"]).first()
            if not user:
                user = User.objects.filter(username=uinfo["username"]).first()

            if not user:
                user = User.objects.create_user(
                    username=uinfo["username"],
                    email=uinfo["email"],
                    password=uinfo["password"],
                    is_staff=uinfo["is_staff"],
                    is_superuser=uinfo["is_superuser"],
                )
                user.role = uinfo["role"]
                user.save(update_fields=["role", "is_staff", "is_superuser"])
                created_or_updated = True
            else:
                user.set_password(uinfo["password"])
                user.is_staff = uinfo["is_staff"]
                user.is_superuser = uinfo["is_superuser"]
                user.role = uinfo["role"]
                user.save(update_fields=["password", "role", "is_staff", "is_superuser"])
                created_or_updated = True
        return created_or_updated
    except (OperationalError, ProgrammingError):
        return False
