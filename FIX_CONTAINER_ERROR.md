# Fix Docker Compose ContainerConfig Error

## Problem
`docker-compose up -d --force-recreate` is failing with `KeyError: 'ContainerConfig'`. This is a known issue with older docker-compose versions when containers are in a bad state.

## Solution

### Step 1: Stop and Remove Containers

```bash
cd /var/www/vvv-frontpage

# Stop all containers
docker-compose down

# Remove any orphaned containers
docker-compose rm -f
```

### Step 2: Verify Environment File

Check that `SECURE_SSL_REDIRECT=False` is correctly set (not truncated):

```bash
cat env/backend.env | grep SECURE_SSL_REDIRECT
```

If it shows `SECURE_SSL_REDIRECT=Fals` or is missing, fix it:

```bash
# Edit the file
nano env/backend.env

# Make sure these lines exist and are correct:
SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
```

### Step 3: Start Containers Fresh

```bash
# Start all containers (this will create them fresh)
docker-compose up -d

# Wait a few seconds for services to start
sleep 10

# Check container status
docker-compose ps
```

### Step 4: Verify Django Settings

```bash
# Check if Django is reading the setting correctly
docker-compose exec backend python -c "from django.conf import settings; print('SECURE_SSL_REDIRECT:', settings.SECURE_SSL_REDIRECT)"
```

Should output: `SECURE_SSL_REDIRECT: False`

### Step 5: Test API

```bash
curl -I http://veveve.dk/api/health
```

Should now return `200 OK` instead of `301 Moved Permanently`.

## Alternative: Restart Only Backend

If you only need to restart the backend (and other containers are fine):

```bash
# Stop and remove only backend
docker-compose stop backend
docker-compose rm -f backend

# Start backend fresh
docker-compose up -d backend

# Wait and test
sleep 5
curl -I http://veveve.dk/api/health
```

## Note

The `ContainerConfig` error typically happens when:
- Docker Compose version is older (1.29.2 in this case)
- Containers were created with a different docker-compose version
- Container metadata is corrupted

The solution is to remove and recreate the containers, which we do with `docker-compose down` followed by `docker-compose up -d`.

