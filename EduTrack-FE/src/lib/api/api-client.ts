import axios from 'axios';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

function apiErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) return 'Đã xảy ra lỗi. Vui lòng thử lại.';
  const data = error.response?.data as
    | { message?: string | string[]; error?: string }
    | undefined;
  if (Array.isArray(data?.message)) return data.message.join(', ');
  if (typeof data?.message === 'string') return data.message;
  if (typeof data?.error === 'string') return data.error;
  if (!error.response)
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối.';
  return 'Yêu cầu không thành công. Vui lòng thử lại.';
}

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
    } else if (typeof window !== 'undefined' && !axios.isCancel(error)) {
      toast.error(apiErrorMessage(error));
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
