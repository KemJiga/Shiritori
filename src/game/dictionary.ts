import spanishWords from 'an-array-of-spanish-words';

export type GameLanguage = 'es';

export interface LanguageOption {
  code: GameLanguage | string;
  label: string;
  flag: string;
  enabled: boolean;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'es', label: 'Spanish', flag: '🇪🇸', enabled: true },
  { code: 'en', label: 'English', flag: '🇺🇸', enabled: false },
  { code: 'fr', label: 'French', flag: '🇫🇷', enabled: false },
  { code: 'pt', label: 'Portuguese', flag: '🇧🇷', enabled: false },
];

const spanishSet: Set<string> = new Set(spanishWords as string[]);

export function isValidDictionaryWord(word: string, language: GameLanguage): boolean {
  if (language === 'es') return spanishSet.has(word.toLowerCase());
  return true;
}
