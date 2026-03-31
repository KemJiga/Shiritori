export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateWord(
  word: string,
  lastWord: string | null,
  wordHistory: string[],
  maxWordLength: number,
): ValidationResult {
  const trimmed = word.trim().toLowerCase();

  if (!trimmed) {
    return { valid: false, error: 'Word cannot be empty' };
  }

  if (!/^[a-z]+$/.test(trimmed)) {
    return { valid: false, error: 'Word must contain only letters' };
  }

  if (trimmed.length < 2) {
    return { valid: false, error: 'Word must be at least 2 letters' };
  }

  if (maxWordLength > 0 && trimmed.length > maxWordLength) {
    return { valid: false, error: `Word must be at most ${maxWordLength} letters` };
  }

  if (lastWord) {
    const requiredLetter = lastWord[lastWord.length - 1];
    if (trimmed[0] !== requiredLetter) {
      return {
        valid: false,
        error: `Word must start with "${requiredLetter.toUpperCase()}"`,
      };
    }
  }

  const lowerHistory = wordHistory.map((w) => w.toLowerCase());
  if (lowerHistory.includes(trimmed)) {
    return { valid: false, error: 'Word already used' };
  }

  return { valid: true };
}
