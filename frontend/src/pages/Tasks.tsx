import { useAuthStore } from '../hooks/useAuthStore';
import AdminTasksView from './tasks/AdminTasksView';
import UserTasksView from './tasks/UserTasksView';

const Tasks: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  return isAdmin ? <AdminTasksView /> : <UserTasksView />;
};

export default Tasks;
