import {
  AppShell,
  Avatar,
  Badge,
  Burger,
  Group,
  Menu,
  NavLink,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconChevronDown,
  IconCreditCard,
  IconId,
  IconLogout,
  IconUsers,
} from '@tabler/icons-react';
import { NavLink as RouterNavLink, Outlet } from 'react-router';

import { useSignOut } from '../features/auth/hooks';
import { usePendingKycCount } from '../features/kyc/hooks';
import { useIdleSignOut } from '../hooks/useIdleSignOut';
import { useAppSelector } from '../store';
import { BrandMark } from './BrandMark';

const NAV_ITEMS = [
  { to: '/users', label: 'Users', icon: IconUsers },
  { to: '/cards', label: 'Cards', icon: IconCreditCard },
  { to: '/kyc', label: 'KYC review', icon: IconId },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function AppLayout() {
  const [navOpen, { toggle, close }] = useDisclosure();
  const admin = useAppSelector(state => state.auth.admin);
  const signOut = useSignOut();
  useIdleSignOut();
  const pendingKyc = usePendingKycCount();

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 232, breakpoint: 'sm', collapsed: { mobile: !navOpen } }}
      padding="lg"
    >
      <AppShell.Header px="md">
        <Group h="100%" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger opened={navOpen} onClick={toggle} hiddenFrom="sm" size="sm" aria-label="Menu" />
            <BrandMark size="sm" />
          </Group>
          {admin && (
            <Menu position="bottom-end" width={220}>
              <Menu.Target>
                <UnstyledButton aria-label="Account">
                  <Group gap="xs" wrap="nowrap">
                    <Avatar size={30} radius="xl" color="navy">
                      {initials(admin.full_name)}
                    </Avatar>
                    <Text fz="sm" fw={500} visibleFrom="xs">
                      {admin.full_name}
                    </Text>
                    <IconChevronDown size={14} stroke={1.5} />
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{admin.email}</Menu.Label>
                <Menu.Item
                  leftSection={<IconLogout size={16} stroke={1.5} />}
                  onClick={() => void signOut('signed_out')}
                >
                  Sign out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            component={RouterNavLink}
            to={item.to}
            label={item.label}
            leftSection={<item.icon size={18} stroke={1.5} />}
            rightSection={
              item.to === '/kyc' && pendingKyc.data ? (
                <Badge
                  size="sm"
                  variant="light"
                  color="yellow"
                  radius="sm"
                  aria-label="Waiting for review"
                >
                  {pendingKyc.data}
                </Badge>
              ) : null
            }
            onClick={close}
            styles={{ root: { borderRadius: 'var(--mantine-radius-sm)' } }}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
