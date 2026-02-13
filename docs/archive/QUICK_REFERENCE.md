# Quick Reference Guide

Fast reference for the most commonly used components and utilities.

---

## 🎨 Common UI Patterns

### Loading State
```tsx
import { PageLoader } from '@/components/ui/LoadingSpinner';

if (loading) return <PageLoader label="Loading..." />;
```

### Error State
```tsx
import ErrorState from '@/components/ui/ErrorState';

if (error) return <ErrorState type="network" onRetry={refetch} />;
```

### Success Notification
```tsx
import { useToast } from '@/components/ui/Toast';

const { showSuccess } = useToast();
showSuccess('Saved!', 'Your changes have been saved');
```

### Button with Loading
```tsx
import Button from '@/components/ui/Button';

<Button loading={isSaving} onClick={handleSave}>
  Save Changes
</Button>
```

### Cached API Call
```tsx
import { useCachedApi } from '@/lib/cache';

const { data, loading, error } = useCachedApi<MyType>('/api/endpoint');
```

---

## 📦 Complete Data Component Pattern

```tsx
import { useCachedApi } from '@/lib/cache';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import ErrorState from '@/components/ui/ErrorState';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';

function MyComponent() {
  const { data, loading, error, mutate } = useCachedApi('/api/data');
  const { showSuccess, showError } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveData();
      await mutate(); // Refresh cache
      showSuccess('Success!', 'Data saved');
    } catch (err) {
      showError('Error', 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState type="network" onRetry={mutate} />;

  return (
    <div>
      {/* Your content */}
      <Button loading={saving} onClick={handleSave}>
        Save
      </Button>
    </div>
  );
}
```

---

## 🚀 Development Commands

```bash
# Start dev environment
docker-compose -f docker-compose.dev.yml up

# Frontend only
npm run dev

# Run migrations
docker-compose -f docker-compose.dev.yml exec backend python manage.py migrate

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Access database
docker-compose -f docker-compose.dev.yml exec postgres psql -U vvv_user -d vvv_database_dev

# Stop everything
docker-compose -f docker-compose.dev.yml down
```

---

## 🎨 Design Tokens

```css
/* Colors */
--color-primary
--color-secondary
--color-success
--color-warning
--color-error
--color-info

/* Spacing */
--spacing-xs    /* 4px */
--spacing-sm    /* 8px */
--spacing-md    /* 16px */
--spacing-lg    /* 24px */
--spacing-xl    /* 32px */

/* Typography */
--font-size-xs  /* 12px */
--font-size-sm  /* 14px */
--font-size-base /* 16px */
--font-size-lg  /* 18px */

/* Shadows */
--shadow-sm
--shadow-md
--shadow-lg
```

---

## 📁 File Locations

| Component | Location |
|-----------|----------|
| Loading Spinner | `components/ui/LoadingSpinner.tsx` |
| Toast | `components/ui/Toast.tsx` |
| Skeleton | `components/ui/SkeletonLoader.tsx` |
| Error State | `components/ui/ErrorState.tsx` |
| Error Boundary | `components/ui/ErrorBoundary.tsx` |
| Button | `components/ui/Button.tsx` |
| Lazy Chart | `components/ui/LazyChart.tsx` |
| API Cache | `lib/cache.ts` |
| Env Validation | `lib/env.ts` |
| Design Tokens | `styles/design-tokens.css` |

---

## 🔗 Useful Links

- [Implementation Guide](IMPLEMENTATION_GUIDE.md) - Detailed usage
- [Local Development](LOCAL_DEVELOPMENT.md) - Setup guide
- [Improvement Plan](20251014-improvement-plan.md) - Roadmap
- [Changes](CHANGES.md) - What's new
- [Deploy README](DEPLOY_README.md) - Deployment guide


