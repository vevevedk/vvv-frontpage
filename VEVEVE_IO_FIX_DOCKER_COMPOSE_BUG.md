# Fix Docker Compose Bug - Workaround

**Issue**: Docker Compose has a bug preventing container recreation  
**Error**: `KeyError: 'ContainerConfig'`  
**Solution**: Work around the bug or manually create container

---

## Option 1: Check Running Containers

First, see what's actually running:

```bash
# List all containers (running and stopped)
docker ps -a | grep backend

# Get the actual container name/ID
docker ps | grep backend
```

---

## Option 2: Restart All Services (Sometimes Works)

Sometimes restarting all services forces a reload:

```bash
cd /var/www/vvv-frontpage

# Restart all services
docker-compose restart

# Check if env vars are loaded
docker ps | grep backend
# Then check env vars with the actual container name
```

---

## Option 3: Manually Set Environment Variables in Running Container

As a temporary workaround, we can set env vars directly (not ideal, but works):

```bash
# Find backend container
BACKEND_CONTAINER=$(docker ps | grep backend | awk '{print $1}')

# This won't work for env vars, but we can check what's loaded
docker exec $BACKEND_CONTAINER printenv | grep ALLOWED_HOSTS
```

Actually, we can't change env vars in a running container. We need to recreate it.

---

## Option 4: Use Docker Run Directly (Bypass docker-compose)

If docker-compose keeps failing, we can manually create the container:

```bash
cd /var/www/vvv-frontpage

# Get the image name
docker images | grep backend

# Get network name
docker network ls | grep vvv

# Manually run the container with env file
# (This is complex, better to fix docker-compose issue)
```

---

## Option 5: Fix Docker Compose Issue

The error suggests a corrupted container state. Try:

```bash
# Remove all stopped containers
docker container prune -f

# Try again
docker-compose up -d backend
```

---

## Option 6: Check Docker Compose Version

The error might be due to docker-compose version:

```bash
docker-compose --version

# If it's old, might need to update or use 'docker compose' (newer syntax)
docker compose version
```

---

## Option 7: Simplest - Just Restart and Check

Since the container is running, maybe a simple restart will work:

```bash
# Restart backend
docker-compose restart backend

# Check logs to see if it picked up new config
docker-compose logs backend | tail -10

# Test API
curl https://veveve.io/api/health
```

If it still shows the error, the env vars definitely aren't loaded.

---

**Next Action**: Try Option 5 (prune containers) first, then Option 7 (restart and check logs).
