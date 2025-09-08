# Dev Notes - 2025-05-29

## Summary of Work Completed

### 1. Environment Configuration
- Standardized environment variable files:
  - Renamed `.env.local` to `.env` for local development.
  - Adopted `.env.prod` for production configuration.
  - Updated `.gitignore` to exclude both files.
- Ensured `DJANGO_ALLOWED_HOSTS` is set in `.env` for Django backend compatibility.

### 2. Backend (Django)
- Identified and fixed `ALLOWED_HOSTS` misconfiguration that prevented server startup.
- Confirmed backend can be started with:
  ```bash
  python manage.py runserver 8001
  ```
- Verified backend is accessible at `http://127.0.0.1:8001/api`.

### 3. Frontend (Next.js)
- Confirmed frontend is running at `http://localhost:3000`.
- Ensured environment variables are loaded correctly for local development.

### 4. User Authentication & Management
- Tested registration and login flows.
- Identified and fixed issues with API connectivity ("Failed to fetch" due to backend not running or misconfigured).
- Confirmed registration and login work once backend is running and configured.

### 5. Project Structure & Best Practices
- Discussed and implemented a simplified environment variable strategy.
- Cleaned up old/unused environment files for clarity.
- Documented the process for starting both frontend and backend servers.

### 6. Next Steps
- Continue development of user dashboard and management features.
- Add tracking/analytics models and endpoints in the future.
- Maintain clear separation between local and production environment settings.

---

**End of 2025-05-29 Dev Notes** 