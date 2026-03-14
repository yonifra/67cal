import { createAvatar } from '@dicebear/core';
import {
  adventurer,
  funEmoji,
  bottts,
  bigSmile,
} from '@dicebear/collection';
import type { Style } from '@dicebear/core';

const STYLES: Record<string, Style<Record<string, unknown>>> = {
  adventurer: adventurer as unknown as Style<Record<string, unknown>>,
  funEmoji: funEmoji as unknown as Style<Record<string, unknown>>,
  bottts: bottts as unknown as Style<Record<string, unknown>>,
  bigSmile: bigSmile as unknown as Style<Record<string, unknown>>,
};

export const AVATAR_STYLE_KEYS = Object.keys(STYLES) as Array<keyof typeof STYLES>;

export function generateAvatarUri(style: string, seed: string): string {
  const styleObj = STYLES[style];
  if (!styleObj) return '';
  const avatar = createAvatar(styleObj, { seed });
  return avatar.toDataUri();
}

export function generateRandomSeed(): string {
  return Math.random().toString(36).substring(2, 10);
}
