import { nanoid } from 'nanoid';

export function generateGameId(): string {
  return nanoid(8);
}


export function buildInviteUrl(gameId: string): string {
  const base = window.location.origin + window.location.pathname;
  return `${base}?gameId=${gameId}`;
}

export function parseGameIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('gameId');
}
