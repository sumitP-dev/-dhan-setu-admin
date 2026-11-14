import { Text } from '@mantine/core';

/** A selfie match score, e.g. "92.4%". Red when below the pass mark. */
export function MatchScore({ score, min }: { score: number | null; min?: number }) {
  if (score === null) {
    return (
      <Text fz="sm" c="dimmed">
        —
      </Text>
    );
  }
  const below = min !== undefined && score < min;
  return (
    <Text fz="sm" c={below ? 'red' : undefined} fw={below ? 500 : undefined}>
      {score.toFixed(1)}%
    </Text>
  );
}
