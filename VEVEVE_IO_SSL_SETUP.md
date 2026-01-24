# veveve.io SSL Certificate Setup

**Status**: Nginx configured ✅  
**Next**: Set up SSL certificate with certbot

---

## 🚀 SSL Setup Commands

Run these on the server:

```bash
# Ensure certbot directory exists (should already exist from veveve.dk)
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot
sudo chmod -R 755 /var/www/certbot

# Verify ACME challenge location is in nginx config (already done)
grep -A 3 "acme-challenge" /etc/nginx/sites-available/veveve-io

# Run certbot to get SSL certificate
sudo certbot --nginx -d veveve.io -d www.veveve.io
```

**During certbot**:
- It will ask for email (for renewal notices)
- It will ask to agree to terms
- It will ask about redirecting HTTP to HTTPS (choose "2" for redirect)

---

## ✅ Verify SSL Setup

After certbot completes:

```bash
# Check certificate
sudo certbot certificates

# Test HTTPS
curl -I https://veveve.io

# Test HTTP redirect
curl -I http://veveve.io
# Should show 301 redirect to HTTPS
```

---

## 🐛 Troubleshooting

### Certbot Fails with "Invalid response from http://veveve.io/.well-known/acme-challenge/"

**Cause**: DNS not fully propagated or ACME challenge not accessible

**Fix**:
1. Verify DNS: `dig veveve.io +short` should return `143.198.105.78`
2. Test ACME challenge manually:
   ```bash
   sudo mkdir -p /var/www/certbot/.well-known/acme-challenge
   echo "test" | sudo tee /var/www/certbot/.well-known/acme-challenge/test
   curl http://veveve.io/.well-known/acme-challenge/test
   # Should return "test"
   ```
3. If test fails, check Nginx config has the ACME challenge location block

### Certificate Already Exists

If certbot says certificate already exists:
- Choose option to renew/reinstall
- Or use: `sudo certbot --nginx -d veveve.io -d www.veveve.io --force-renewal`

---

## 📋 After SSL is Set Up

Once SSL is working:

1. **Test the site**:
   - Visit: https://veveve.io
   - Should show English frontpage
   - Should have valid SSL certificate

2. **Verify domain routing**:
   - `veveve.io` → English frontpage
   - `veveve.dk` → Danish frontpage

3. **Test API**:
   ```bash
   curl https://veveve.io/api/health
   ```

---

**Ready to run certbot!** The ACME challenge location is already configured in Nginx, so certbot should work smoothly.
