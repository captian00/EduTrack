import axios from 'axios';
import { createClient } from '@/lib/supabase/client';

export const apiClient = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1',
  timeout: 15_000,
});

apiClient.interceptors.request.use(
  async (config) => {
    const { data } = await createClient().auth.getSession();
    if (data.session?.access_token)
      config.headers.Authorization = `Bearer ${data.session.access_token}`;
    return config;
  },
  (error: unknown) => Promise.reject(error),
);
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== 'undefined'
    ) {
      await createClient().auth.signOut();
      window.location.replace('/login');
    }
    return Promise.reject(error);
  },
);

export function setApiAccessToken(token?: string) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete apiClient.defaults.headers.common.Authorization;
}
