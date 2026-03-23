import { Navigate, Outlet } from 'react-router-dom';
import { Alert, Center } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  requiredRole?: 'admin';
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { token, role } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'admin' && role !== 'admin') {
    return (
      <Center h="100%">
        <Alert
          icon={<IconLock size={16} />}
          title="Доступ запрещён"
          color="red"
          variant="light"
          maw={400}
        >
          У вас недостаточно прав для доступа к этому разделу. Требуется роль
          администратора.
        </Alert>
      </Center>
    );
  }

  return <Outlet />;
}
