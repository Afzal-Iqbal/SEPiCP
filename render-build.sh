#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "==> Upgrading pip and installing backend dependencies..."
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt

echo "==> Running collectstatic..."
python backend/manage.py collectstatic --no-input

echo "==> Applying database migrations..."
python backend/manage.py migrate --no-input

echo "==> Backend build completed successfully!"
