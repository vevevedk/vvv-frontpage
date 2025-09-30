# Development Guide

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git
- Code editor (VS Code recommended)

### Local Development Setup
```bash
# 1. Clone repository
git clone https://github.com/your-org/vvv-frontpage.git
cd vvv-frontpage

# 2. Copy environment files
cp env/backend.env.example env/backend.env
cp env/frontend.env.example env/frontend.env

# 3. Start development environment
docker-compose up -d --build

# 4. Run migrations
docker-compose exec backend python manage.py migrate

# 5. Create superuser
docker-compose exec backend python manage.py createsuperuser
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001/api/
- **Django Admin**: http://localhost:8001/admin/

## 📁 Project Structure

```
vvv-frontpage/
├── frontend/                 # Next.js application
│   ├── components/          # React components
│   ├── pages/              # Next.js pages
│   ├── lib/                # Utilities and API clients
│   └── styles/             # CSS and styling
├── backend/                 # Django API
│   ├── api/                # Django app
│   ├── authentication/     # Auth system
│   ├── users/              # User management
│   ├── woocommerce/        # WooCommerce integration
│   └── pipelines/          # Data pipelines
├── docs/                   # Documentation
├── deploy/                 # Deployment configs
├── env/                    # Environment files
└── docker-compose.yml      # Docker configuration
```

## 🔧 Development Workflow

### Daily Development
1. **Start services**: `docker-compose up -d`
2. **Check logs**: `docker-compose logs -f backend`
3. **Run tests**: `docker-compose exec backend python manage.py test`
4. **Make changes**: Edit code in your preferred editor
5. **Test changes**: Refresh browser, check API endpoints
6. **Commit changes**: `git add . && git commit -m "Description"`

### Feature Development
1. **Create branch**: `git checkout -b feature/feature-name`
2. **Develop feature**: Make changes, test thoroughly
3. **Update tests**: Add/update tests for new functionality
4. **Update docs**: Update relevant documentation
5. **Create PR**: Submit pull request for review

### Database Changes
```bash
# Create migration
docker-compose exec backend python manage.py makemigrations

# Apply migration
docker-compose exec backend python manage.py migrate

# Check migration status
docker-compose exec backend python manage.py showmigrations
```

## 🧪 Testing

### Backend Testing
```bash
# Run all tests
docker-compose exec backend python manage.py test

# Run specific app tests
docker-compose exec backend python manage.py test woocommerce

# Run with coverage
docker-compose exec backend coverage run --source='.' manage.py test
docker-compose exec backend coverage report
```

### Frontend Testing
```bash
# Run tests (if configured)
npm test

# Run linting
npm run lint

# Type checking
npm run type-check
```

### Integration Testing
```bash
# Test API endpoints
curl -X GET http://localhost:8001/api/
curl -X POST http://localhost:8001/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'

# Test frontend-backend integration
curl -X GET http://localhost:3000/api/test
```

## 🔍 Debugging

### Backend Debugging
```bash
# View logs
docker-compose logs -f backend

# Access Django shell
docker-compose exec backend python manage.py shell

# Check database
docker-compose exec postgres psql -U vvv_user -d vvv_database

# Debug specific issues
docker-compose exec backend python manage.py shell -c "
from woocommerce.models import WooCommerceOrder
print(WooCommerceOrder.objects.count())
"
```

### Frontend Debugging
```bash
# View logs
docker-compose logs -f frontend

# Access container
docker-compose exec frontend sh

# Check environment variables
docker-compose exec frontend env | grep NEXT_PUBLIC
```

### Common Issues
1. **Port conflicts**: Change ports in docker-compose.yml
2. **Database connection**: Check env/backend.env
3. **API not responding**: Check backend logs
4. **Frontend not loading**: Check frontend logs

## 📝 Development Notes

### Current Status (September 30, 2025)
- ✅ WooCommerce pipeline operational (52 orders imported)
- ✅ Database connection issues resolved
- ✅ Docker environment stable
- ✅ Production deployment working

### Recent Achievements
- Fixed database password mismatches
- Resolved Django SSL redirect issues
- Implemented comprehensive deployment scripts
- Restored WooCommerce data sync functionality

### Known Issues
- API test connection endpoint needs trailing slash fix
- Circular import in WooCommerce models (affects shell/admin only)
- Timezone warnings in Django (data still imports correctly)

### Next Priorities
1. Fix API test connection endpoint
2. Implement stock management feature
3. Add comprehensive testing suite
4. Improve error handling and user feedback

## 🚀 Feature Development

### WooCommerce Integration
- **Status**: ✅ Operational
- **Features**: Order sync, analytics, channel reporting
- **Next**: Real-time sync, advanced filtering

### Stock Management
- **Status**: 📋 Planned
- **Features**: GMC integration, Google Ads sync
- **Timeline**: Next 2-4 weeks

### User Management
- **Status**: 🔄 In Progress
- **Features**: Profile management, password reset
- **Next**: Email verification, user settings

## 📚 API Reference

### Authentication Endpoints
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/auth/refresh/` - Token refresh
- `POST /api/auth/logout/` - User logout

### WooCommerce Endpoints
- `GET /api/woocommerce/orders/` - List orders
- `GET /api/woocommerce/analytics/` - Analytics data
- `POST /api/woocommerce/sync/` - Manual sync

### Pipeline Endpoints
- `GET /api/pipelines/` - List pipelines
- `POST /api/pipelines/` - Create pipeline
- `POST /api/pipelines/{id}/test_connection/` - Test connection

## 🔧 Environment Configuration

### Backend Environment (env/backend.env)
```bash
DJANGO_DEBUG=false
DJANGO_SECRET_KEY=your-secret-key
DJANGO_SETTINGS_MODULE=api.settings.docker
ALLOWED_HOSTS=localhost,127.0.0.1,backend,veveve.dk,www.veveve.dk
DB_HOST=postgres
DB_PORT=5432
DB_NAME=vvv_database
DB_USER=vvv_user
DB_PASSWORD=your-db-password
```

### Frontend Environment (env/frontend.env)
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8001
JWT_SECRET=your-jwt-secret
```

## 📖 Additional Resources

- [API Documentation](./api/README.md)
- [Architecture Overview](../architecture/README.md)
- [Troubleshooting Guide](../troubleshooting/README.md)
- [Deployment Guide](../deployment/README.md)

---

*Last Updated: September 30, 2025*
*For development questions, contact the development team.*
