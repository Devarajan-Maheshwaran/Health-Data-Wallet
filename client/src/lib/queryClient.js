import { QueryClient } from '@tanstack/react-query';
import { toQueryString } from './utils';

/**
 * Check if response is ok and throw error if not
 * @param {Response} res - Fetch response
 * @returns {Promise<Response>} - The response if ok
 * @throws {Error} - Error with response message if not ok
 */
async function throwIfResNotOk(res) {
  if (!res.ok) {
    let errorMessage;
    try {
      const data = await res.json();
      errorMessage = data.message || data.error || `Request failed with status ${res.status}`;
    } catch (e) {
      errorMessage = `Request failed with status ${res.status}`;
    }
    throw new Error(errorMessage);
  }
  return res;
}

/**
 * Make API request with error handling
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - JSON response
 */
export async function apiRequest(
  url,
  { body, headers = {}, query = {}, ...customOptions } = {}
) {
  const options = {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...customOptions,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  // Add query params if they exist
  const queryString = Object.keys(query).length ? `?${toQueryString(query)}` : '';
  const fullUrl = `${url}${queryString}`;

  try {
    const res = await fetch(fullUrl, options);
    await throwIfResNotOk(res);
    
    // Check if response has content
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    
    return {};
  } catch (error) {
    console.error(`API request error for ${url}:`, error);
    throw error;
  }
}

/**
 * Create a query function for TanStack Query
 * @param {Object} options - Query options
 * @returns {Function} - Query function
 */
export const getQueryFn = (options = {}) => {
  return async ({ queryKey }) => {
    // First item in array is the path, rest are params
    const [path, params] = Array.isArray(queryKey) ? queryKey : [queryKey];
    
    // For GET requests, params are sent as query parameters
    const query = params || {};
    
    return apiRequest(path, { method: 'GET', query, ...options });
  };
};

/**
 * Create TanStack Query client with default options
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      queryFn: getQueryFn(),
    },
  },
});