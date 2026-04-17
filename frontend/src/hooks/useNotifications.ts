import { useEffect, useState, useCallback } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import { useAuthStore } from '../hooks/useAuthStore';

interface Notification {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
}

export const useNotifications = () => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    const socket = connectSocket(user.id);

    socket?.on('notification', (data: { type: string; message: string }) => {
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: data.type,
        message: data.message,
        timestamp: new Date(),
      };
      setNotifications((prev) => [newNotification, ...prev].slice(0, 50));
    });

    return () => {
      disconnectSocket();
    };
  }, [user?.id]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notifications, clearNotifications, removeNotification };
};

export default useNotifications;