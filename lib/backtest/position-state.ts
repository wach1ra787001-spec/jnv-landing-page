import { getInstrumentRiskMetadata, type InstrumentRiskMetadata, type RiskDirection } from "@/lib/backtest/risk-calculator"

export type PositionStatus = "idle" | "placing" | "pending" | "open" | "closed"

export type PositionExit = {
  price: number
  time: number
  reason: "STOP_LOSS" | "TAKE_PROFIT"
}

export type PositionState = {
  status: PositionStatus
  direction: RiskDirection
  entry: number | null
  entryTime: number | null
  stopLoss: number | null
  takeProfit: number | null
  tradeId?: string
  exit?: PositionExit
}

export const IDLE_POSITION: PositionState = {
  status: "idle",
  direction: "long",
  entry: null,
  entryTime: null,
  stopLoss: null,
  takeProfit: null,
}

/** Rounds a price to the instrument's tick size so dragged/clicked levels always land on a valid price step. */
export function snapToTick(price: number, tickSize: number | null | undefined): number {
  if (!tickSize || tickSize <= 0) return price
  return Math.round(price / tickSize) * tickSize
}

/** Seeds a fresh pending position from a clicked/typed entry price, with sensible default stop/target offsets. */
export function createPendingPosition(direction: RiskDirection, entry: number, entryTime: number, metadata: InstrumentRiskMetadata): PositionState {
  const tickSize = metadata.tickSize ?? entry * 0.0001
  const defaultStopDistance = tickSize * 200
  const defaultRewardDistance = defaultStopDistance * 2
  const stopLoss = direction === "long" ? entry - defaultStopDistance : entry + defaultStopDistance
  const takeProfit = direction === "long" ? entry + defaultRewardDistance : entry - defaultRewardDistance
  return {
    status: "pending",
    direction,
    entry: snapToTick(entry, metadata.tickSize),
    entryTime,
    stopLoss: snapToTick(stopLoss, metadata.tickSize),
    takeProfit: snapToTick(takeProfit, metadata.tickSize),
  }
}

/** Updates a single price level on the position, snapped to the instrument tick size. */
export function updateLevel(state: PositionState, key: "entry" | "stopLoss" | "takeProfit", price: number, metadata: InstrumentRiskMetadata): PositionState {
  return { ...state, [key]: snapToTick(price, metadata.tickSize) }
}

/** A position can only be edited while it hasn't been placed as a live trade yet. */
export function isEditable(state: PositionState): boolean {
  return state.status === "idle" || state.status === "placing" || state.status === "pending"
}

export function hasActivePosition(state: PositionState): boolean {
  return state.status === "pending" || state.status === "open"
}

export { getInstrumentRiskMetadata }
