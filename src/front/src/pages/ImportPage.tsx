import { useRef, useState } from 'react';
import {
  Button,
  FileInput,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconUpload } from '@tabler/icons-react';
import { importArchive } from '../api/endpoints';

export function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const resetRef = useRef<() => void>(null);

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const result = await importArchive(file);
      notifications.show({
        title: 'Импорт завершён',
        message: result.message || 'Данные успешно импортированы',
        color: 'green',
      });
      setFile(null);
      resetRef.current?.();
    } catch (err) {
      notifications.show({
        title: 'Ошибка импорта',
        message:
          err instanceof Error ? err.message : 'Не удалось импортировать данные',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="md">
      <Title order={3}>Импорт данных</Title>

      <Text c="dimmed">
        Выберите архив в формате .7z для импорта данных учреждений.
      </Text>

      <FileInput
        label="Файл архива"
        placeholder="Выберите файл .7z"
        accept=".7z"
        value={file}
        onChange={setFile}
        clearable
        resetRef={resetRef}
        w={400}
      />

      <Group>
        <Button
          leftSection={<IconUpload size={16} />}
          onClick={handleImport}
          loading={loading}
          disabled={!file}
        >
          Импортировать
        </Button>
      </Group>
    </Stack>
  );
}
