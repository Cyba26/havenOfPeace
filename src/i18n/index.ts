import fr from './fr';

const translations = fr;

/**
 * Simple translation function.
 * Supports {n} placeholder replacement: t('accept_damage', { n: 3 }) → "Accepter 3 Dégâts"
 */
export function t(key: string, params?: Record<string, string | number>): string {
  let text = translations[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}
