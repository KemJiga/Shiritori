import type { GameSettings, GameState } from '../game/types';

export type PeerMessage =
  | { type: 'player_join'; payload: { playerId: string; name: string } }
  | { type: 'player_leave'; payload: { playerId: string } }
  | { type: 'game_start'; payload: Record<string, never> }
  | { type: 'move'; payload: { playerId: string; word: string } }
  | { type: 'state_sync'; payload: { state: GameState } }
  | { type: 'settings_update'; payload: { settings: Partial<GameSettings> } }
  | { type: 'game_over'; payload: { winnerId: string | null } }
  | { type: 'error'; payload: { message: string } }
  | { type: 'chat'; payload: { senderId: string; senderName: string; text: string } }
  | { type: 'kick'; payload: { playerId: string } }
  | { type: 'ping'; payload: { timestamp: number } }
  | { type: 'pong'; payload: { timestamp: number } };

export function createMessage<T extends PeerMessage['type']>(
  type: T,
  payload: Extract<PeerMessage, { type: T }>['payload'],
): PeerMessage {
  return { type, payload } as PeerMessage;
}
