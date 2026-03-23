import { useRef, useState } from 'react';
import {
  Button,
  Divider,
  FileInput,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconUpload } from '@tabler/icons-react';
import { importArchive, importRegistry } from '../api/endpoints';

export function ImportPage() {
  const [archiveFile, setArchiveFile] = useState<File | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const archiveResetRef = useRef<() => void>(null);

  const [registryFile, setRegistryFile] = useState<File | null>(null);
  const [registryLoading, setRegistryLoading] = useState(false);
  const registryResetRef = useRef<() => void>(null);

  const handleArchiveImport = async () => {
    if (!archiveFile) return;
    setArchiveLoading(true);
    try {
      const result = await importArchive(archiveFile);
      notifications.show({
        title: 'Импорт завершён',
        message: result.message || 'Данные успешно импортированы',
        color: 'green',
      });
      setArchiveFile(null);
      archiveResetRef.current?.();
    } catch (err) {
      notifications.show({
        title: 'Ошибка импорта',
        message:
          err instanceof Error ? err.message : 'Не удалось импортировать данные',
        color: 'red',
      });
    } finally {
      setArchiveLoading(false);
    }
  };

  const handleRegistryImport = async () => {
    if (!registryFile) return;
    setRegistryLoading(true);
    try {
      const result = await importRegistry(registryFile);
      notifications.show({
        title: 'Импорт реестра завершён',
        message: result.message || 'Учреждения успешно импортированы',
        color: 'green',
      });
      setRegistryFile(null);
      registryResetRef.current?.();
    } catch (err) {
      notifications.show({
        title: 'Ошибка импорта реестра',
        message:
          err instanceof Error ? err.message : 'Не удалось импортировать реестр',
        color: 'red',
      });
    } finally {
      setRegistryLoading(false);
    }
  };

  return (
    <Stack gap="lg">
      <Title order={3}>Импорт данных</Title>

      <Stack gap="md">
        <Title order={5}>Импорт анкет из архива</Title>
        <Text c="dimmed" size="sm">
          Загрузите архив .7z с анкетами учреждений (DOCX-файлы).
          Учреждения будут привязаны к территориальному объединению по имени архива.
        </Text>
        <FileInput
          label="Файл архива"
          placeholder="Выберите файл .7z"
          accept=".7z"
          value={archiveFile}
          onChange={setArchiveFile}
          clearable
          resetRef={archiveResetRef}
          w={400}
        />
        <Group>
          <Button
            leftSection={<IconUpload size={16} />}
            onClick={handleArchiveImport}
            loading={archiveLoading}
            disabled={!archiveFile}
          >
            Импортировать анкеты
          </Button>
        </Group>
      </Stack>

      <Divider />

      <Stack gap="md">
        <Title order={5}>Импорт реестра учреждений</Title>
        <Text c="dimmed" size="sm">
          Загрузите файл .doc с реестром территориальных объединений и учреждений.
          Будут созданы недостающие ТО и учреждения с привязкой к ним.
          Уже существующие учреждения будут пропущены.
        </Text>
        <FileInput
          label="Файл реестра"
          placeholder="Выберите файл .doc"
          accept=".doc"
          value={registryFile}
          onChange={setRegistryFile}
          clearable
          resetRef={registryResetRef}
          w={400}
        />
        <Group>
          <Button
            leftSection={<IconUpload size={16} />}
            onClick={handleRegistryImport}
            loading={registryLoading}
            disabled={!registryFile}
            variant="light"
          >
            Импортировать реестр
          </Button>
        </Group>
      </Stack>
    </Stack>
  );
}
