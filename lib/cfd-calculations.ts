export type CfdDirection = "buy" | "sell" | "long" | "short"

export interface CfdSpecification {
  tickSize?: number | null
  tickValue?: number | null
  contractSize?: number | null
  /** Monetary value of one price unit per lot when supplied by the broker. */
  valuePerPriceUnit?: number | null
}

export interface CfdPnlInput {
  entryPrice: number
  exitPrice: number
  lots: number
  direction: CfdDirection
  specification: CfdSpecification
}

export function calculateCfdPnl({ entryPrice, exitPrice, lots, direction, specification }: CfdPnlInput): number | null {
  if (![entryPrice, exitPrice, lots].every(Number.isFinite) || lots < 0) return null
  const signedMovement = direction === "buy" || direction === "long"
    ? exitPrice - entryPrice
    : entryPrice - exitPrice
  const valuePerPriceUnit = Number(specification.valuePerPriceUnit)
  if (Number.isFinite(valuePerPriceUnit) && valuePerPriceUnit > 0) {
    return signedMovement * lots * valuePerPriceUnit
  }
  const tickSize = Number(specification.tickSize)
  const tickValue = Number(specification.tickValue)
  if (!Number.isFinite(tickSize) || tickSize <= 0 || !Number.isFinite(tickValue) || tickValue <= 0) return null
  return (signedMovement / tickSize) * tickValue * lots
}

export function getKnownCfdSpecification(symbol: string): CfdSpecification {
  const normalized = symbol.replace(/[\s/_-]/g, "").toUpperCase()
  if (normalized.includes("XAU") || normalized.includes("GOLD")) return { tickSize: 0.01, tickValue: 1, contractSize: 100 }
  if (/^(US500|SPX500|US100|NAS100|USTEC|US30|GER40|UK100|JPN225)/.test(normalized)) {
    return { tickSize: 0.1, tickValue: 1, contractSize: 1 }
  }
  if (/^[A-Z]{6}$/.test(normalized)) return { tickSize: 0.00001, tickValue: 1, contractSize: 100000 }
  return {}
}

export function calculateExpectedRiskReward(input: Omit<CfdPnlInput, "exitPrice"> & { stopLoss: number; takeProfit: number }) {
  const loss = calculateCfdPnl({ ...input, exitPrice: input.stopLoss })
  const reward = calculateCfdPnl({ ...input, exitPrice: input.takeProfit })
  return { potentialLoss: loss === null ? null : Math.abs(loss), potentialProfit: reward === null ? null : Math.abs(reward) }
}

export function getCfdSpecificationLabel(specification: CfdSpecification): string {
  if (specification.valuePerPriceUnit) return `$${specification.valuePerPriceUnit} per 1.00 price unit/lot`
  if (specification.tickSize && specification.tickValue) return `$${specification.tickValue} per ${specification.tickSize} price tick/lot`
  return "Unverified broker specification"
}

export const US500_REFERENCE_SPECIFICATION: CfdSpecification = { tickSize: 0.1, tickValue: 1, contractSize: 1 }

export function calculateUs500ReferencePnl(entryPrice: number, exitPrice: number, lots: number, direction: CfdDirection) {
  return calculateCfdPnl({ entryPrice, exitPrice, lots, direction, specification: US500_REFERENCE_SPECIFICATION })
}

// Examples: US500 7819.2 -> 7804.2, 100 lots = $1,500 with this reference spec.
// Imported broker P&L must always take precedence over this estimate.
export const cfdCalculationHierarchy = [
  "broker_reported_pnl",
  "broker_tick_size_and_value",
  "broker_value_per_price_unit",
  "unverified",
] as const

export type CfdCalculationSource = typeof cfdCalculationHierarchy[number]

export function getCfdCalculationSource(specification: CfdSpecification): CfdCalculationSource {
  if (specification.valuePerPriceUnit) return "broker_value_per_price_unit"
  if (specification.tickSize && specification.tickValue) return "broker_tick_size_and_value"
  return "unverified"
}

export function calculateCfdPnlFromBrokerSpecification(input: CfdPnlInput) {
  const pnl = calculateCfdPnl(input)
  return { pnl, verified: pnl !== null, source: getCfdCalculationSource(input.specification) }
}

export function calculateCfdRiskRewardFromBrokerSpecification(input: Omit<CfdPnlInput, "exitPrice"> & { stopLoss: number; takeProfit: number }) {
  const result = calculateExpectedRiskReward(input)
  return { ...result, verified: result.potentialLoss !== null && result.potentialProfit !== null, source: getCfdCalculationSource(input.specification) }
}

export function getCfdContractSize(specification: CfdSpecification): number | null {
  return Number.isFinite(Number(specification.contractSize)) && Number(specification.contractSize) > 0 ? Number(specification.contractSize) : null
}

export function isCfdSpecificationComplete(specification: CfdSpecification): boolean {
  return Boolean(specification.valuePerPriceUnit || (specification.tickSize && specification.tickValue))
}

export function calculateCfdPnlWithFallback(input: Omit<CfdPnlInput, "specification">, symbol: string) {
  return calculateCfdPnl({ ...input, specification: getKnownCfdSpecification(symbol) })
}
