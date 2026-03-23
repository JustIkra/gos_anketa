import { useState } from 'react';
import {
  Button,
  Card,
  Group,
  Stack,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconKey } from '@tabler/icons-react';
import { changePassword } from '../api/endpoints';

interface PasswordSectionProps {
  title: string;
  role: string;
}

function PasswordSection({ title, role }: PasswordSectionProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (!password.trim()) return;
    setLoading(true);
    try {
      await changePassword(role, password);
      notifications.show({
        title: 'Успешно',
        message: `Пароль для роли "${role}" изменён`,
        color: 'green',
      });
      setPassword('');
    } catch (err) {
      notifications.show({
        title: 'Ошибка',
        message:
          err instanceof Error ? err.message : 'Не удалось изменить пароль',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card shadow="xs" padding="md" withBorder>
      <Stack gap="sm">
        <Title order={5}>{title}</Title>
        <TextInput
          type="password"
          placeholder="Новый пароль"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
        />
        <Group>
          <Button
            leftSection={<IconKey size={16} />}
            onClick={handleChange}
            loading={loading}
            disabled={!password.trim()}
            size="sm"
          >
            Изменить
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}

export function SettingsPage() {
  return (
    <Stack gap="md">
      <Title order={3}>Настройки</Title>
      <PasswordSection title="Пароль администратора" role="admin" />
      <PasswordSection title="Пароль редактора" role="editor" />
    </Stack>
  );
}
