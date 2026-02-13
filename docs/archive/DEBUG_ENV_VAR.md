# Debug Environment Variable Issue

## Problem
Django is reading `SECURE_SSL_REDIRECT: True` even though `env/backend.env` has `SECURE_SSL_REDIRECT=False`.

## Debug Steps

**On the server, check if the environment variable is actually in the container:**

```bash
cd /var/www/vvv-frontpage

# Check what environment variables are actually set in the backend container
docker-compose exec backend env | grep SECURE_SSL_REDIRECT

# Also check the raw value
docker-compose exec backend printenv SECURE_SSL_REDIRECT
```

**If the variable is not set or shows a different value, the issue is that docker-compose isn't loading it correctly.**

## Solution: Use environment: section instead of env_file

The issue might be that `env_file` isn't working as expected. Let's verify the docker-compose.yml is loading the file correctly, or we can add the variables directly to the `environment:` section.

**Option 1: Check if env_file path is correct**

```bash
# Verify the env file exists and is readable
ls -la env/backend.env
cat env/backend.env | grep SECURE_SSL_REDIRECT
```

**Option 2: Add environment variables directly to docker-compose.yml**

We can add them to the `environment:` section as a workaround.

**Option 3: Use lowercase or different format**

`python-decouple` might be case-sensitive or have issues with the value format. Try:

```bash
# In env/backend.env, try:
SECURE_SSL_REDIRECT=0
# or
SECURE_SSL_REDIRECT=false
# (lowercase)
```

Let's first check what's actually in the container.

