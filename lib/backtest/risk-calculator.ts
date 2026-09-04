export type RiskDirection = 'long' | 'short'

export type InstrumentRiskMetadata = {
  tickSize?: number | null
  tickValue?: number | null
  contractSize?: number | null
  pricePrecision?: number | null
}

export type RiskPosition = {
  direction: RiskDirection
  entry: number
  stopLoss: number
  takeProfit: number
  balance: number
  riskPercent: number
  riskAmount: number
  stopDistance: number
  rewardDistance: number
  riskReward: number
  positionSize: number
  potentialLoss: number
  potentialProfit: number
}

export function calculateRiskPosition(input: Omit<RiskPosition, 'riskAmount' | 'stopDistance' | 'rewardDistance' | 'riskReward' | 'positionSize' | 'potentialLoss' | 'potentialProfit'>, metadata: InstrumentRiskMetadata): { position?: RiskPosition; error?: string } {
  const { direction, entry, stopLoss, takeProfit, balance, riskPercent } = input
  const tickSize = Number(metadata.tickSize)
  const tickValue = Number(metadata.tickValue)
  const contractSize = Number(metadata.contractSize || 1)
  if (![entry, stopLoss, takeProfit, balance, riskPercent].every(Number.isFinite) || balance <= 0 || riskPercent <= 0) return { error: 'Account balance and risk percentage must be positive numbers.' }
  if (![tickSize, tickValue].every(Number.isFinite) || tickSize <= 0 || tickValue <= 0) return { error: 'Position sizing is unavailable because instrument risk metadata is missing.' }
  if (direction === 'long' && !(stopLoss < entry && takeProfit > entry)) return { error: 'For a long position, stop loss must be below entry and take profit above entry.' }
  if (direction === 'short' && !(stopLoss > entry && takeProfit < entry)) return { error: 'For a short position, stop loss must be above entry and take profit below entry.' }
  const riskAmount = balance * riskPercent / 100
  const stopDistance = Math.abs(entry - stopLoss)
  const rewardDistance = Math.abs(takeProfit - entry)
  const riskPerUnit = stopDistance / tickSize * tickValue
  const positionSize = riskAmount / riskPerUnit / contractSize
  const potentialProfit = rewardDistance / tickSize * tickValue * positionSize * contractSize
  if (![riskAmount, positionSize, potentialProfit].every(Number.isFinite) || positionSize <= 0) return { error: 'These levels produce an invalid position size.' }
  return { position: { ...input, riskAmount, stopDistance, rewardDistance, riskReward: rewardDistance / stopDistance, positionSize, potentialLoss: riskAmount, potentialProfit } }
}

export function getInstrumentRiskMetadata(symbol: string): InstrumentRiskMetadata {
  const normalized = symbol.replace(/[\/\-\s]/g, '').toUpperCase()
  if (normalized.includes('XAU') || normalized.includes('GOLD')) return { tickSize: 0.01, tickValue: 1, contractSize: 100, pricePrecision: 2 }
  if (/^(NAS100|US30|SPX500|GER40|UK100|JPN225|USTEC|US100)/.test(normalized)) return { tickSize: 0.1, tickValue: 1, contractSize: 1, pricePrecision: 1 }
  if (/^[A-Z]{6}$/.test(normalized)) return { tickSize: 0.00001, tickValue: 1, contractSize: 100000, pricePrecision: 5 }
  return {}
}
