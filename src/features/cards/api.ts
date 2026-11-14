import { api } from '../../api/client';
import { compactParams, type Page } from '../../api/schemas';
import { cardPageSchema, type CardListParams, type CardWithOwner } from './schemas';

export async function fetchCards(params: CardListParams): Promise<Page<CardWithOwner>> {
  const { data } = await api.get('/admin/cards', { params: compactParams({ ...params }) });
  return cardPageSchema.parse(data);
}
