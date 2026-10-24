web: python backend/manage.py migrate --noinput && gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT --chdir backend
