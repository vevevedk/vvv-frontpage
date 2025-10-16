# Implementation Guide - New UI Components & Improvements

This guide shows how to use the new UI components and improvements added to the project.

---

## 🎨 New UI Components

### 1. LoadingSpinner

**Location**: `components/ui/LoadingSpinner.tsx`

**Usage**:

```tsx
import LoadingSpinner, { PageLoader, InlineLoader, ButtonLoader } from '@/components/ui/LoadingSpinner';

// Basic spinner
<LoadingSpinner size="md" variant="primary" />

// With label
<LoadingSpinner size="lg" label="Loading data..." />

// Full screen
<LoadingSpinner size="xl" label="Processing..." fullScreen />

// Preset components
<PageLoader label="Loading page..." />
<InlineLoader label="Loading..." />
<ButtonLoader />  // For inside buttons
```

**Sizes**: `xs`, `sm`, `md`, `lg`, `xl`  
**Variants**: `primary`, `secondary`, `white`, `gray`

---

### 2. Toast Notifications

**Location**: `components/ui/Toast.tsx`

**Setup** (already done in `_app.tsx`):

```tsx
import { ToastProvider } from '@/components/ui/Toast';

<ToastProvider>
  <YourApp />
</ToastProvider>
```

**Usage**:

```tsx
import { useToast } from '@/components/ui/Toast';

function MyComponent() {
  const { showSuccess, showError, showInfo, showWarning } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      showSuccess('Success!', 'Data saved successfully');
    } catch (error) {
      showError('Error!', 'Failed to save data');
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

---

### 3. Skeleton Loaders

**Location**: `components/ui/SkeletonLoader.tsx`

**Usage**:

```tsx
import {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonChart,
  SkeletonStatsCard,
  SkeletonDashboard,
  SkeletonList
} from '@/components/ui/SkeletonLoader';

// Basic skeleton
<Skeleton width="200px" height="20px" />

// Pre-built skeletons
<SkeletonCard />
<SkeletonTable rows={5} columns={4} />
<SkeletonChart />
<SkeletonStatsCard />
<SkeletonList items={5} />

// Full dashboard skeleton
<SkeletonDashboard />

// In loading states
function MyComponent() {
  const { data, loading } = useFetchData();
  
  if (loading) return <SkeletonCard />;
  
  return <div>{/* render data */}</div>;
}
```

---

### 4. Error States

**Location**: `components/ui/ErrorState.tsx`

**Usage**:

```tsx
import ErrorState, { InlineError, FullPageError } from '@/components/ui/ErrorState';

// Standard error state
<ErrorState
  type="network"
  title="Connection failed"
  message="Unable to connect to server"
  onRetry={handleRetry}
/>

// Types: 'general' | 'network' | 'forbidden' | 'notfound' | 'server'

// Inline error (compact)
<InlineError 
  message="Failed to load data" 
  onRetry={handleRetry} 
/>

// Full page error
<FullPageError
  type="server"
  title="Server Error"
  message="Something went wrong"
  onRetry={() => window.location.reload()}
/>
```

---

### 5. Error Boundary

**Location**: `components/ui/ErrorBoundary.tsx`

**Usage**:

```tsx
import ErrorBoundary from '@/components/ui/ErrorBoundary';

// Wrap components to catch errors
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>

// With custom error handler
<ErrorBoundary
  onError={(error, errorInfo) => {
    console.error('Error caught:', error, errorInfo);
    // Send to error tracking service
  }}
>
  <MyComponent />
</ErrorBoundary>

// Wrap entire app in _app.tsx
function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}
```

---

### 6. Enhanced Button

**Location**: `components/ui/Button.tsx`

**Usage**:

```tsx
import Button, { IconButton } from '@/components/ui/Button';
import { SaveIcon } from '@heroicons/react/24/outline';

// Basic button
<Button variant="primary" size="md">
  Click me
</Button>

// With loading state
<Button 
  variant="primary" 
  loading={isLoading}
  onClick={handleSave}
>
  Save
</Button>

// With icons
<Button 
  variant="outline"
  leftIcon={<SaveIcon className="h-5 w-5" />}
>
  Save Changes
</Button>

// Full width
<Button variant="primary" fullWidth>
  Submit
</Button>

// Icon-only button
<IconButton
  icon={<SaveIcon className="h-5 w-5" />}
  label="Save"
  variant="ghost"
/>
```

**Variants**: `primary`, `secondary`, `outline`, `ghost`, `danger`  
**Sizes**: `xs`, `sm`, `md`, `lg`

---

### 7. Lazy Charts (Progressive Loading)

**Location**: `components/ui/LazyChart.tsx`

**Usage**:

```tsx
import { LineChart, BarChart, PieChart, DoughnutChart } from '@/components/ui/LazyChart';

// Line chart with lazy loading
<LineChart 
  data={chartData}
  options={chartOptions}
  className="h-64"
/>

// Progressive data loading
import { useProgressiveChartData } from '@/components/ui/LazyChart';

function MyChart() {
  const fullData = [/* large dataset */];
  const { displayedData, isLoading } = useProgressiveChartData(fullData, 10, 100);
  
  return (
    <LineChart 
      data={{
        labels: displayedData.map(d => d.label),
        datasets: [{ data: displayedData.map(d => d.value) }]
      }}
    />
  );
}
```

---

## 🔄 API Caching with SWR

**Location**: `lib/cache.ts`

**Note**: Install SWR first: `npm install swr` (requires Node >= 16)

**Usage**:

```tsx
import { useCachedApi, useStaticData, useUserData, useAnalyticsData } from '@/lib/cache';

// Basic cached API call
function MyComponent() {
  const { data, error, loading, mutate } = useCachedApi<MyDataType>('/api/my-endpoint');
  
  if (loading) return <PageLoader />;
  if (error) return <ErrorState onRetry={() => mutate()} />;
  
  return <div>{/* render data */}</div>;
}

// Static data (rarely changes)
const { data } = useStaticData<Settings[]>('/api/settings');

// User data (frequently changes)
const { data } = useUserData<User>('/api/users/me');

// Analytics with auto-refresh
const { data } = useAnalyticsData<AnalyticsData>('/api/analytics/dashboard');

// Invalidate cache
import { invalidateCache } from '@/lib/cache';

function handleUpdate() {
  await updateData();
  invalidateCache('/api/my-endpoint');  // Refresh this endpoint
  invalidateCache(/\/api\/users\/.*/); // Refresh all user endpoints
}
```

---

## 🎨 Design Tokens

**Location**: `styles/design-tokens.css`

**Usage in CSS**:

```css
.my-component {
  color: var(--color-primary);
  background: var(--color-background);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base) var(--transition-timing-default);
}
```

**Utility Classes**:

```tsx
<div className="text-primary bg-secondary rounded-lg shadow-md transition-default">
  Content
</div>

<h1 className="heading-1">Main Heading</h1>
<h2 className="heading-2">Subheading</h2>
<p className="body-text">Body content</p>
<span className="small-text text-muted">Small text</span>
```

---

## 🔒 Environment Validation

**Location**: `lib/env.ts`

**Usage**:

```tsx
import { env, getEnv, isDev, isProd, getApiUrl } from '@/lib/env';

// Access environment variables (type-safe)
const apiUrl = env.NEXT_PUBLIC_API_URL;
const dbHost = getEnv('DB_HOST');

// Check environment
if (isDev) {
  console.log('Development mode');
}

// Get API URL (works on both client and server)
const url = getApiUrl();
```

---

## 🚀 Migration Guide

### Migrating from Old Loading States

**Before**:
```tsx
if (loading) {
  return <div>Loading...</div>;
}
```

**After**:
```tsx
import { PageLoader } from '@/components/ui/LoadingSpinner';

if (loading) {
  return <PageLoader label="Loading data..." />;
}
```

### Migrating to Toast Notifications

**Before**:
```tsx
alert('Success!');
```

**After**:
```tsx
import { useToast } from '@/components/ui/Toast';

const { showSuccess } = useToast();
showSuccess('Success!', 'Operation completed successfully');
```

### Migrating to Cached API Calls

**Before**:
```tsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchData().then(setData).finally(() => setLoading(false));
}, []);
```

**After**:
```tsx
const { data, loading } = useCachedApi('/api/endpoint');
```

---

## 📦 Component Combinations

### Complete Data Loading Pattern

```tsx
import { useCachedApi } from '@/lib/cache';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import ErrorState from '@/components/ui/ErrorState';
import { useToast } from '@/components/ui/Toast';

function MyDataComponent() {
  const { data, error, loading, mutate } = useCachedApi<MyData>('/api/data');
  const { showSuccess, showError } = useToast();
  
  const handleRefresh = async () => {
    try {
      await mutate();
      showSuccess('Refreshed!', 'Data has been updated');
    } catch (err) {
      showError('Error', 'Failed to refresh data');
    }
  };
  
  if (loading) return <PageLoader />;
  if (error) return <ErrorState type="network" onRetry={handleRefresh} />;
  
  return (
    <div>
      {/* Render data */}
    </div>
  );
}
```

---

## 🎯 Best Practices

1. **Always use LoadingSpinner instead of plain text**
2. **Always use Toast for user feedback**
3. **Use Skeleton loaders for better perceived performance**
4. **Wrap risky components in ErrorBoundary**
5. **Use cached API calls to reduce server load**
6. **Use design tokens for consistent styling**
7. **Lazy load charts for better initial load**

---

## 📚 Additional Resources

- See `LOCAL_DEVELOPMENT.md` for development setup
- See `20251014-improvement-plan.md` for complete improvement roadmap
- See individual component files for detailed prop types

---

**Need help?** Check the component source code for complete TypeScript types and examples.


