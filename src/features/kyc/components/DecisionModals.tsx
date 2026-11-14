import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Group, Modal, Radio, Stack, Text, Textarea } from '@mantine/core';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { REJECTION_LABELS, REJECTION_USER_MESSAGES } from '../../../utils/format';
import { rejectSchema, type RejectForm } from '../schemas';

export function ApproveModal({
  opened,
  name,
  pending,
  error,
  onClose,
  onConfirm,
}: {
  opened: boolean;
  name: string;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal opened={opened} onClose={onClose} title="Approve KYC" centered>
      <Stack gap="md">
        <Text fz="sm">
          Approve the KYC of <strong>{name}</strong>? They can then save cards and make payments.
        </Text>
        {error && (
          <Alert color="red" role="alert">
            {error}
          </Alert>
        )}
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button color="teal" onClick={onConfirm} loading={pending}>
            Approve
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export function RejectModal({
  opened,
  name,
  pending,
  error,
  onClose,
  onConfirm,
}: {
  opened: boolean;
  name: string;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (form: { reason: RejectForm['reason']; note: string | null }) => void;
}) {
  const form = useForm<RejectForm>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: 'name_mismatch', note: '' },
  });
  const reason = useWatch({ control: form.control, name: 'reason' });

  const close = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal opened={opened} onClose={close} title="Reject KYC" centered size="lg">
      <form
        noValidate
        onSubmit={form.handleSubmit(values => {
          const note = values.note.trim();
          onConfirm({ reason: values.reason, note: note ? note : null });
        })}
      >
        <Stack gap="md">
          <Text fz="sm">
            Reject the KYC of <strong>{name}</strong>. They can start again in the app.
          </Text>
          <Controller
            control={form.control}
            name="reason"
            render={({ field }) => (
              <Radio.Group label="Reason" value={field.value} onChange={field.onChange}>
                <Stack gap="xs" mt="xs">
                  {(Object.keys(REJECTION_LABELS) as RejectForm['reason'][]).map(value => (
                    <Radio key={value} value={value} label={REJECTION_LABELS[value]} />
                  ))}
                </Stack>
              </Radio.Group>
            )}
          />
          <Alert color="gray" title="The user will see">
            {REJECTION_USER_MESSAGES[reason]}
          </Alert>
          <Textarea
            label="Internal note"
            description={
              reason === 'other'
                ? 'Required. Only admins see this.'
                : 'Optional. Only admins see this.'
            }
            autosize
            minRows={2}
            maxRows={6}
            maxLength={500}
            error={form.formState.errors.note?.message}
            {...form.register('note')}
          />
          {error && (
            <Alert color="red" role="alert">
              {error}
            </Alert>
          )}
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" color="red" loading={pending}>
              Reject
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
