import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  MultiSelect,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconSearch, IconTrash, IconX } from '@tabler/icons-react';
import { useAuth } from '../auth/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import type { Institution, TerritorialOrg } from '../types';
import {
  getInstitutions,
  getTerritorialOrgs,
  createInstitution,
  deleteInstitution,
} from '../api/endpoints';

export function InstitutionListPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [orgs, setOrgs] = useState<TerritorialOrg[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  const debouncedSearch = useDebounce(searchText, 300);

  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);
  const [newInst, setNewInst] = useState({
    territorial_org_id: '',
    full_name: '',
    short_name: '',
  });
  const [creating, setCreating] = useState(false);

  const loadInstitutions = useCallback(async () => {
    setLoading(true);
    try {
      const toIds = selectedOrgs.length > 0 ? selectedOrgs.map(Number) : undefined;
      const data = await getInstitutions(toIds, debouncedSearch || undefined);
      setInstitutions(data);
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
  }, [selectedOrgs, debouncedSearch]);

  useEffect(() => {
    getTerritorialOrgs()
      .then(setOrgs)
      .catch(() => {});
  }, []);

  useEffect(() => {
    void loadInstitutions();
  }, [loadInstitutions]);

  const handleCreate = async () => {
    if (!newInst.territorial_org_id || !newInst.full_name || !newInst.short_name) {
      return;
    }
    setCreating(true);
    try {
      await createInstitution({
        territorial_org_id: Number(newInst.territorial_org_id),
        full_name: newInst.full_name,
        short_name: newInst.short_name,
      });
      notifications.show({
        title: 'Успешно',
        message: 'Учреждение создано',
        color: 'green',
      });
      closeModal();
      setNewInst({ territorial_org_id: '', full_name: '', short_name: '' });
      void loadInstitutions();
    } catch (err) {
      notifications.show({
        title: 'Ошибка',
        message:
          err instanceof Error ? err.message : 'Не удалось создать учреждение',
        color: 'red',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Удалить учреждение "${name}"?`)) return;
    try {
      await deleteInstitution(id);
      notifications.show({
        title: 'Удалено',
        message: `Учреждение "${name}" удалено`,
        color: 'green',
      });
      void loadInstitutions();
    } catch (err) {
      notifications.show({
        title: 'Ошибка',
        message:
          err instanceof Error ? err.message : 'Не удалось удалить учреждение',
        color: 'red',
      });
    }
  };

  const clearFilters = () => {
    setSelectedOrgs([]);
    setSearchText('');
  };

  const hasFilters = selectedOrgs.length > 0 || searchText !== '';

  // Короткие метки для dropdown: "1 Ростовское ТО (14)"
  const orgOptions = orgs.map((o) => {
    const short = o.name.replace('территориальное объединение', 'ТО');
    return { value: String(o.id), label: `${short} (${o.institution_count})` };
  });

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group gap="sm">
          <Title order={3}>Учреждения</Title>
          <Badge variant="light" size="lg">
            {institutions.length}
          </Badge>
        </Group>
        {isAdmin && (
          <Button leftSection={<IconPlus size={16} />} onClick={openModal}>
            Добавить учреждение
          </Button>
        )}
      </Group>

      <Stack gap="xs">
        <Group gap="sm">
          <TextInput
            placeholder="Поиск по названию..."
            leftSection={<IconSearch size={16} />}
            value={searchText}
            onChange={(e) => setSearchText(e.currentTarget.value)}
            rightSection={
              searchText ? (
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={() => setSearchText('')}
                >
                  <IconX size={14} />
                </ActionIcon>
              ) : null
            }
            style={{ flex: 1 }}
          />
          {hasFilters && (
            <Button variant="subtle" size="sm" onClick={clearFilters}>
              Сбросить
            </Button>
          )}
        </Group>
        <MultiSelect
          placeholder="Все объединения"
          data={orgOptions}
          value={selectedOrgs}
          onChange={setSelectedOrgs}
          clearable
          searchable
          maxDropdownHeight={300}
        />
      </Stack>

      {loading ? (
        <Loader />
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Краткое наименование</Table.Th>
              <Table.Th>Полное наименование</Table.Th>
              <Table.Th>Территориальное объединение</Table.Th>
              {isAdmin && <Table.Th w={50} />}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {institutions.map((inst) => (
              <Table.Tr
                key={inst.id}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/institutions/${inst.id}`)}
              >
                <Table.Td>{inst.short_name}</Table.Td>
                <Table.Td>{inst.full_name}</Table.Td>
                <Table.Td>{inst.territorial_org_name}</Table.Td>
                {isAdmin && (
                  <Table.Td>
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(inst.id, inst.short_name);
                      }}
                      title="Удалить"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                )}
              </Table.Tr>
            ))}
            {institutions.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={isAdmin ? 4 : 3} ta="center" c="dimmed" py="xl">
                  <Text size="sm">
                    {hasFilters
                      ? 'Ничего не найдено. Попробуйте изменить фильтры.'
                      : 'Нет учреждений'}
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      )}

      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title="Новое учреждение"
        centered
      >
        <Stack gap="md">
          <Select
            label="Территориальное объединение"
            data={orgOptions}
            value={newInst.territorial_org_id}
            onChange={(val) =>
              setNewInst((prev) => ({
                ...prev,
                territorial_org_id: val ?? '',
              }))
            }
            required
            searchable
          />
          <TextInput
            label="Полное наименование"
            value={newInst.full_name}
            onChange={(e) =>
              setNewInst((prev) => ({
                ...prev,
                full_name: e.currentTarget.value,
              }))
            }
            required
          />
          <TextInput
            label="Краткое наименование"
            value={newInst.short_name}
            onChange={(e) =>
              setNewInst((prev) => ({
                ...prev,
                short_name: e.currentTarget.value,
              }))
            }
            required
          />
          <Button onClick={handleCreate} loading={creating} fullWidth>
            Создать
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
