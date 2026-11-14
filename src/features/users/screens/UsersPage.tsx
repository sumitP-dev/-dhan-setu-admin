import { Anchor, EmptyState, Paper, Stack, Table, Text } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router';

import { PAGE_SIZE } from '../../../api/schemas';
import { ListToolbar } from '../../../components/ListToolbar';
import { PageHeader } from '../../../components/PageHeader';
import { Pager } from '../../../components/Pager';
import { ErrorPanel, LoadingPanel } from '../../../components/QueryState';
import { KycStatusBadge, UserStatusBadge } from '../../../components/StatusBadge';
import { useListParams } from '../../../hooks/useListParams';
import {
  KYC_STATUS_LABELS,
  USER_STATUS_LABELS,
  formatDate,
  formatDateTime,
  selectOptions,
} from '../../../utils/format';
import { useUsers } from '../hooks';
import type { UserItem } from '../schemas';

const FILTERS = ['kyc_status', 'status'] as const;

function UsersTable({ users }: { users: UserItem[] }) {
  const navigate = useNavigate();
  return (
    <Table.ScrollContainer minWidth={860}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Phone</Table.Th>
            <Table.Th>KYC</Table.Th>
            <Table.Th ta="right">Cards</Table.Th>
            <Table.Th>Account</Table.Th>
            <Table.Th>Joined</Table.Th>
            <Table.Th>Last sign-in</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {users.map(user => (
            <Table.Tr
              key={user.id}
              style={{ cursor: 'pointer' }}
              onClick={event => {
                // The name link handles its own clicks (and ctrl/cmd-click for a new tab).
                if (!(event.target as HTMLElement).closest('a')) {
                  void navigate(`/users/${user.id}`);
                }
              }}
            >
              <Table.Td>
                <Stack gap={0} align="flex-start">
                  <Anchor component={Link} to={`/users/${user.id}`} fz="sm" fw={500}>
                    {user.full_name}
                  </Anchor>
                  <Text fz="xs" c="dimmed">
                    {user.email}
                  </Text>
                </Stack>
              </Table.Td>
              <Table.Td>
                <Text fz="sm">{user.phone}</Text>
              </Table.Td>
              <Table.Td>
                <KycStatusBadge status={user.kyc_status} />
              </Table.Td>
              <Table.Td ta="right">
                <Text fz="sm">{user.active_cards}</Text>
              </Table.Td>
              <Table.Td>
                <UserStatusBadge status={user.status} />
              </Table.Td>
              <Table.Td>
                <Text fz="sm">{formatDate(user.created_at)}</Text>
              </Table.Td>
              <Table.Td>
                <Text fz="sm" c={user.last_login_at ? undefined : 'dimmed'}>
                  {user.last_login_at ? formatDateTime(user.last_login_at) : 'Never'}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export function UsersPage() {
  const list = useListParams(FILTERS);
  const users = useUsers({
    q: list.query || undefined,
    kyc_status: list.filters.kyc_status ?? undefined,
    status: list.filters.status ?? undefined,
    limit: PAGE_SIZE,
    offset: (list.page - 1) * PAGE_SIZE,
  });

  return (
    <>
      <PageHeader title="Users" description="Everyone who has signed up in the app." />
      <ListToolbar
        searchLabel="Search users"
        searchPlaceholder="Name, email or phone"
        searchValue={list.searchInput}
        onSearch={list.setSearch}
        filters={[
          {
            name: 'kyc_status',
            label: 'KYC status',
            options: selectOptions(KYC_STATUS_LABELS),
            value: list.filters.kyc_status,
          },
          {
            name: 'status',
            label: 'Account status',
            options: selectOptions(USER_STATUS_LABELS),
            value: list.filters.status,
          },
        ]}
        onFilter={(name, value) => list.setFilter(name as (typeof FILTERS)[number], value)}
        onClear={list.clear}
        hasFilters={list.hasFilters}
      />

      {users.isPending ? (
        <LoadingPanel />
      ) : users.isError ? (
        <ErrorPanel error={users.error} onRetry={() => void users.refetch()} />
      ) : users.data.items.length === 0 ? (
        <Paper p="xl" radius="md">
          <EmptyState
            icon={<IconUsers size={28} stroke={1.5} />}
            title={list.hasFilters ? 'No matching users' : 'No users yet'}
            description={
              list.hasFilters
                ? 'Try a different search or clear the filters.'
                : 'People appear here once they sign up in the app.'
            }
          />
        </Paper>
      ) : (
        <>
          <Paper radius="md" style={{ opacity: users.isPlaceholderData ? 0.6 : 1 }}>
            <UsersTable users={users.data.items} />
          </Paper>
          <Pager
            page={list.page}
            pageSize={PAGE_SIZE}
            total={users.data.total}
            onChange={list.setPage}
          />
        </>
      )}
    </>
  );
}
