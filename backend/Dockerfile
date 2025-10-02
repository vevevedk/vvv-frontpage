# Backend Dockerfile
FROM python:3.11-slim as base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# App code
COPY . /app/

# Create logs directory
RUN mkdir -p /app/logs

# Expose port - let docker-compose handle the command
EXPOSE 8000
# CMD removed to allow docker-compose to override with custom timeout settings
