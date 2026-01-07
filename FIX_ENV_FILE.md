# Fix Truncated Environment Variable

## Problem
The `SECURE_SSL_REDIRECT` value is truncated to `Fals` instead of `False`.

## Solution

**On the server, run:**

```bash
cd /var/www/vvv-frontpage

# Check the full line
grep -n SECURE_SSL_REDIRECT env/backend.env

# Edit the file
nano env/backend.env
```

**In nano, find the line with `SECURE_SSL_REDIRECT=Fals` and change it to:**

```
SECURE_SSL_REDIRECT=False
```

**Also verify these lines exist (add them if missing):**

```
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
```

**Save and exit:**
- Press `Ctrl+X`
- Press `Y` to confirm
- Press `Enter` to save

**Verify the fix:**

```bash
grep SECURE_SSL_REDIRECT env/backend.env
# Should show: SECURE_SSL_REDIRECT=False
```

**Then start containers:**

```bash
docker-compose up -d
sleep 10
docker-compose ps
```

