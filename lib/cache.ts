/**
 * API Response Caching with SWR
 * 
 * This module provides a caching layer for API requests using SWR (stale-while-revalidate)
 * to improve performance and reduce unnecessary network requests.
 */

import useSWR, { SWRConfiguration, mutate as globalMutate } from 'swr';
import { api } from './api';

// Default SWR configuration
const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  shouldRetryOnError: true,
  loadingTimeout: 3000,
  focusThrottleInterval: 5000,
};

/**
 * Fetcher function for SWR
 */
async function fetcher<T>(url: string): Promise<T> {
  const response = await api.get<T>(url);
  if (response.error) {
    throw new Error(response.error.message);
  }
  if (!response.data) {
    throw new Error('No data received');
  }
  return response.data;
}

/**
 * Hook for cached GET requests
 */
export function useCachedApi<T>(
  url: string | null,
  config?: SWRConfiguration
) {
  const { data, error, isValidating, mutate } = useSWR<T>(
    url,
    fetcher,
    { ...defaultConfig, ...config }
  );

  return {
    data,
    error,
    loading: !data && !error,
    isValidating,
    mutate,
  };
}

/**
 * Hook for cached GET requests with automatic refresh
 */
export function useCachedApiWithRefresh<T>(
  url: string | null,
  refreshInterval: number = 30000,
  config?: SWRConfiguration
) {
  return useCachedApi<T>(url, {
    ...config,
    refreshInterval,
    revalidateOnFocus: true,
  });
}

/**
 * Hook for paginated API requests
 */
export function usePaginatedApi<T>(
  baseUrl: string,
  page: number = 1,
  pageSize: number = 10,
  config?: SWRConfiguration
) {
  const url = `${baseUrl}?page=${page}&page_size=${pageSize}`;
  return useCachedApi<{
    results: T[];
    count: number;
    next: string | null;
    previous: string | null;
  }>(url, config);
}

/**
 * Invalidate cache for a specific key or pattern
 */
export function invalidateCache(key: string | RegExp) {
  if (typeof key === 'string') {
    return globalMutate(key);
  }
  // Invalidate all keys matching the pattern
  return globalMutate(
    (cacheKey: string) => key.test(cacheKey),
    undefined,
    { revalidate: true }
  );
}

/**
 * Preload data into cache
 */
export async function preloadCache<T>(url: string): Promise<void> {
  try {
    const data = await fetcher<T>(url);
    await globalMutate(url, data, false);
  } catch (error) {
    console.error('Failed to preload cache:', error);
  }
}

/**
 * Clear all cache
 */
export function clearAllCache() {
  return globalMutate(() => true, undefined, { revalidate: false });
}

// Preset cache configurations for different data types
export const cacheConfigs = {
  // Static data that rarely changes
  static: {
    dedupingInterval: 60000, // 1 minute
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  } as SWRConfiguration,

  // User-specific data
  user: {
    dedupingInterval: 5000, // 5 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  } as SWRConfiguration,

  // Real-time data
  realtime: {
    refreshInterval: 5000, // 5 seconds
    dedupingInterval: 1000, // 1 second
    revalidateOnFocus: true,
  } as SWRConfiguration,

  // Analytics data
  analytics: {
    dedupingInterval: 30000, // 30 seconds
    revalidateOnFocus: false,
    focusThrottleInterval: 60000,
  } as SWRConfiguration,
};

// Export commonly used hooks with preset configs
export function useStaticData<T>(url: string | null) {
  return useCachedApi<T>(url, cacheConfigs.static);
}

export function useUserData<T>(url: string | null) {
  return useCachedApi<T>(url, cacheConfigs.user);
}

export function useRealtimeData<T>(url: string | null) {
  return useCachedApi<T>(url, cacheConfigs.realtime);
}

export function useAnalyticsData<T>(url: string | null) {
  return useCachedApi<T>(url, cacheConfigs.analytics);
}


