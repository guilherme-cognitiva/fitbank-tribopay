import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_URL = 'http://localhost:3001/api';

interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
}

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const makeRequest = useCallback(async (
    endpoint: string,
    options: ApiOptions = {}
  ) => {
    const { requireAuth = true, ...fetchOptions } = options;
    
    setLoading(true);
    setError(null);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      };

      if (requireAuth && token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Check for API-level errors even with 200 OK status
      if (data.success === false && data.error) {
        throw new Error(data.error.description || data.error.code || 'API request failed');
      }
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  return { makeRequest, loading, error };
};