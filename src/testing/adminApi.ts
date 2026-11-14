import { vi } from 'vitest';

import * as cardsApi from '../features/cards/api';
import type { CardWithOwner } from '../features/cards/schemas';
import * as kycApi from '../features/kyc/api';
import type { QueueItem, ReviewDetail } from '../features/kyc/schemas';
import * as usersApi from '../features/users/api';
import type { UserDetail, UserItem } from '../features/users/schemas';

export const USER: UserItem = {
  id: 'u1',
  full_name: 'Vinit Sharma',
  email: 'vinit@example.com',
  phone: '+919876543210',
  role: 'customer',
  status: 'active',
  kyc_status: 'pending_review',
  active_cards: 1,
  created_at: '2026-11-01T10:00:00Z',
  last_login_at: '2026-11-12T09:30:00Z',
};

export const USER_DETAIL: UserDetail = {
  ...USER,
  kyc: {
    status: 'pending_review',
    submitted_at: '2026-11-12T09:00:00Z',
    decided_at: null,
    decided_by: null,
    rejection_reason: null,
    rejection_note: null,
  },
  cards: [
    {
      id: 'c1',
      last4: '4242',
      network: 'visa',
      card_type: 'credit',
      issuer: 'HDFC Bank',
      expiry_month: 8,
      expiry_year: 2029,
      expired: false,
      is_default: true,
      status: 'active',
      created_at: '2026-11-05T10:00:00Z',
      removed_at: null,
    },
    {
      id: 'c2',
      last4: '7070',
      network: 'rupay',
      card_type: 'debit',
      issuer: null,
      expiry_month: 1,
      expiry_year: 2025,
      expired: true,
      is_default: false,
      status: 'removed',
      created_at: '2026-11-02T10:00:00Z',
      removed_at: '2026-11-03T10:00:00Z',
    },
  ],
};

export const CARD: CardWithOwner = {
  ...USER_DETAIL.cards[0]!,
  owner: { id: 'u1', full_name: 'Vinit Sharma', phone: '+919876543210', kyc_status: 'verified' },
};

export const QUEUE_ITEM: QueueItem = {
  user_id: 'u1',
  full_name: 'Vinit Sharma',
  phone: '+919876543210',
  kyc_status: 'pending_review',
  submitted_at: '2026-11-12T09:00:00Z',
  aadhaar: 'XXXX XXXX 1234',
  pan: 'ABCXX1234F',
  selfie_match_score: 92.4,
};

export const REVIEW: ReviewDetail = {
  account: {
    id: 'u1',
    full_name: 'Vinit Sharma',
    email: 'vinit@example.com',
    phone: '+919876543210',
    created_at: '2026-11-01T10:00:00Z',
  },
  kyc_status: 'pending_review',
  submitted_at: '2026-11-12T09:00:00Z',
  details: {
    name: 'VINIT SHARMA',
    date_of_birth: '1994-05-17',
    birth_year: 1994,
    gender: 'M',
    address: '12 MG Road, Pune',
    aadhaar: 'XXXX XXXX 1234',
    pan: 'ABCXX1234F',
    pan_verified: true,
    pan_issue: null,
    pan_issue_message: null,
    selfie_verified: true,
    fetched_at: '2026-11-12T08:50:00Z',
  },
  account_name_matches: true,
  pan_source: 'digilocker',
  selfie: {
    is_live: true,
    match_score: 92.4,
    min_match_score: 80,
    completed_at: '2026-11-12T08:55:00Z',
  },
  can_decide: true,
  events: [
    {
      from_status: 'not_submitted',
      to_status: 'in_progress',
      reason: 'digilocker_completed',
      note: null,
      actor_id: null,
      created_at: '2026-11-12T08:50:00Z',
    },
    {
      from_status: 'in_progress',
      to_status: 'pending_review',
      reason: 'submitted',
      note: null,
      actor_id: null,
      created_at: '2026-11-12T09:00:00Z',
    },
  ],
};

const page = <T>(items: T[]) => ({ items, total: items.length, limit: 25, offset: 0 });

/** Stubs every admin API call with sample data; tests override what they need. */
export function mockAdminApi() {
  return {
    fetchUsers: vi.spyOn(usersApi, 'fetchUsers').mockResolvedValue(page([USER])),
    fetchUser: vi.spyOn(usersApi, 'fetchUser').mockResolvedValue(USER_DETAIL),
    fetchCards: vi.spyOn(cardsApi, 'fetchCards').mockResolvedValue(page([CARD])),
    fetchQueue: vi.spyOn(kycApi, 'fetchQueue').mockResolvedValue(page([QUEUE_ITEM])),
    fetchReview: vi.spyOn(kycApi, 'fetchReview').mockResolvedValue(REVIEW),
    approveKyc: vi.spyOn(kycApi, 'approveKyc'),
    rejectKyc: vi.spyOn(kycApi, 'rejectKyc'),
  };
}
