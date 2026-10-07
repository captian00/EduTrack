import { apiClient } from '@/lib/api/api-client';

export type HealthResponse = {
  status: 'ok';
  timestamp: string;
};

export async function getApiHealth() {
  const response = await apiClient.get<HealthResponse>('/health');
  return response.data;
}
