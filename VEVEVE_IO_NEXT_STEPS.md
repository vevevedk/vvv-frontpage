# veveve.io - Next Steps After Domain Purchase

**Status**: Domain purchased ✅  
**Next Actions**: DNS setup and initial deployment

---

## ✅ Completed

- [x] Domain purchased: veveve.io
- [x] Design tokens created (`styles/veveve-io-tokens.css`)
- [x] English frontpage structure created (`pages/io/index.tsx`)
- [x] Domain-based routing middleware created (`middleware.ts`)
- [x] Nginx configuration template created (`deploy/veveve-io.conf`)
- [x] Next.js config updated (image domains)

---

## 🚀 Immediate Next Steps

### Step 1: Set Up DNS (CRITICAL)

**Where did you purchase the domain?**
- If Namecheap/GoDaddy/etc: Update nameservers or add A records
- If Cloudflare: Already configured, just add A records

**DNS Records Needed**:
```
Type  Name            Value           TTL
A     veveve.io       143.198.105.78  300
A     www.veveve.io   143.198.105.78  300
```

**Quick Setup Options**:

#### Option A: DigitalOcean DNS (Simplest)
1. Go to DigitalOcean → Networking → Domains
2. Add domain: `veveve.io`
3. Create A records (as shown above)
4. Update nameservers at your registrar to DigitalOcean's

#### Option B: Cloudflare DNS (Recommended - Free & Fast)
1. Add site to Cloudflare: `veveve.io`
2. Cloudflare will provide nameservers
3. Update nameservers at your registrar
4. Add A records in Cloudflare:
   - `veveve.io` → `143.198.105.78`
   - `www.veveve.io` → `143.198.105.78`

**Verify DNS** (after setup):
```bash
dig veveve.io +short
# Should return: 143.198.105.78
```

---

### Step 2: Set Up Nginx on Server

**SSH to server**:
```bash
ssh vvv-web-deploy@143.198.105.78
```

**Copy Nginx config**:
```bash
cd /var/www/vvv-frontpage
sudo cp deploy/veveve-io.conf /etc/nginx/sites-available/veveve-io
sudo ln -s /etc/nginx/sites-available/veveve-io /etc/nginx/sites-enabled/
```

**Test and reload**:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

### Step 3: Set Up SSL Certificate

**After DNS propagates** (wait 5 min - 1 hour):

```bash
# Create certbot directory
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot

# IMPORTANT: Add ACME challenge to nginx config BEFORE running certbot
sudo vim /etc/nginx/sites-available/veveve-io
# Add after server_name line:
#   location /.well-known/acme-challenge/ {
#       root /var/www/certbot;
#       try_files $uri =404;
#   }

# Test and reload
sudo nginx -t
sudo systemctl reload nginx

# Run certbot
sudo certbot --nginx -d veveve.io -d www.veveve.io
```

**See `SSL_MIGRATION_GUIDE.md` for detailed SSL setup.**

---

### Step 4: Test Locally First

**Before deploying to production, test locally**:

```bash
# In your local development environment
# Update /etc/hosts (or use localhost with port)
# Test the routing logic
```

**Or test on server** (after DNS/SSL setup):
```bash
curl http://veveve.io
curl https://veveve.io
```

---

## 📝 Code Structure Created

### Files Created

1. **`styles/veveve-io-tokens.css`**
   - Design tokens for veveve.io brand
   - Color palette (Tech Blue, Growth Teal, Energy Coral)
   - Typography, spacing, shadows

2. **`pages/io/index.tsx`**
   - English frontpage for veveve.io
   - Hero, Features, Benefits, CTA sections
   - Responsive design
   - SEO optimized

3. **`middleware.ts`**
   - Domain-based routing
   - veveve.io → English frontpage
   - veveve.dk → Danish frontpage
   - Redirects for login/API

4. **`deploy/veveve-io.conf`**
   - Nginx configuration template
   - Ready for SSL setup

### Files Updated

1. **`next.config.js`**
   - Added veveve.io to image domains

---

## 🔧 What Still Needs to Be Done

### Immediate (This Week)
- [ ] **Set up DNS** (Step 1 above)
- [ ] **Configure Nginx** (Step 2 above)
- [ ] **Set up SSL** (Step 3 above)
- [ ] **Test domain routing** locally

### Short Term (Next Week)
- [ ] Polish English frontpage content
- [ ] Create veveve.io-specific components
- [ ] Update login page for veveve.io
- [ ] Test authentication flow
- [ ] Update backend ALLOWED_HOSTS

### Medium Term (Week 3-4)
- [ ] Migrate login system
- [ ] Update veveve.dk to remove login
- [ ] Full integration testing
- [ ] Launch!

---

## 🎨 Design Notes

### Current Design Tokens
- **Primary**: #0066CC (Tech Blue)
- **Secondary**: #00CC99 (Growth Teal)
- **Accent**: #FF6B6B (Energy Coral)

### Frontpage Content
The English frontpage includes:
- Hero section with clear value prop
- Features section (3 key features)
- Benefits section with stats
- CTA section
- Footer

**Content can be refined** - this is a starting point.

---

## 🧪 Testing Checklist

Once DNS is set up:

- [ ] `veveve.io` resolves to server IP
- [ ] `www.veveve.io` resolves to server IP
- [ ] HTTP accessible: `curl http://veveve.io`
- [ ] SSL certificate obtained
- [ ] HTTPS accessible: `curl https://veveve.io`
- [ ] English frontpage shows on veveve.io
- [ ] Danish frontpage still shows on veveve.dk
- [ ] Login redirects work correctly

---

## 📞 Need Help?

**DNS Issues?**
- Check `VEVEVE_IO_DNS_SETUP.md` for detailed instructions
- Verify with: `dig veveve.io +short`

**SSL Issues?**
- Check `SSL_MIGRATION_GUIDE.md` for troubleshooting
- Remember: ACME challenge location must be in nginx BEFORE certbot

**Code Issues?**
- Check middleware.ts for routing logic
- Verify pages/io/index.tsx renders correctly
- Test locally first if possible

---

**Ready to proceed with DNS setup!** Let me know once DNS is configured and we can continue with Nginx and SSL setup.
