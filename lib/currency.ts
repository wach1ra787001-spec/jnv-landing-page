export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
  CHF: "Fr",
  NZD: "NZ$",
  ZAR: "R",
  KES: "KSh",
  NGN: "₦",
  GHS: "GH₵",
  TZS: "TSh",
  UGX: "USh",
  EGP: "E£",
  MAD: "MAD",
  SGD: "S$",
  HKD: "HK$",
  INR: "₹",
  AED: "AED",
  SAR: "SAR",
  QAR: "QAR",
  MYR: "RM",
  THB: "฿",
  BRL: "R$",
  MXN: "MX$",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  PLN: "zł",
  CZK: "Kč",
  HUF: "Ft",
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency
}
