import { Group, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <Group justify="space-between" align="flex-end" mb="lg">
      <Stack gap={2}>
        <Title order={2} fz="h3">
          {title}
        </Title>
        {description && (
          <Text c="dimmed" fz="sm">
            {description}
          </Text>
        )}
      </Stack>
      {actions}
    </Group>
  );
}
