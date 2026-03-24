import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Card,
  Center,
  Title,
  TextInput,
  Button,
  Stack,
  Alert,
} from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import { useAuth } from './AuthContext';

export function LoginPage() {
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect
  if (token) {
    return <Navigate to="/institutions" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(password);
      navigate('/institutions', { replace: true });
    } catch {
      setError('Неверный пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center h="100vh" bg="gray.1">
      <Card shadow="md" padding="xl" radius="md" w={400}>
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Center>
              <Title order={2}>анкета.донспо.рф</Title>
            </Center>

            {error && (
              <Alert
                color="red"
                variant="light"
                icon={<IconLock size={16} />}
              >
                {error}
              </Alert>
            )}

            <TextInput
              label="Пароль"
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
              autoFocus
            />

            <Button type="submit" fullWidth loading={loading}>
              Войти
            </Button>
          </Stack>
        </form>
      </Card>
    </Center>
  );
}
