"""
Django settings for backend project.

Uses Django 4.2 LTS (compatible with MariaDB 10.4.32).

For more information on this file, see
https://docs.djangoproject.com/en/4.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.2/ref/settings/
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def _env_bool(key: str, default: bool = False) -> bool:
    v = os.environ.get(key, "")
    if v == "":
        return default
    return v.lower() in ("1", "true", "yes", "on")


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-$$b$@to0-y5ju+jdm8+cyoh0pe35e10crl3zt9)n#g$q1r$%bk",
)
DEBUG = _env_bool("DJANGO_DEBUG", True)
ALLOWED_HOSTS = [
    h.strip()
    for h in os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if h.strip()
]
# Local Waitress / health checks use 127.0.0.1 even when production .env lists only the public host.
for _local_host in ("127.0.0.1", "localhost"):
    if _local_host not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(_local_host)
_csrf = os.environ.get("CSRF_TRUSTED_ORIGINS", "")
CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf.split(",") if o.strip()]

_fs = os.environ.get("DJANGO_FORCE_SCRIPT_NAME", "").strip()
FORCE_SCRIPT_NAME = _fs if _fs else None


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'users',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'


# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases
# MySQL/MariaDB; default port 3306. Use MYSQL_PORT=3307 for typical XAMPP MariaDB. Django 4.2 supports MariaDB 10.4+.

# MySQL database name: create `sepicp_db` on both local MySQL/MariaDB and the server used by IIS.
# Override host/port/user/password in CI/CD or IIS via MYSQL_* env vars (see .env.example).
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ.get('MYSQL_DATABASE', 'sepicp_db'),
        'USER': os.environ.get('MYSQL_USER', 'root'),
        'PASSWORD': os.environ.get('MYSQL_PASSWORD', ''),
        'HOST': os.environ.get('MYSQL_HOST', '127.0.0.1'),
        'PORT': os.environ.get('MYSQL_PORT', '3306'),
    }
}


# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/settings/#internationalization

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = os.environ.get("DJANGO_STATIC_URL", "static/")
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS (same-origin SPA under IIS does not need browser CORS; set origins for split hosting)
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False
    _cors = [o.strip() for o in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",") if o.strip()]
    if _cors:
        CORS_ALLOWED_ORIGINS = _cors
    else:
        CORS_ALLOWED_ORIGINS = []
        for h in ALLOWED_HOSTS:
            if not h or h == "*" or h == "testserver":
                continue
            if h in ("localhost", "127.0.0.1"):
                CORS_ALLOWED_ORIGINS.extend([f"http://{h}", f"https://{h}"])
            else:
                CORS_ALLOWED_ORIGINS.append(f"https://{h}")
    if not CORS_ALLOWED_ORIGINS:
        CORS_ALLOW_ALL_ORIGINS = True

AUTH_USER_MODEL = 'users.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}


# Default user: created on `manage.py migrate` (post_migrate) if missing.
# Set DEFAULT_USER_SEED=false in production after first bootstrap.
DEFAULT_USER_SEED = _env_bool("DEFAULT_USER_SEED", False)
DEFAULT_USER_EMAIL = os.environ.get("DEFAULT_USER_EMAIL", "").strip()
DEFAULT_USER_USERNAME = os.environ.get("DEFAULT_USER_USERNAME", "").strip()
DEFAULT_USER_PASSWORD = os.environ.get("DEFAULT_USER_PASSWORD", "")
DEFAULT_USER_IS_STAFF = _env_bool("DEFAULT_USER_IS_STAFF", True)
DEFAULT_USER_IS_SUPERUSER = _env_bool("DEFAULT_USER_IS_SUPERUSER", True)

# File logging for IIS (HttpPlatform stdout needs a pre-existing logs folder; Django log is always here).
_LOG_DIR = BASE_DIR / "logs"
_LOG_FILE = _LOG_DIR / "django.log"
try:
    _LOG_DIR.mkdir(parents=True, exist_ok=True)
except OSError:
    _LOG_FILE = None

if _LOG_FILE is not None:
    LOGGING = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "std": {
                "format": "[%(asctime)s] %(levelname)s %(name)s: %(message)s",
            },
        },
        "handlers": {
            "django_file": {
                "level": "DEBUG" if DEBUG else "INFO",
                "class": "logging.FileHandler",
                "filename": str(_LOG_FILE),
                "formatter": "std",
            },
        },
        "loggers": {
            "django.request": {
                "handlers": ["django_file"],
                "level": "ERROR",
                "propagate": False,
            },
        },
    }