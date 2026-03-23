import { useCallback, useEffect, useState } from 'react';
import {
  ActionIcon,
  Button,
  Group,
  Loader,
  Modal,
  NumberInput,
  Stack,
  Table,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import type { TerritorialOrg } from '../types';
import {
  getTerritorialOrgs,
  createTerritorialOrg,
  updateTerritorialOrg,
  deleteTerritorialOrg,
} from '../api/endpoints';

interface OrgForm {
  name: string;
  sort_order: number;
}

export function TerritorialOrgsPage() {
  const [orgs, setOrgs] = useState<TerritorialOrg[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<OrgForm>({ name: '', sort_order: 0 });
  const [saving, setSaving] = useState(false);

  const loadOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTerritorialOrgs();
      setOrgs(data);
    } catch (err) {
      notifications.show({
        title: 'Ошибка',
        message:
          err instanceof Error ? err.message : 'Не удалось загрузить список',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrgs();
  }, [loadOrgs]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({ name: '', sort_order: 0 });
    openModal();
  };

  const handleOpenEdit = (org: TerritorialOrg) => {
    setEditingId(org.id);
    setForm({ name: org.name, sort_order: org.sort_order });
    openModal();
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingId !== null) {
        await updateTerritorialOrg(editingId, form);
        notifications.show({
          title: 'Успешно',
          message: 'Объединение обновлено',
          color: 'green',
        });
      } else {
        await createTerritorialOrg(form);
        notifications.show({
          title: 'Успешно',
          message: 'Объединение создано',
          color: 'green',
        });
      }
      closeModal();
      void loadOrgs();
    } catch (err) {
      notifications.show({
        title: 'Ошибка',
        message: err instanceof Error ? err.message : 'Ошибка сохранения',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (org: TerritorialOrg) => {
    if (
      !window.confirm(
        `Удалить территориальное объединение "${org.name}"?`,
      )
    ) {
      return;
    }
    try {
      await deleteTerritorialOrg(org.id);
      notifications.show({
        title: 'Удалено',
        message: `"${org.name}" удалено`,
        color: 'green',
      });
      void loadOrgs();
    } catch (err) {
      notifications.show({
        title: 'Ошибка',
        message: err instanceof Error ? err.message : 'Ошибка удаления',
        color: 'red',
      });
    }
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Территориальные объединения</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={handleOpenCreate}>
          Добавить
        </Button>
      </Group>

      {loading ? (
        <Loader />
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Наименование</Table.Th>
              <Table.Th w={120}>Порядок</Table.Th>
              <Table.Th w={160}>Учреждений</Table.Th>
              <Table.Th w={100} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {orgs.map((org) => (
              <Table.Tr key={org.id}>
                <Table.Td>{org.name}</Table.Td>
                <Table.Td>{org.sort_order}</Table.Td>
                <Table.Td>{org.institution_count}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => handleOpenEdit(org)}
                      title="Редактировать"
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => void handleDelete(org)}
                      title="Удалить"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {orgs.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4} ta="center" c="dimmed">
                  Нет объединений
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      )}

      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={
          editingId !== null
            ? 'Редактирование объединения'
            : 'Новое объединение'
        }
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Наименование"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.currentTarget.value }))
            }
            required
          />
          <NumberInput
            label="Порядок сортировки"
            value={form.sort_order}
            onChange={(val) =>
              setForm((prev) => ({
                ...prev,
                sort_order: typeof val === 'number' ? val : 0,
              }))
            }
          />
          <Button onClick={handleSave} loading={saving} fullWidth>
            {editingId !== null ? 'Сохранить' : 'Создать'}
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
