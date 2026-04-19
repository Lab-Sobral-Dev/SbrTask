import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { connectSocket, disconnectSocket } from '../services/socket';
import { useAuthStore } from './useAuthStore';
import { auth, notifications as notificationsApi } from '../services/api';

export interface DbNotification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  taskId?: string;
  createdAt: string;
}

export const useNotifications = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll().then((r) => r.data),
    enabled: !!user?.id,
  });

  const notificationList: DbNotification[] = data ?? [];
  const unreadCount = notificationList.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user?.id) return;

    const socket = connectSocket(user.id);

    socket?.on('notification', () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    socket?.on('xp_update', async () => {
      try {
        const res = await auth.me();
        useAuthStore.setState({ user: res.data.user });
      } catch (_) {}
    });

    return () => {
      disconnectSocket();
    };
  }, [user?.id, queryClient]);

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  return { notifications: notificationList, unreadCount, isLoading, markAllRead };
};

export default useNotifications;
