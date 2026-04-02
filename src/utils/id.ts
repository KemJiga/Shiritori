import { nanoid } from 'nanoid';

export function generateGameId(): string {
  return nanoid(8);
}


export function buildInviteUrl(gameId: string): string {
  const root = import.meta.env.BASE_URL.replace(/\/$/, '') || '';
  return `${window.location.origin}${root}/?gameId=${gameId}`;
}

export function parseGameIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('gameId');
}
