import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { ApiError } from '../api/errors';
import { REVIEW, USER, mockAdminApi } from '../testing/adminApi';
import { ADMIN, renderApp, signedInState } from '../testing/renderWithProviders';

let api: ReturnType<typeof mockAdminApi>;

beforeEach(() => {
  api = mockAdminApi();
});

describe('navigation', () => {
  it('opens on Users, with Cards and KYC review (and how many are waiting) in the sidebar', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/', signedInState);

    await waitFor(() => expect(router.state.location.pathname).toBe('/users'));
    expect(await screen.findByRole('heading', { name: 'Users' })).toBeInTheDocument();
    expect(await screen.findByLabelText('Waiting for review')).toHaveTextContent('1');

    await user.click(screen.getByRole('link', { name: 'Cards' }));
    expect(await screen.findByRole('heading', { name: 'Cards' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /KYC review/ }));
    expect(await screen.findByRole('heading', { name: 'KYC review' })).toBeInTheDocument();
  });
});

describe('users', () => {
  it('lists users with their KYC status and card count', async () => {
    renderApp('/users', signedInState);

    const row = (await screen.findByRole('link', { name: 'Vinit Sharma' })).closest('tr')!;
    expect(within(row).getByText('vinit@example.com')).toBeInTheDocument();
    expect(within(row).getByText('Pending approval')).toBeInTheDocument();
    expect(within(row).getByText('1')).toBeInTheDocument();
    expect(api.fetchUsers).toHaveBeenCalledWith({ limit: 25, offset: 0 });
  });

  it('searches after a pause, and keeps the search in the URL', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/users', signedInState);
    await screen.findByRole('link', { name: 'Vinit Sharma' });

    await user.type(screen.getByLabelText('Search users'), '98765');

    await waitFor(() =>
      expect(api.fetchUsers).toHaveBeenLastCalledWith({ q: '98765', limit: 25, offset: 0 }),
    );
    expect(router.state.location.search).toBe('?q=98765');
    // One request for the whole word, not one per keystroke.
    expect(api.fetchUsers).toHaveBeenCalledTimes(2);
  });

  it('ignores a one-character search (the server needs two)', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/users?q=vi', signedInState);
    await screen.findByRole('link', { name: 'Vinit Sharma' });
    expect(api.fetchUsers).toHaveBeenLastCalledWith({ q: 'vi', limit: 25, offset: 0 });

    await user.clear(screen.getByLabelText('Search users'));
    await user.type(screen.getByLabelText('Search users'), 'v');

    await waitFor(() => expect(router.state.location.search).toBe(''));
    await waitFor(() => expect(api.fetchUsers).toHaveBeenLastCalledWith({ limit: 25, offset: 0 }));
  });

  it('filters by KYC status', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/users', signedInState);
    await screen.findByRole('link', { name: 'Vinit Sharma' });

    await user.click(screen.getByPlaceholderText('KYC status'));
    await user.click(await screen.findByRole('option', { name: 'Verified' }));

    await waitFor(() =>
      expect(api.fetchUsers).toHaveBeenLastCalledWith({
        kyc_status: 'verified',
        limit: 25,
        offset: 0,
      }),
    );
    expect(router.state.location.search).toBe('?kyc_status=verified');

    // Back to the unfiltered list (already cached, so no new request).
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitFor(() => expect(router.state.location.search).toBe(''));
    expect(screen.getByPlaceholderText('KYC status')).toHaveValue('');
  });

  it('pages through long lists', async () => {
    api.fetchUsers.mockResolvedValue({ items: [USER], total: 60, limit: 25, offset: 0 });
    const user = userEvent.setup();
    renderApp('/users', signedInState);
    expect(await screen.findByText('1–25 of 60')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '2' }));

    await waitFor(() => expect(api.fetchUsers).toHaveBeenLastCalledWith({ limit: 25, offset: 25 }));
  });

  it('says so when nothing matches', async () => {
    api.fetchUsers.mockResolvedValue({ items: [], total: 0, limit: 25, offset: 0 });
    renderApp('/users?q=nobody', signedInState);
    expect(await screen.findByText('No matching users')).toBeInTheDocument();
  });

  it('shows the server’s message when the list fails, with a retry', async () => {
    api.fetchUsers.mockRejectedValueOnce(
      new ApiError(400, 'bad_request', 'Search is too long', null),
    );
    const user = userEvent.setup();
    renderApp('/users', signedInState);

    expect(await screen.findByRole('alert')).toHaveTextContent('Search is too long');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('link', { name: 'Vinit Sharma' })).toBeInTheDocument();
  });

  it('a row opens the user, with profile, KYC and cards tabs', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/users', signedInState);

    await user.click(await screen.findByText('+919876543210'));

    await waitFor(() => expect(router.state.location.pathname).toBe('/users/u1'));
    expect(await screen.findByRole('heading', { name: 'Vinit Sharma' })).toBeInTheDocument();
    expect(api.fetchUser).toHaveBeenCalledWith('u1');
    expect(screen.getByText('Customer')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'KYC' }));
    expect(router.state.location.search).toBe('?tab=kyc');
    expect(screen.getByRole('link', { name: 'Review KYC' })).toHaveAttribute('href', '/kyc/u1');

    await user.click(screen.getByRole('tab', { name: /Cards \(1 \+ 1 removed\)/ }));
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByText('•••• 4242')).toBeInTheDocument();
    expect(within(rows[0]!).getByText('Default')).toBeInTheDocument();
    expect(within(rows[0]!).getByText('08/29')).toBeInTheDocument();
    expect(within(rows[1]!).getByText('Expired')).toBeInTheDocument();
    expect(within(rows[1]!).getByText('Removed')).toBeInTheDocument();
  });

  it('shows the rejection reason and note on the KYC tab', async () => {
    api.fetchUser.mockResolvedValue({
      ...(await api.fetchUser.getMockImplementation()!('u1')),
      kyc_status: 'rejected',
      kyc: {
        status: 'rejected',
        submitted_at: '2026-11-12T09:00:00Z',
        decided_at: '2026-11-12T10:00:00Z',
        decided_by: 'Meera Admin',
        rejection_reason: 'photo_mismatch',
        rejection_note: 'Selfie too dark',
      },
    });
    renderApp('/users/u1?tab=kyc', signedInState);

    expect(await screen.findByText('Selfie doesn’t match the Aadhaar photo')).toBeInTheDocument();
    const panel = screen.getByRole('tabpanel', { name: 'KYC' });
    expect(within(panel).getByText('Selfie too dark')).toBeInTheDocument();
    expect(within(panel).getByText('Meera Admin')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open KYC details' })).toBeInTheDocument();
  });

  it('an unknown user says not found', async () => {
    api.fetchUser.mockRejectedValue(new ApiError(404, 'user_not_found', 'User not found', null));
    renderApp('/users/nope', signedInState);
    expect(await screen.findByText('User not found')).toBeInTheDocument();
    // The way back, next to the sidebar's own link.
    expect(screen.getAllByRole('link', { name: 'Users' })).toHaveLength(2);
  });
});

describe('cards', () => {
  it('lists cards with their owners, and the owner opens their user page', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/cards', signedInState);

    const row = (await screen.findByText('•••• 4242')).closest('tr')!;
    expect(within(row).getByText('Visa · Credit · HDFC Bank')).toBeInTheDocument();
    expect(within(row).getByText('Verified')).toBeInTheDocument();

    await user.click(within(row).getByRole('link', { name: 'Vinit Sharma' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/users/u1'));
  });

  it('searches by last 4 digits', async () => {
    const user = userEvent.setup();
    renderApp('/cards', signedInState);
    await screen.findByText('•••• 4242');

    await user.type(screen.getByLabelText('Search cards'), '4242');

    await waitFor(() =>
      expect(api.fetchCards).toHaveBeenLastCalledWith({ q: '4242', limit: 25, offset: 0 }),
    );
  });
});

describe('KYC review', () => {
  it('lists submissions waiting for review, and other statuses on request', async () => {
    const user = userEvent.setup();
    renderApp('/kyc', signedInState);

    const row = (await screen.findByRole('link', { name: 'Vinit Sharma' })).closest('tr')!;
    expect(within(row).getByText('XXXX XXXX 1234')).toBeInTheDocument();
    expect(within(row).getByText('92.4%')).toBeInTheDocument();
    expect(api.fetchQueue).toHaveBeenCalledWith('pending_review', 25, 0);

    await user.click(screen.getByText('Rejected'));
    await waitFor(() => expect(api.fetchQueue).toHaveBeenLastCalledWith('rejected', 25, 0));
  });

  it('shows documents, checks and history', async () => {
    renderApp('/kyc/u1', signedInState);

    expect(await screen.findByText('VINIT SHARMA')).toBeInTheDocument();
    expect(screen.getByText('Matches')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('Face match (pass mark 80%)')).toBeInTheDocument();
    expect(screen.getByText('Submitted for review')).toBeInTheDocument();
    expect(screen.getByText('Documents fetched from DigiLocker')).toBeInTheDocument();
  });

  it('approves after confirming', async () => {
    api.approveKyc.mockResolvedValue({ ...REVIEW, kyc_status: 'verified', can_decide: false });
    const user = userEvent.setup();
    renderApp('/kyc/u1', signedInState);

    await user.click(await screen.findByRole('button', { name: 'Approve' }));
    const dialog = await screen.findByRole('dialog', { name: 'Approve KYC' });
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }));

    expect(await screen.findByRole('status')).toHaveTextContent('KYC approved');
    expect(api.approveKyc).toHaveBeenCalledWith('u1');
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument(),
    );
  });

  it('rejecting with “Other” needs a note', async () => {
    api.rejectKyc.mockResolvedValue({ ...REVIEW, kyc_status: 'rejected', can_decide: false });
    const user = userEvent.setup();
    renderApp('/kyc/u1', signedInState);

    await user.click(await screen.findByRole('button', { name: 'Reject' }));
    const dialog = await screen.findByRole('dialog', { name: 'Reject KYC' });
    // The user's message follows the reason.
    expect(within(dialog).getByText(/doesn’t match your account/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('radio', { name: 'Other' }));
    await user.click(within(dialog).getByRole('button', { name: 'Reject' }));

    expect(
      await within(dialog).findByText('Add a note when the reason is “Other”'),
    ).toBeInTheDocument();
    expect(api.rejectKyc).not.toHaveBeenCalled();

    await user.type(within(dialog).getByLabelText(/Internal note/), '  Documents look edited  ');
    await user.click(within(dialog).getByRole('button', { name: 'Reject' }));

    expect(await screen.findByRole('status')).toHaveTextContent('KYC rejected');
    expect(api.rejectKyc).toHaveBeenCalledWith('u1', 'other', 'Documents look edited');
  });

  it('when another admin decided first, says so and shows the new status', async () => {
    api.approveKyc.mockRejectedValue(
      new ApiError(
        409,
        'kyc_not_pending_review',
        'This KYC isn’t waiting for review (someone may have decided already).',
        null,
      ),
    );
    const user = userEvent.setup();
    renderApp('/kyc/u1', signedInState);

    await user.click(await screen.findByRole('button', { name: 'Approve' }));
    api.fetchReview.mockResolvedValue({ ...REVIEW, kyc_status: 'verified', can_decide: false });
    const dialog = await screen.findByRole('dialog', { name: 'Approve KYC' });
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('someone may have decided already');
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument(),
    );
    expect(api.fetchReview).toHaveBeenCalledTimes(2);
  });

  it('an admin can’t decide their own KYC', async () => {
    api.fetchReview.mockResolvedValue({
      ...REVIEW,
      account: { ...REVIEW.account, id: ADMIN.id },
      can_decide: false,
    });
    renderApp(`/kyc/${ADMIN.id}`, signedInState);

    expect(await screen.findByText(/This is your own KYC/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
  });
});
