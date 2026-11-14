import { SimpleGrid, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';

export interface DetailItem {
  label: string;
  value: ReactNode;
}

/** Label/value pairs in a grid. Empty values show a dash. */
export function DetailList({ items, cols = 2 }: { items: DetailItem[]; cols?: number }) {
  return (
    <SimpleGrid cols={{ base: 1, sm: cols }} spacing="lg" verticalSpacing="md">
      {items.map(item => (
        <Stack key={item.label} gap={2}>
          <Text fz="xs" c="dimmed" fw={500}>
            {item.label}
          </Text>
          <Text fz="sm" component="div">
            {item.value === null || item.value === undefined || item.value === ''
              ? '—'
              : item.value}
          </Text>
        </Stack>
      ))}
    </SimpleGrid>
  );
}
