import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Accordion,
  Button,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft } from '@tabler/icons-react';
import type {
  ContactInfo,
  InstitutionDetail,
  PersonnelMember,
  ProgramItem,
} from '../types';
import {
  getInstitution,
  updateContacts,
  updatePersonnel,
  updatePrograms,
} from '../api/endpoints';
import { ContactInfoForm } from '../components/institutions/ContactInfoForm';
import { PersonnelTable } from '../components/institutions/PersonnelTable';
import { ProgramsTable } from '../components/institutions/ProgramsTable';

export function InstitutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<InstitutionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingContacts, setSavingContacts] = useState(false);
  const [savingPersonnel, setSavingPersonnel] = useState(false);
  const [savingPrograms, setSavingPrograms] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getInstitution(Number(id));
      setDetail(data);
    } catch (err) {
      notifications.show({
        title: 'Ошибка',
        message:
          err instanceof Error ? err.message : 'Не удалось загрузить данные',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const handleSaveContacts = async (data: ContactInfo) => {
    if (!id) return;
    setSavingContacts(true);
    try {
      await updateContacts(Number(id), data);
      notifications.show({
        title: 'Успешно',
        message: 'Контактная информация сохранена',
        color: 'green',
      });
      void loadDetail();
    } catch (err) {
      notifications.show({
        title: 'Ошибка',
        message: err instanceof Error ? err.message : 'Ошибка сохранения',
        color: 'red',
      });
    } finally {
      setSavingContacts(false);
    }
  };

  const handleSavePersonnel = async (data: PersonnelMember[]) => {
    if (!id) return;
    setSavingPersonnel(true);
    try {
      await updatePersonnel(Number(id), data);
      notifications.show({
        title: 'Успешно',
        message: 'Данные руководства сохранены',
        color: 'green',
      });
      void loadDetail();
    } catch (err) {
      notifications.show({
        title: 'Ошибка',
        message: err instanceof Error ? err.message : 'Ошибка сохранения',
        color: 'red',
      });
    } finally {
      setSavingPersonnel(false);
    }
  };

  const handleSavePrograms = async (data: ProgramItem[]) => {
    if (!id) return;
    setSavingPrograms(true);
    try {
      await updatePrograms(Number(id), data);
      notifications.show({
        title: 'Успешно',
        message: 'Образовательные программы сохранены',
        color: 'green',
      });
      void loadDetail();
    } catch (err) {
      notifications.show({
        title: 'Ошибка',
        message: err instanceof Error ? err.message : 'Ошибка сохранения',
        color: 'red',
      });
    } finally {
      setSavingPrograms(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (!detail) {
    return (
      <Text c="red">Учреждение не найдено</Text>
    );
  }

  return (
    <Stack gap="md">
      <Group>
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => navigate('/institutions')}
        >
          Назад
        </Button>
      </Group>

      <div>
        <Title order={3}>{detail.full_name}</Title>
        <Text c="dimmed" size="sm">
          {detail.short_name} — {detail.territorial_org_name}
        </Text>
      </div>

      <Accordion
        variant="separated"
        multiple
        defaultValue={['contacts', 'personnel', 'programs']}
      >
        <Accordion.Item value="contacts">
          <Accordion.Control>Контактная информация</Accordion.Control>
          <Accordion.Panel>
            <ContactInfoForm
              data={detail.contacts}
              onSave={handleSaveContacts}
              loading={savingContacts}
            />
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="personnel">
          <Accordion.Control>Руководство</Accordion.Control>
          <Accordion.Panel>
            <PersonnelTable
              data={detail.personnel}
              onSave={handleSavePersonnel}
              loading={savingPersonnel}
            />
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="programs">
          <Accordion.Control>Образовательные программы</Accordion.Control>
          <Accordion.Panel>
            <ProgramsTable
              data={detail.programs}
              onSave={handleSavePrograms}
              loading={savingPrograms}
            />
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  );
}
