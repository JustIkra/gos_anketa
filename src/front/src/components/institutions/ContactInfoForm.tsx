import { useState } from 'react';
import { Button, Group, Stack, TextInput } from '@mantine/core';
import { IconDeviceFloppy } from '@tabler/icons-react';
import type { ContactInfo } from '../../types';

interface ContactInfoFormProps {
  data: ContactInfo;
  onSave: (data: ContactInfo) => void;
  loading?: boolean;
}

export function ContactInfoForm({ data, onSave, loading }: ContactInfoFormProps) {
  const [form, setForm] = useState<ContactInfo>({ ...data });

  const update = (field: keyof ContactInfo, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(form);
  };

  return (
    <Stack gap="sm">
      <TextInput
        label="Адрес"
        value={form.address}
        onChange={(e) => update('address', e.currentTarget.value)}
      />
      <TextInput
        label="Телефон"
        value={form.phone}
        onChange={(e) => update('phone', e.currentTarget.value)}
      />
      <TextInput
        label="Факс"
        value={form.fax}
        onChange={(e) => update('fax', e.currentTarget.value)}
      />
      <TextInput
        label="Электронная почта"
        value={form.email}
        onChange={(e) => update('email', e.currentTarget.value)}
      />
      <TextInput
        label="Сайт"
        value={form.website}
        onChange={(e) => update('website', e.currentTarget.value)}
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
