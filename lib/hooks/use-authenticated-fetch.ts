'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback } from 'react';

/**
 * Custom hook for making authenticated API requests.
 *
 * For same-origin requests, Clerk's session cookie is usually passed automatically.
 * However, when a tab loses focus or data is fetched in the background, the cookie
 * may not be included. This hook explicitly passes the session token as a Bearer
 * token in the Authorization header to ensure all requests are authenticated.
 *
 * @see https://clerk.com/docs/guides/development/making-requests
 */
export function useAuthenticatedFetch() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const authenticatedFetch = useCallback(
    async <T = unknown>(
      url: string,
      options?: RequestInit
    ): Promise<{ data: T | null; error: string | null; status: number }> => {
      // Wait for auth to load
      if (!isLoaded) {
        return { data: null, error: 'Auth not loaded', status: 0 };
      }

      // Check if user is signed in
      if (!isSignedIn) {
        return { data: null, error: 'Not authenticated', status: 401 };
      }

      try {
        // Get the session token
        const token = await getToken();

        if (!token) {
          return { data: null, error: 'No session token', status: 401 };
        }

        // Merge headers with Authorization
        const headers = new Headers(options?.headers);
        headers.set('Authorization', `Bearer ${token}`);
        headers.set('Content-Type', 'application/json');

        const response = await fetch(url, {
          ...options,
          headers,
        });

        if (!response.ok) {
          const errorText = await response.text();
          return {
            data: null,
            error: `API Error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`,
            status: response.status
          };
        }

        const data = await response.json();
        return { data: data as T, error: null, status: response.status };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { data: null, error: message, status: 0 };
      }
    },
    [getToken, isLoaded, isSignedIn]
  );

  /**
   * Simple fetch that returns JSON data or throws on error.
   * Use this for simpler use cases where you handle errors in try/catch.
   */
  const fetchWithAuth = useCallback(
    async <T = unknown>(url: string, options?: RequestInit): Promise<T> => {
      if (!isLoaded) {
        throw new Error('Auth not loaded');
      }

      if (!isSignedIn) {
        throw new Error('Not authenticated');
      }

      const token = await getToken();

      if (!token) {
        throw new Error('No session token');
      }

      const headers = new Headers(options?.headers);
      headers.set('Authorization', `Bearer ${token}`);
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },
    [getToken, isLoaded, isSignedIn]
  );

  return {
    authenticatedFetch,
    fetchWithAuth,
    isLoaded,
    isSignedIn,
  };
}
