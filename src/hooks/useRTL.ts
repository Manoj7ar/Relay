const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur']);

export function isRTLLanguage(lang: string): boolean {
  const base = lang.split('-')[0]?.toLowerCase();
  return base ? RTL_LANGS.has(base) : false;
}

export function directionFor(lang: string): 'ltr' | 'rtl' {
  return isRTLLanguage(lang) ? 'rtl' : 'ltr';
}
