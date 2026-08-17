/**
 * Broker logo mappings for trade sources
 * Maps broker identifiers to their logo URLs and metadata
 */

export interface BrokerLogoInfo {
  name: string
  logo: string
  shortName: string
  description?: string
}

export const BROKER_LOGOS: Record<string, BrokerLogoInfo> = {
  mt5: {
    name: 'MetaTrader 5',
    shortName: 'MT5',
    logo: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-nIi9cH2ZgGMStEJJz8fW234zzdeKFy.png',
    description: 'MetaTrader 5 Platform',
  },
  mt4: {
    name: 'MetaTrader 4',
    shortName: 'MT4',
    logo: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-1y0x0G3inTP28sHD1xq7lthclP4sfr.png',
    description: 'MetaTrader 4 Platform',
  },
  tradingview: {
    name: 'TradingView',
    shortName: 'TV',
    logo: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-epm8LeIqsxMnbkZbfM3N2VWByW00wD.png',
    description: 'TradingView Platform',
  },
  ctrader: {
    name: 'cTrader',
    shortName: 'cT',
    logo: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-x8wnTt30HSx0kuY887YIroFwjVj1yx.png',
    description: 'cTrader Platform',
  },
  interactive_brokers: {
    name: 'Interactive Brokers',
    shortName: 'IB',
    logo: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-j9SxgnvYDlybXgXzL9oP0FwxyP9M7G.png',
    description: 'Interactive Brokers',
  },
  tradier: {
    name: 'Tradier',
    shortName: 'TD',
    logo: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-npYAoL2WZbzwTIV7qetOgSV31BNqvC.png',
    description: 'Tradier Brokerage',
  },
  manual: {
    name: 'Manual Entry',
    shortName: 'ME',
    logo: '',
    description: 'Manually entered trade',
  },
  csv: {
    name: 'CSV Import',
    shortName: 'CSV',
    logo: '',
    description: 'Imported from CSV file',
  },
}

/**
 * Get broker logo information by source identifier
 */
export function getBrokerLogo(source: string): BrokerLogoInfo {
  return BROKER_LOGOS[source.toLowerCase()] || {
    name: source,
    shortName: source.substring(0, 2).toUpperCase(),
    logo: '',
    description: source,
  }
}

/**
 * Get all available brokers with logos
 */
export function getAllBrokers(): BrokerLogoInfo[] {
  return Object.values(BROKER_LOGOS).filter((broker) => broker.logo)
}

/**
 * Get trading platform brokers only (exclude manual, csv)
 */
export function getTradingPlatforms(): BrokerLogoInfo[] {
  return Object.entries(BROKER_LOGOS)
    .filter(([key, _]) => !['manual', 'csv'].includes(key))
    .map(([_, broker]) => broker)
    .filter((broker) => broker.logo)
}
