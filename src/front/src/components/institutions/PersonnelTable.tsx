import { useState } from 'react';
import {
  ActionIcon,
  Button,
  Group,
  Stack,
  Table,
  TextInput,
} from '@mantine/core';
import { IconPlus, IconTrash, IconDeviceFloppy } from '@tabler/icons-react';
import type { PersonnelMember } from '../../types';

interface PersonnelTableProps {
  data: PersonnelMember[];
  onSave: (data: PersonnelMember[]) => void;
  loading?: boolean;
}

function emptyMember(sortOrder: number): PersonnelMember {
  return {
    position: '',
    full_name: '',
    work_phone: '',
    mobile_phone: '',
    email: '',
    sort_order: sortOrder,
  };
}

export function PersonnelTable({ data, onSave, loading }: PersonnelTableProps) {
  const [rows, setRows] = useState<PersonnelMember[]>(
    data.length > 0 ? data.map((d) => ({ ...d })) : [],
  );

  const updateField = (
    index: number,
    field: keyof PersonnelMember,
    value: string,
  ) => {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, emptyMember(prev.length)]);
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(rows.map((r, i) => ({ ...r, sort_order: i })));
  };

  return (
    <Stack gap="sm">
      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Должность</Table.Th>
            <Table.Th>ФИО</Table.Th>
            <Table.Th>Рабочий телефон</Table.Th>
            <Table.Th>Мобильный телефон</Table.Th>
            <Table.Th>Эл. почта</Table.Th>
            <Table.Th w={50} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row, index) => (
            <Table.Tr key={index}>
              <Table.Td>
                <TextInput
                  value={row.position}
                  onChange={(e) =>
                    updateField(index, 'position', e.currentTarget.value)
                  }
                  variant="unstyled"
                  size="sm"
                  placeholder="Должность"
                />
              </Table.Td>
              <Table.Td>
                <TextInput
                  value={row.full_name}
                  onChange={(e) =>
                    updateField(index, 'full_name', e.currentTarget.value)
                  }
                  variant="unstyled"
                  size="sm"
                  placeholder="ФИО"
                />
              </Table.Td>
              <Table.Td>
                <TextInput
                  value={row.work_phone}
                  onChange={(e) =>
                    updateField(index, 'work_phone', e.currentTarget.value)
                  }
                  variant="unstyled"
                  size="sm"
                  placeholder="Рабочий тел."
                />
              </Table.Td>
              <Table.Td>
                <TextInput
                  value={row.mobile_phone}
                  onChange={(e) =>
                    updateField(index, 'mobile_phone', e.currentTarget.value)
                  }
                  variant="unstyled"
                  size="sm"
                  placeholder="Мобильный тел."
                />
              </Table.Td>
              <Table.Td>
                <TextInput
                  value={row.email}
                  onChange={(e) =>
                    updateField(index, 'email', e.currentTarget.value)
                  }
                  variant="unstyled"
                  size="sm"
                  placeholder="Эл. почта"
                />
              </Table.Td>
              <Table.Td>
                <ActionIcon
                  color="red"
                  variant="subtle"
                  onClick={() => removeRow(index)}
                  title="Удалить"
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
          {rows.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={6} ta="center" c="dimmed">
                Нет записей
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      <Group>
        <Button
          variant="light"
          leftSection={<IconPlus size={16} />}
          onClick={addRow}
          size="sm"
        >
          Добавить
        </Button>
        <Button
          leftSection={<IconDeviceFloppy size={16} />}
          onClick={handleSave}
          loading={loading}
          size="sm"
        >
          Сохранить
        </Button>
      </Group>
    </Stack>
  );
}
