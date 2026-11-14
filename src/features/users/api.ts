import { api } from '../../api/client';
import { compactParams, type Page } from '../../api/schemas';
import {
  userDetailSchema,
  userPageSchema,
  type UserDetail,
  type UserItem,
  type UserListParams,
} from './schemas';

export async function fetchUsers(params: UserListParams): Promise<Page<UserItem>> {
  const { data } = await api.get('/admin/users', { params: compactParams({ ...params }) });
  return userPageSchema.parse(data);
}

export async function fetchUser(userId: string): Promise<UserDetail> {
  const { data } = await api.get(`/admin/users/${encodeURIComponent(userId)}`);
  return userDetailSchema.parse(data);
}
