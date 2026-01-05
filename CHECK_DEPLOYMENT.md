# Check Deployment Status

## Health Check Failed - What to Check

The health check is failing because it's trying to reach `https://veveve.dk/` but the site isn't responding. This is expected if:

1. **DNS isn't pointing to the new server** (143.198.105.78)
2. **Nginx isn't configured/started**
3. **Services aren't running**
4. **SSL certificate isn't set up**

## Quick Checks on Server

**SSH to the server and run:**

```bash
# Check if Docker containers are running
cd /var/www/vvv-frontpage
docker-compose ps

# Check if services are listening
docker-compose logs --tail=50

# Check Nginx status
sudo systemctl status nginx

# Check if Nginx is configured
ls -la /etc/nginx/sites-available/vvv-frontpage
ls -la /etc/nginx/sites-enabled/vvv-frontpage

# Test Nginx configuration
sudo nginx -t
```

## Next Steps

1. **Check if services are running:**
   ```bash
   docker-compose ps
   ```
   Should show frontend, backend, postgres, redis containers running.

2. **Check Nginx configuration:**
   - Is the config file in `/etc/nginx/sites-available/vvv-frontpage`?
   - Is it symlinked in `/etc/nginx/sites-enabled/`?
   - Is Nginx running?

3. **Check DNS:**
   - Is `veveve.dk` pointing to `143.198.105.78`?
   - Test: `nslookup veveve.dk` or `dig veveve.dk`

4. **Set up SSL (after DNS is correct):**
   ```bash
   sudo certbot --nginx -d veveve.dk
   ```

## Test Locally on Server

**Test if services are responding on the server:**

```bash
# Test frontend (should work if containers are running)
curl http://localhost:3000

# Test backend
curl http://localhost:8001/api/health/

# Test via Nginx (if configured)
curl http://localhost
```

If these work, the issue is DNS/SSL configuration, not the services themselves.

