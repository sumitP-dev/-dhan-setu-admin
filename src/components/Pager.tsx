import { Group, Pagination, Text } from '@mantine/core';

/** "26–50 of 120" plus page buttons. `page` is 1-based. */
export function Pager({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}) {
  if (total === 0) {
    return null;
  }
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);
  return (
    <Group justify="space-between" mt="md">
      <Text fz="sm" c="dimmed">
        {first > total ? `${total} total` : `${first}–${last} of ${total}`}
      </Text>
      {pages > 1 && (
        <Pagination size="sm" total={pages} value={Math.min(page, pages)} onChange={onChange} />
      )}
    </Group>
  );
}
