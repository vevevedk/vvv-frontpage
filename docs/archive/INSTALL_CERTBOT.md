# Install Certbot for SSL Certificates

## Problem
Certbot is not installed on the server.

## Solution

### Install Certbot and Nginx Plugin

**On the server (as root or with sudo):**

```bash
# Update package list
sudo apt update

# Install certbot and nginx plugin
sudo apt install -y certbot python3-certbot-nginx

# Verify installation
certbot --version
```

### Configure SSL (After Installation)

Once certbot is installed, you can configure SSL:

```bash
sudo certbot --nginx -d veveve.dk -d www.veveve.dk
```

This will:
1. Request SSL certificates from Let's Encrypt
2. Automatically configure Nginx to use HTTPS
3. Set up automatic renewal

### Automatic Renewal

Certbot sets up automatic renewal via systemd timer. Verify it's enabled:

```bash
sudo systemctl status certbot.timer
```

Renewal should happen automatically, but you can test it:

```bash
sudo certbot renew --dry-run
```

## Notes

- Certbot requires port 80 to be open for the HTTP-01 challenge
- The domain must be pointing to this server (DNS already configured ✅)
- Certificates expire every 90 days, but auto-renewal handles this

