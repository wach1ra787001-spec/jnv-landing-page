import type { PositionState } from "@/lib/backtest/position-state"

type Callbacks = {
  onDragStopLoss: (price: number) => void
  onDragTakeProfit: (price: number) => void
}

const LONG_COLOR = "#3b82f6"
const SHORT_COLOR = "#a855f7"
const STOP_COLOR = "#ef4444"
const TARGET_COLOR = "#22c55e"

/**
 * Owns every chart entity (order lines + risk/reward zones) for the single
 * active backtest position. `update()` is idempotent and diffs against the
 * last-rendered state instead of tearing everything down every call, so
 * dragging a line doesn't fight with the panel re-rendering it mid-drag.
 */
export class PositionOverlay {
  private chart: any
  private callbacks: Callbacks
  private entryLine: any = null
  private stopLine: any = null
  private targetLine: any = null
  private riskZone: number | null = null
  private rewardZone: number | null = null
  private closedShapes: number[] = []
  private lastRendered: PositionState | null = null
  private destroyed = false

  constructor(chart: any, callbacks: Callbacks) {
    this.chart = chart
    this.callbacks = callbacks
  }

  private sameLevels(a: PositionState | null, b: PositionState) {
    if (!a) return false
    return a.status === b.status && a.direction === b.direction && a.entry === b.entry && a.stopLoss === b.stopLoss && a.takeProfit === b.takeProfit
  }

  async update(state: PositionState) {
    if (this.destroyed) return
    if (state.status === "idle" || state.status === "closed") {
      this.clearLive()
      this.lastRendered = state
      return
    }
    if (![state.entry, state.stopLoss, state.takeProfit].every((v) => Number.isFinite(v as number))) return
    if (this.sameLevels(this.lastRendered, state)) return
    this.lastRendered = state

    const color = state.direction === "long" ? LONG_COLOR : SHORT_COLOR
    const draggable = state.status === "pending"

    try {
      if (!this.entryLine) this.entryLine = await this.chart.createOrderLine()
      this.entryLine
        .setPrice(state.entry)
        .setText(`${state.direction === "long" ? "LONG" : "SHORT"} ${state.entry}`)
        .setLineColor(color)
        .setBodyBackgroundColor(color)
        .setBodyTextColor("#ffffff")
        .setQuantityBackgroundColor(color)
        .setEditable(false)
        .setLineLength(28, "pixel" as any)

      if (!this.stopLine) {
        this.stopLine = await this.chart.createOrderLine()
        this.stopLine.onMove(() => this.callbacks.onDragStopLoss(this.stopLine.getPrice()))
      }
      this.stopLine
        .setPrice(state.stopLoss)
        .setText(`SL ${state.stopLoss}`)
        .setLineColor(STOP_COLOR)
        .setBodyBackgroundColor(STOP_COLOR)
        .setBodyTextColor("#ffffff")
        .setEditable(draggable)
        .setLineLength(28, "pixel" as any)

      if (!this.targetLine) {
        this.targetLine = await this.chart.createOrderLine()
        this.targetLine.onMove(() => this.callbacks.onDragTakeProfit(this.targetLine.getPrice()))
      }
      this.targetLine
        .setPrice(state.takeProfit)
        .setText(`TP ${state.takeProfit}`)
        .setLineColor(TARGET_COLOR)
        .setBodyBackgroundColor(TARGET_COLOR)
        .setBodyTextColor("#ffffff")
        .setEditable(draggable)
        .setLineLength(28, "pixel" as any)

      await this.renderZones(state, color)
    } catch (_) {
      // Order lines require a fully-ready chart; a stray failure here should
      // never crash the replay page.
    }
  }

  private async removeZones() {
    for (const id of [this.riskZone, this.rewardZone]) {
      if (id != null) {
        try {
          this.chart.removeEntity(id)
        } catch (_) {}
      }
    }
    this.riskZone = null
    this.rewardZone = null
  }

  private async renderZones(state: PositionState, color: string) {
    await this.removeZones()
    const anchor = state.entryTime
    if (!anchor || !Number.isFinite(state.entry as number)) return
    const barsSpan = 30
    const timeframeGuess = 3600 // rectangles are visual context, not precise time math
    const endTime = anchor + barsSpan * timeframeGuess
    try {
      this.riskZone = await this.chart.createMultipointShape(
        [{ time: anchor, price: state.entry }, { time: endTime, price: state.stopLoss }],
        { shape: "rectangle", lock: true, disableSelection: true, disableSave: true, overrides: { color: STOP_COLOR, transparency: 85, linewidth: 0 } },
      )
      this.rewardZone = await this.chart.createMultipointShape(
        [{ time: anchor, price: state.entry }, { time: endTime, price: state.takeProfit }],
        { shape: "rectangle", lock: true, disableSelection: true, disableSave: true, overrides: { color: TARGET_COLOR, transparency: 85, linewidth: 0 } },
      )
    } catch (_) {}
  }

  /** Removes the live draggable lines/zones, e.g. when a position is idle again. */
  clearLive() {
    for (const line of [this.entryLine, this.stopLine, this.targetLine]) {
      try {
        line?.remove()
      } catch (_) {}
    }
    this.entryLine = null
    this.stopLine = null
    this.targetLine = null
    void this.removeZones()
  }

  /** Swaps the live order lines for a static historical marker pair once a trade closes. */
  async renderClosedTrade(state: PositionState) {
    this.clearLive()
    if (!state.entryTime || !state.exit || !Number.isFinite(state.entry as number)) return
    const won = state.exit.reason === "TAKE_PROFIT"
    const color = won ? TARGET_COLOR : STOP_COLOR
    try {
      const entryMarker = await this.chart.createShape(
        { time: state.entryTime, price: state.entry },
        { shape: state.direction === "long" ? "arrow_up" : "arrow_down", lock: true, disableSelection: true, disableSave: true, text: `${state.direction === "long" ? "LONG" : "SHORT"} ${state.entry}`, overrides: { color } },
      )
      const exitMarker = await this.chart.createShape(
        { time: state.exit.time, price: state.exit.price },
        { shape: "flag", lock: true, disableSelection: true, disableSave: true, text: `${won ? "TP" : "SL"} ${state.exit.price}`, overrides: { color } },
      )
      this.closedShapes.push(entryMarker, exitMarker)
    } catch (_) {}
  }

  destroy() {
    this.destroyed = true
    this.clearLive()
    for (const id of this.closedShapes) {
      try {
        this.chart.removeEntity(id)
      } catch (_) {}
    }
    this.closedShapes = []
  }
}
