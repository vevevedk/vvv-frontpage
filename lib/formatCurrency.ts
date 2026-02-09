const CURRENCY_LOCALE_MAP: Record<string, string> = {
  DKK: 'da-DK',
  SEK: 'sv-SE',
  NOK: 'nb-NO',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  CHF: 'de-CH',
  PLN: 'pl-PL',
  CZK: 'cs-CZ',
  AUD: 'en-AU',
  CAD: 'en-CA',
  JPY: 'ja-JP',
};

export function formatCurrency(amount: number, currencyCode: string = 'DKK'): string {
  const locale = CURRENCY_LOCALE_MAP[currencyCode] || 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
}
