import { Anchor, Badge, Group, Stack, Table, Text } from '@mantine/core';
import { Link } from 'react-router';

import { CardStatusBadge, KycStatusBadge } from '../../../components/StatusBadge';
import { CARD_TYPE_LABELS, NETWORK_LABELS, formatDate, formatExpiry } from '../../../utils/format';
import type { Card, CardWithOwner } from '../schemas';

function CardCell({ card }: { card: Card }) {
  return (
    <Stack gap={0}>
      <Group gap={6} wrap="nowrap">
        <Text fz="sm" fw={500} ff="monospace">
          •••• {card.last4}
        </Text>
        {card.is_default && (
          <Badge size="xs" variant="outline" color="gray" radius="sm" tt="none" fw={500}>
            Default
          </Badge>
        )}
      </Group>
      <Text fz="xs" c="dimmed">
        {NETWORK_LABELS[card.network]} · {CARD_TYPE_LABELS[card.card_type]}
        {card.issuer ? ` · ${card.issuer}` : ''}
      </Text>
    </Stack>
  );
}

function ExpiryCell({ card }: { card: Card }) {
  return (
    <Group gap={6} wrap="nowrap">
      <Text fz="sm" ff="monospace">
        {formatExpiry(card.expiry_month, card.expiry_year)}
      </Text>
      {card.expired && (
        <Badge size="xs" variant="light" color="red" radius="sm" tt="none" fw={500}>
          Expired
        </Badge>
      )}
    </Group>
  );
}

/** Cards, optionally with an owner column (the all-cards list). */
export function CardsTable({ cards }: { cards: (Card | CardWithOwner)[] }) {
  const withOwner = cards.some(card => 'owner' in card);
  return (
    <Table.ScrollContainer minWidth={withOwner ? 820 : 620}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Card</Table.Th>
            {withOwner && <Table.Th>Owner</Table.Th>}
            <Table.Th>Expiry</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Added</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {cards.map(card => (
            <Table.Tr key={card.id}>
              <Table.Td>
                <CardCell card={card} />
              </Table.Td>
              {withOwner && (
                <Table.Td>
                  {'owner' in card && (
                    <Stack gap={2} align="flex-start">
                      <Anchor component={Link} to={`/users/${card.owner.id}`} fz="sm" fw={500}>
                        {card.owner.full_name}
                      </Anchor>
                      <Group gap={6} wrap="nowrap">
                        <Text fz="xs" c="dimmed">
                          {card.owner.phone}
                        </Text>
                        <KycStatusBadge status={card.owner.kyc_status} />
                      </Group>
                    </Stack>
                  )}
                </Table.Td>
              )}
              <Table.Td>
                <ExpiryCell card={card} />
              </Table.Td>
              <Table.Td>
                <CardStatusBadge status={card.status} />
                {card.removed_at && (
                  <Text fz="xs" c="dimmed" mt={2}>
                    {formatDate(card.removed_at)}
                  </Text>
                )}
              </Table.Td>
              <Table.Td>
                <Text fz="sm">{formatDate(card.created_at)}</Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
