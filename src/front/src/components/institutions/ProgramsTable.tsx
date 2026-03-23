import { useState } from 'react';
import {
  ActionIcon,
  Button,
  Center,
  Checkbox,
  Group,
  Stack,
  Table,
  TextInput,
  Title,
} from '@mantine/core';
import { IconPlus, IconTrash, IconDeviceFloppy } from '@tabler/icons-react';
import type { ProgramItem } from '../../types';

interface ProgramsTableProps {
  data: ProgramItem[];
  onSave: (data: ProgramItem[]) => void;
  loading?: boolean;
}

function emptyProgram(
  type: 'specialty' | 'profession',
  sortOrder: number,
): ProgramItem {
  return {
    code: '',
    specialty_name: '',
    program_type: type,
    fulltime: false,
    parttime: false,
    distance: false,
    sort_order: sortOrder,
  };
}

interface ProgramSubTableProps {
  title: string;
  programType: 'specialty' | 'profession';
  rows: ProgramItem[];
  onChange: (rows: ProgramItem[]) => void;
}

function ProgramSubTable({
  title,
  programType,
  rows,
  onChange,
}: ProgramSubTableProps) {
  const updateField = (
    index: number,
    field: keyof ProgramItem,
    value: string | boolean,
  ) => {
    onChange(
      rows.map((row, i) =>
        i === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const addRow = () => {
    onChange([...rows, emptyProgram(programType, rows.length)]);
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  return (
    <Stack gap="xs">
      <Title order={5}>{title}</Title>
      <Table striped highlightOnHover withTableBorder layout="fixed">
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={100}>Код</Table.Th>
            <Table.Th>Наименование</Table.Th>
            <Table.Th w={90} ta="center">Очная</Table.Th>
            <Table.Th w={90} ta="center">Заочная</Table.Th>
            <Table.Th w={90} ta="center">Дистанц.</Table.Th>
            <Table.Th w={40} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row, index) => (
            <Table.Tr key={index}>
              <Table.Td>
                <TextInput
                  value={row.code}
                  onChange={(e) =>
                    updateField(index, 'code', e.currentTarget.value)
                  }
                  variant="unstyled"
                  size="sm"
                  placeholder="Код"
                />
              </Table.Td>
              <Table.Td>
                <TextInput
                  value={row.specialty_name}
                  onChange={(e) =>
                    updateField(index, 'specialty_name', e.currentTarget.value)
                  }
                  variant="unstyled"
                  size="sm"
                  placeholder="Наименование"
                />
              </Table.Td>
              <Table.Td>
                <Center>
                  <Checkbox
                    checked={row.fulltime}
                    onChange={(e) =>
                      updateField(index, 'fulltime', e.currentTarget.checked)
                    }
                    styles={{ input: { cursor: 'pointer' } }}
                  />
                </Center>
              </Table.Td>
              <Table.Td>
                <Center>
                  <Checkbox
                    checked={row.parttime}
                    onChange={(e) =>
                      updateField(index, 'parttime', e.currentTarget.checked)
                    }
                    styles={{ input: { cursor: 'pointer' } }}
                  />
                </Center>
              </Table.Td>
              <Table.Td>
                <Center>
                  <Checkbox
                    checked={row.distance}
                    onChange={(e) =>
                      updateField(index, 'distance', e.currentTarget.checked)
                    }
                    styles={{ input: { cursor: 'pointer' } }}
                  />
                </Center>
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
      </Group>
    </Stack>
  );
}

export function ProgramsTable({ data, onSave, loading }: ProgramsTableProps) {
  const [specialties, setSpecialties] = useState<ProgramItem[]>(
    data
      .filter((p) => p.program_type === 'specialty')
      .map((p) => ({ ...p })),
  );
  const [professions, setProfessions] = useState<ProgramItem[]>(
    data
      .filter((p) => p.program_type === 'profession')
      .map((p) => ({ ...p })),
  );

  const handleSave = () => {
    const all = [
      ...specialties.map((s, i) => ({
        ...s,
        program_type: 'specialty' as const,
        sort_order: i,
      })),
      ...professions.map((p, i) => ({
        ...p,
        program_type: 'profession' as const,
        sort_order: i,
      })),
    ];
    onSave(all);
  };

  return (
    <Stack gap="md">
      <ProgramSubTable
        title="Специальности"
        programType="specialty"
        rows={specialties}
        onChange={setSpecialties}
      />

      <ProgramSubTable
        title="Профессии"
        programType="profession"
        rows={professions}
        onChange={setProfessions}
      />

      <Group>
        <Button
          leftSection={<IconDeviceFloppy size={16} />}
          onClick={handleSave}
          loading={loading}
        >
          Сохранить
        </Button>
      </Group>
    </Stack>
  );
}
