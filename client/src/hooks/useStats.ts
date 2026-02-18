import useSWR from 'swr';
import { apiService } from '../services/api';
import { Stats } from '../types';

export const useStats = () => {
  const { data, error, isLoading, mutate } = useSWR<Stats>(
    'stats',
    apiService.getStats,
    {
      refreshInterval: 120000, // Refresh every 2 minutes
      revalidateOnFocus: true,
    }
  );

  return {
    stats: data ?? null,
    isLoading,
    error: error?.message || null,
    refresh: mutate,
  };
};
