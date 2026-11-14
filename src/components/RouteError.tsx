import { Button, Center, Stack, Text, Title } from '@mantine/core';
import { isRouteErrorResponse, useRouteError } from 'react-router';

export function RouteError() {
  const error = useRouteError();
  return <ErrorPage notFound={isRouteErrorResponse(error) && error.status === 404} />;
}

export function NotFoundPage() {
  return <ErrorPage notFound />;
}

function ErrorPage({ notFound }: { notFound: boolean }) {
  return (
    <Center mih="70vh" p="md">
      <Stack align="center" gap="xs" maw={420} ta="center">
        <Title order={3}>{notFound ? 'Page not found' : 'Something went wrong'}</Title>
        <Text c="dimmed" fz="sm">
          {notFound
            ? 'This page doesn’t exist.'
            : 'The page couldn’t be shown. Reload, and if it keeps happening, tell the team.'}
        </Text>
        <Button variant="default" mt="sm" component="a" href="/">
          Go to the start page
        </Button>
      </Stack>
    </Center>
  );
}
