import { Button, CloseButton, Group, Select, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

export interface ToolbarFilter {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  value: string | null;
}

/** Search box plus filter dropdowns above a list. */
export function ListToolbar({
  searchLabel,
  searchPlaceholder,
  searchValue,
  onSearch,
  filters,
  onFilter,
  onClear,
  hasFilters,
}: {
  searchLabel: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearch: (value: string) => void;
  filters: ToolbarFilter[];
  onFilter: (name: string, value: string | null) => void;
  onClear: () => void;
  hasFilters: boolean;
}) {
  return (
    <Group gap="sm" align="flex-end" mb="md">
      <TextInput
        aria-label={searchLabel}
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={event => onSearch(event.currentTarget.value)}
        leftSection={<IconSearch size={16} stroke={1.5} />}
        rightSection={
          searchValue ? (
            <CloseButton size="sm" aria-label="Clear search" onClick={() => onSearch('')} />
          ) : null
        }
        maxLength={100}
        w={{ base: '100%', sm: 300 }}
      />
      {filters.map(filter => (
        <Select
          key={filter.name}
          aria-label={filter.label}
          placeholder={filter.label}
          data={filter.options}
          value={filter.value}
          onChange={value => onFilter(filter.name, value)}
          clearable
          allowDeselect
          w={{ base: '100%', xs: 180 }}
          size="sm"
          comboboxProps={{ withinPortal: true }}
        />
      ))}
      {hasFilters && (
        <Button variant="subtle" color="gray" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </Group>
  );
}
