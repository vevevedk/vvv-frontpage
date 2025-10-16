# Local Development Guide

Complete guide for setting up and running VVV Frontpage locally.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 16.x (recommended: 18.x or 20.x)
- **npm** >= 8.x
- **Docker** >= 20.x
- **Docker Compose** >= 2.x
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/vvv-frontpage.git
cd vvv-frontpage
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment

Create environment files from examples:

```bash
# For development with Docker
mkdir -p env
cp .env.example env/backend.dev.env
cp .env.example env/frontend.dev.env

# Edit the files and set appropriate values
nano env/backend.dev.env
nano env/frontend.dev.env
```

### 4. Start Development Environment

**Option A: Full Docker Development (Recommended)**

```bash
docker-compose -f docker-compose.dev.yml up
```

This starts:
- PostgreSQL on port 5433
- Redis on port 6380
- Django backend on port 8001
- Next.js frontend on port 3000
- Celery worker
- Celery beat
- MailHog (email testing) on port 8025
- Adminer (database admin) on port 8080

**Option B: Frontend Only (Backend in Docker)**

```bash
# Start backend services
docker-compose -f docker-compose.dev.yml up postgres redis backend

# In another terminal, run frontend locally
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001/api
- **Django Admin**: http://localhost:8001/admin
- **Database Admin**: http://localhost:8080 (Adminer)
- **Email Testing**: http://localhost:8025 (MailHog)

---

## 📋 Environment Variables

### Required Variables

```bash
# Backend (.env or env/backend.dev.env)
DB_HOST=postgres
DB_PORT=5432
DB_NAME=vvv_database_dev
DB_USER=vvv_user
DB_PASSWORD=dev_password

DJANGO_SETTINGS_MODULE=api.settings.dev
SECRET_KEY=your-dev-secret-key
DEBUG=True

REDIS_URL=redis://redis:6379/0
```

```bash
# Frontend (.env.local or env/frontend.dev.env)
NEXT_PUBLIC_API_URL=http://localhost:8001/api
NODE_ENV=development
```

### Optional Variables

See `.env.example` for complete list of optional configuration.

---

## 🛠 Development Commands

### Frontend (Next.js)

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Backend (Django)

```bash
# Run migrations
docker-compose -f docker-compose.dev.yml exec backend python manage.py migrate

# Create superuser
docker-compose -f docker-compose.dev.yml exec backend python manage.py createsuperuser

# Create Django app
docker-compose -f docker-compose.dev.yml exec backend python manage.py startapp app_name

# Run Django shell
docker-compose -f docker-compose.dev.yml exec backend python manage.py shell

# Run tests
docker-compose -f docker-compose.dev.yml exec backend python manage.py test

# Collect static files
docker-compose -f docker-compose.dev.yml exec backend python manage.py collectstatic
```

### Database

```bash
# Access PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres psql -U vvv_user -d vvv_database_dev

# Create database backup
docker-compose -f docker-compose.dev.yml exec postgres pg_dump -U vvv_user vvv_database_dev > backup.sql

# Restore database
docker-compose -f docker-compose.dev.yml exec -T postgres psql -U vvv_user -d vvv_database_dev < backup.sql

# Reset database
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d postgres
docker-compose -f docker-compose.dev.yml exec backend python manage.py migrate
```

### Docker

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up

# Start in detached mode
docker-compose -f docker-compose.dev.yml up -d

# Stop all services
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (⚠️ deletes data)
docker-compose -f docker-compose.dev.yml down -v

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# View logs for specific service
docker-compose -f docker-compose.dev.yml logs -f backend

# Rebuild containers
docker-compose -f docker-compose.dev.yml up --build

# Execute command in container
docker-compose -f docker-compose.dev.yml exec backend bash
```

---

## 🧪 Testing

### Unit Tests (Frontend)

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Integration Tests (Backend)

```bash
docker-compose -f docker-compose.dev.yml exec backend python manage.py test
```

### End-to-End Tests

```bash
# Install Playwright (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui
```

---

## 🐛 Debugging

### Frontend Debugging

1. **Chrome DevTools**
   - Open http://localhost:3000
   - Press F12 to open DevTools
   - Use React DevTools extension for component inspection

2. **VS Code Debugging**
   - Add breakpoints in your code
   - Press F5 to start debugging
   - Configuration is in `.vscode/launch.json`

### Backend Debugging

1. **Django Debug Toolbar**
   - Enabled automatically in development mode
   - Shows at http://localhost:8001/admin

2. **Container Logs**
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f backend
   ```

3. **Python Debugger**
   ```python
   import pdb; pdb.set_trace()
   ```

---

## 📁 Project Structure

```
vvv-frontpage/
├── backend/              # Django backend
│   ├── api/             # Main Django app
│   ├── users/           # User management
│   ├── woocommerce/     # WooCommerce integration
│   └── pipelines/       # Data pipelines
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── analytics/      # Analytics components
│   ├── woocommerce/    # WooCommerce components
│   └── layouts/        # Layout components
├── pages/              # Next.js pages
│   ├── api/           # API routes
│   ├── analytics/     # Analytics pages
│   └── woocommerce/   # WooCommerce pages
├── lib/               # Utility libraries
│   ├── api.ts         # API client
│   ├── auth/          # Authentication
│   ├── cache.ts       # Caching utilities
│   └── env.ts         # Environment validation
├── styles/            # CSS styles
├── public/            # Static assets
├── env/              # Environment files
└── docker-compose.dev.yml  # Development Docker setup
```

---

## 🔧 Troubleshooting

### Port Already in Use

```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### Database Connection Error

```bash
# Restart PostgreSQL
docker-compose -f docker-compose.dev.yml restart postgres

# Check PostgreSQL logs
docker-compose -f docker-compose.dev.yml logs postgres
```

### npm Install Fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Docker Build Fails

```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose -f docker-compose.dev.yml build --no-cache
```

### Hot Reload Not Working

```bash
# In docker-compose.dev.yml, ensure these are set:
environment:
  - WATCHPACK_POLLING=true
  - CHOKIDAR_USEPOLLING=true
```

---

## 🎨 Code Style

### TypeScript/React

- Use TypeScript for type safety
- Follow Airbnb style guide
- Use functional components with hooks
- Use Tailwind CSS for styling

### Python/Django

- Follow PEP 8 style guide
- Use type hints where possible
- Write docstrings for functions
- Use Django best practices

### Linting

```bash
# Frontend
npm run lint

# Fix linting issues
npm run lint -- --fix

# Backend
docker-compose -f docker-compose.dev.yml exec backend flake8
```

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Django Documentation](https://docs.djangoproject.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

## 💡 Tips for Efficient Development

1. **Use Hot Reload**: Changes should auto-reload in both frontend and backend
2. **Use Docker Volumes**: Code is mounted so changes reflect immediately
3. **Use MailHog**: Test emails without sending real ones
4. **Use Adminer**: Easy database management UI
5. **Check Logs Often**: `docker-compose logs -f` is your friend
6. **Use VS Code Extensions**:
   - ESLint
   - Prettier
   - Python
   - Docker
   - Tailwind CSS IntelliSense

---

## 🆘 Getting Help

- Check the [README.md](README.md) for general information
- Review [DEPLOYMENT.md](DEPLOY_README.md) for deployment help
- Check existing [GitHub Issues](https://github.com/your-org/vvv-frontpage/issues)
- Contact the development team

---

**Happy coding! 🎉**


