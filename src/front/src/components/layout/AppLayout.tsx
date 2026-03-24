import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppShell,
  Badge,
  Burger,
  Button,
  Group,
  NavLink,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconBuilding,
  IconSearch,
  IconMap,
  IconUpload,
  IconSettings,
  IconLogout,
} from '@tabler/icons-react';
import { useAuth } from '../../auth/AuthContext';

const NAV_ITEMS = [
  {
    label: 'Учреждения',
    icon: IconBuilding,
    path: '/institutions',
    adminOnly: false,
  },
  {
    label: 'Поиск',
    icon: IconSearch,
    path: '/search',
    adminOnly: false,
  },
  {
    label: 'Территориальные объединения',
    icon: IconMap,
    path: '/territorial-orgs',
    adminOnly: true,
  },
  {
    label: 'Импорт данных',
    icon: IconUpload,
    path: '/import',
    adminOnly: true,
  },
  {
    label: 'Настройки',
    icon: IconSettings,
    path: '/settings',
    adminOnly: true,
  },
];

export function AppLayout() {
  const { role, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [opened, { toggle, close }] = useDisclosure(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: 280,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Title order={3}>анкета.донспо.рф</Title>
          </Group>
          <Group>
            <Badge
              variant="light"
              color={role === 'admin' ? 'blue' : 'green'}
              size="lg"
            >
              {role === 'admin' ? 'Администратор' : 'Редактор'}
            </Badge>
            <Button
              variant="subtle"
              color="gray"
              size="sm"
              leftSection={<IconLogout size={16} />}
              onClick={handleLogout}
            >
              Выйти
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            label={item.label}
            leftSection={<item.icon size={20} />}
            active={location.pathname.startsWith(item.path)}
            onClick={() => {
              navigate(item.path);
              close();
            }}
            variant="light"
            mb={4}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
