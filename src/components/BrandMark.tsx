import { Group, Text, ThemeIcon } from '@mantine/core';

export function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const icon = size === 'sm' ? 28 : 36;
  return (
    <Group gap="xs" wrap="nowrap">
      <ThemeIcon size={icon} radius="md" aria-hidden>
        <Text fw={700} fz={size === 'sm' ? 'sm' : 'md'} c="white">
          D
        </Text>
      </ThemeIcon>
      <div>
        <Text fw={600} fz={size === 'sm' ? 'sm' : 'md'} lh={1.2}>
          Dhan Setu
        </Text>
        <Text c="dimmed" fz="xs" lh={1.2}>
          Admin console
        </Text>
      </div>
    </Group>
  );
}
