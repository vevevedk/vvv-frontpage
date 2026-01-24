# Fix Nginx Syntax Error

The error shows a `location` directive is not allowed at line 81. This means the ACME challenge block was added in the wrong place (probably outside a `server` block or in a commented section).

## Quick Fix

Run these commands on the server:

```bash
# 1. Check what's on line 81
sudo sed -n '75,85p' /etc/nginx/sites-available/vvv-frontpage

# 2. View the full config structure around the problematic area
sudo sed -n '1,90p' /etc/nginx/sites-available/vvv-frontpage

# 3. Check if there's a server block that's not properly closed
sudo grep -n "server {" /etc/nginx/sites-available/vvv-frontpage
sudo grep -n "}" /etc/nginx/sites-available/vvv-frontpage | tail -10
```

## Proper Fix

The location block needs to be INSIDE the `server` block, right after `server_name` but BEFORE the closing brace of the server block.

```bash
# Edit the config
sudo vim /etc/nginx/sites-available/vvv-frontpage
```

Look for the structure. It should be:
```nginx
server {
    server_name veveve.dk www.veveve.dk;
    
    # ACME challenge block should be HERE
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
    }
    
    # Other location blocks...
    location /api/ {
        ...
    }
    
    listen 80;
}  # <-- Make sure server block is closed here
```

The location block MUST be:
- Inside a `server { ... }` block
- After `server_name` line
- Before the closing `}` of the server block
- NOT inside comments `# ... #`
