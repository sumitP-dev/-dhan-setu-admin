import { EmptyState, Paper } from '@mantine/core';
import { IconCreditCard } from '@tabler/icons-react';

import { PAGE_SIZE } from '../../../api/schemas';
import { ListToolbar } from '../../../components/ListToolbar';
import { PageHeader } from '../../../components/PageHeader';
import { Pager } from '../../../components/Pager';
import { ErrorPanel, LoadingPanel } from '../../../components/QueryState';
import { useListParams } from '../../../hooks/useListParams';
import { CARD_TYPE_LABELS, NETWORK_LABELS, selectOptions } from '../../../utils/format';
import { CardsTable } from '../components/CardsTable';
import { useCards } from '../hooks';

const FILTERS = ['status', 'network', 'card_type'] as const;

export function CardsPage() {
  const list = useListParams(FILTERS);
  const cards = useCards({
    q: list.query || undefined,
    status: list.filters.status ?? undefined,
    network: list.filters.network ?? undefined,
    card_type: list.filters.card_type ?? undefined,
    limit: PAGE_SIZE,
    offset: (list.page - 1) * PAGE_SIZE,
  });

  return (
    <>
      <PageHeader
        title="Cards"
        description="Cards saved by users. Card numbers are never stored."
      />
      <ListToolbar
        searchLabel="Search cards"
        searchPlaceholder="Last 4 digits, owner name or phone"
        searchValue={list.searchInput}
        onSearch={list.setSearch}
        filters={[
          {
            name: 'status',
            label: 'Status',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'removed', label: 'Removed' },
            ],
            value: list.filters.status,
          },
          {
            name: 'network',
            label: 'Network',
            options: selectOptions(NETWORK_LABELS),
            value: list.filters.network,
          },
          {
            name: 'card_type',
            label: 'Type',
            options: selectOptions(CARD_TYPE_LABELS),
            value: list.filters.card_type,
          },
        ]}
        onFilter={(name, value) => list.setFilter(name as (typeof FILTERS)[number], value)}
        onClear={list.clear}
        hasFilters={list.hasFilters}
      />

      {cards.isPending ? (
        <LoadingPanel />
      ) : cards.isError ? (
        <ErrorPanel error={cards.error} onRetry={() => void cards.refetch()} />
      ) : cards.data.items.length === 0 ? (
        <Paper p="xl" radius="md">
          <EmptyState
            icon={<IconCreditCard size={28} stroke={1.5} />}
            title={list.hasFilters ? 'No matching cards' : 'No cards yet'}
            description={
              list.hasFilters
                ? 'Try a different search or clear the filters.'
                : 'Cards appear here once users save them in the app.'
            }
          />
        </Paper>
      ) : (
        <>
          <Paper radius="md" style={{ opacity: cards.isPlaceholderData ? 0.6 : 1 }}>
            <CardsTable cards={cards.data.items} />
          </Paper>
          <Pager
            page={list.page}
            pageSize={PAGE_SIZE}
            total={cards.data.total}
            onChange={list.setPage}
          />
        </>
      )}
    </>
  );
}
