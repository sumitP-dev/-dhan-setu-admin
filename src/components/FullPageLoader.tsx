import { Center, Loader } from '@mantine/core';

export function FullPageLoader() {
  return (
    <Center mih="100vh" aria-busy="true">
      <Loader size="sm" type="dots" />
    </Center>
  );
}
