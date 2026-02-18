import useSWR from 'swr';
import { apiService } from '../services/api';
import { Staff } from '../types';

export const useStaff = () => {
  const { data, error, isLoading, mutate } = useSWR<Staff[]>(
    'staff',
    apiService.getStaff,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );

  const updateStaff = async (id: string, updates: Partial<Staff>) => {
    try {
      await apiService.updateStaff(id, updates);
      mutate(); // Refresh the data
    } catch (error) {
      console.error('Failed to update staff:', error);
      throw error;
    }
  };

  const createStaff = async (staffData: Partial<Staff> & { autoGeneratePassword?: boolean; sendCredentials?: boolean }) => {
    try {
      const result = await apiService.createStaff(staffData);
      mutate(); // Refresh the data
      return result;
    } catch (error) {
      console.error('Failed to create staff:', error);
      throw error;
    }
  };

  const deleteStaff = async (id: string) => {
    try {
      await apiService.deleteStaff(id);
      mutate(); // Refresh the data
    } catch (error) {
      console.error('Failed to delete staff:', error);
      throw error;
    }
  };

  return {
    staff: data || [],
    isLoading,
    error,
    updateStaff,
    createStaff,
    deleteStaff,
    refresh: mutate,
  };
};
