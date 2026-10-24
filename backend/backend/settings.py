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
    for h in os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1,.onrender.com,.koyeb.app,.herokuapp.com").split(",")
    if h.strip()
]
# Local Waitress / health checks use 127.0.0.1 even when production .env lists only the public host.
for _local_host in ("127.0.0.1", "localhost", ".onrender.com", ".koyeb.app", ".herokuapp.com"):
    if _local_host not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(_local_host)

# Render external URL if provided:
_render_host = os.environ.get("RENDER_EXTERNAL_HOSTNAME", "").strip()
if _render_host and _render_host not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(_render_host)

# Koyeb public domain if provided:
_koyeb_host = os.environ.get("KOYEB_PUBLIC_DOMAIN", "").strip()
if _koyeb_host and _koyeb_host not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(_koyeb_host)

# Heroku app name if provided:
_heroku_app = os.environ.get("HEROKU_APP_NAME", "").strip()
if _heroku_app:
    ALLOWED_HOSTS.append(f"{_heroku_app}.herokuapp.com")

_csrf = os.environ.get("CSRF_TRUSTED_ORIGINS", "")
CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf.split(",") if o.strip()]
for _trusted in ("https://*.onrender.com", "https://*.koyeb.app", "https://*.herokuapp.com", "https://*.vercel.app"):
    if _trusted not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(_trusted)
if _render_host:
    _render_origin = f"https://{_render_host}"
    if _render_origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(_render_origin)
if _koyeb_host:
    _koyeb_origin = f"https://{_koyeb_host}"
    if _koyeb_origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(_koyeb_origin)
if _heroku_app:
    _heroku_origin = f"https://{_heroku_app}.herokuapp.com"
    if _heroku_origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(_heroku_origin)

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
    'assistant',
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
import dj_database_url

_database_url = os.environ.get("DATABASE_URL")
if _database_url:
    DATABASES = {
        'default': dj_database_url.config(
            default=_database_url,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
elif os.environ.get("MYSQL_HOST") and os.environ.get("MYSQL_HOST") not in ("127.0.0.1", "localhost"):
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
elif os.environ.get("MYSQL_DATABASE") and os.environ.get("MYSQL_USER"):
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
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
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

# CORS: enabled for split hosting (Vercel frontend + Render backend)
CORS_ALLOW_CREDENTIALS = True
_cors = [o.strip() for o in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",") if o.strip()]
if _cors:
    CORS_ALLOWED_ORIGINS = _cors
    CORS_ALLOW_ALL_ORIGINS = False
else:
    CORS_ALLOW_ALL_ORIGINS = True

AUTH_USER_MODEL = 'users.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}


# Default user: created on `manage.py migrate` (post_migrate) if missing.
# Set DEFAULT_USER_SEED=false in production if you wish to disable auto-seeding.
DEFAULT_USER_SEED = _env_bool("DEFAULT_USER_SEED", True)
DEFAULT_USER_EMAIL = os.environ.get("DEFAULT_USER_EMAIL", "admin@sepicp.com").strip()
DEFAULT_USER_USERNAME = os.environ.get("DEFAULT_USER_USERNAME", "admin").strip()
DEFAULT_USER_PASSWORD = os.environ.get("DEFAULT_USER_PASSWORD", "Admin@123456")
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
