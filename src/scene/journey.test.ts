import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import { STAGES } from '../content'
import { stagePosition } from './layout'
import {
  GATE_ENTER,
  GATE_LEAVE,
  journeyAim,
  journeyDistance,
  journeyView,
  progressForStage,
  stageAtProgress,
} from './journey'

const LAST = STAGES.length - 1

describe('progressForStage', () => {
  it('lands strictly inside the 0..1 range for every stage', () => {
    for (let i = 0; i <= LAST; i++) {
      const p = progressForStage(i)
      expect(p).toBeGreaterThan(0)
      expect(p).toBeLessThan(1)
    }
  })

  it('increases strictly from the first stage to the last', () => {
    for (let i = 1; i <= LAST; i++) {
      expect(progressForStage(i)).toBeGreaterThan(progressForStage(i - 1))
    }
  })

  it('gives the gate the widest slot, because that slot is the plateau', () => {
    const gate = STAGES.findIndex((s) => s.gate)
    const gateSpan = progressForStage(gate + 1) - progressForStage(gate - 1)
    const plainSpan = progressForStage(3) - progressForStage(1)
    expect(gateSpan).toBeGreaterThan(plainSpan * 1.5)
  })
})

describe('stageAtProgress', () => {
  it('round-trips through progressForStage', () => {
    for (let i = 0; i <= LAST; i++) {
      expect(stageAtProgress(progressForStage(i))).toBe(i)
    }
  })

  it('clamps rather than running off either end', () => {
    expect(stageAtProgress(-4)).toBe(0)
    expect(stageAtProgress(0)).toBe(0)
    expect(stageAtProgress(1)).toBe(LAST)
    expect(stageAtProgress(9)).toBe(LAST)
  })
})

describe('journeyView', () => {
  it('writes into the vector it was given and returns it', () => {
    const out = new Vector3()
    expect(journeyView(0.5, out)).toBe(out)
  })

  it('is finite everywhere along the axis, including outside it', () => {
    const out = new Vector3()
    for (let p = -0.2; p <= 1.2; p += 0.01) {
      journeyView(p, out)
      expect(Number.isFinite(out.x)).toBe(true)
      expect(Number.isFinite(out.y)).toBe(true)
      expect(Number.isFinite(out.z)).toBe(true)
    }
  })

  it('parks the camera in front of each stage at that stage progress', () => {
    const out = new Vector3()
    for (let i = 0; i <= LAST; i++) {
      journeyView(progressForStage(i), out)
      const anchor = stagePosition(i)
      // Dead in front of the marker on the chain axis, pulled back on z.
      expect(out.x).toBeCloseTo(anchor[0], 5)
      expect(out.z).toBeGreaterThan(anchor[2])
    }
  })

  it('never travels backwards along the chain', () => {
    const out = new Vector3()
    let previous = -Infinity
    for (let p = 0; p <= 1; p += 0.005) {
      journeyView(p, out)
      expect(out.x).toBeGreaterThanOrEqual(previous - 1e-6)
      previous = out.x
    }
  })

  it('starts high above the chain and comes down into it', () => {
    const out = new Vector3()
    journeyView(0, out)
    const entryHeight = out.y
    journeyView(progressForStage(0), out)
    expect(entryHeight).toBeGreaterThan(out.y + 8)
  })
})

describe('journeyDistance', () => {
  it('is tightest at a stage and widest between two', () => {
    const atStage = journeyDistance(progressForStage(2))
    const between = journeyDistance((progressForStage(2) + progressForStage(3)) / 2)
    expect(between).toBeGreaterThan(atStage * 1.5)
  })
})

describe('journeyAim', () => {
  it('pushes the subject left of the panel on a wide viewport', () => {
    const wide = new Vector3()
    const narrow = new Vector3()
    journeyAim(0.5, true, wide)
    journeyAim(0.5, false, narrow)
    expect(wide.x).toBeGreaterThan(narrow.x)
    expect(narrow.y).toBeLessThan(wide.y)
  })
})

describe('the gate plateau', () => {
  it('brackets the gate stage', () => {
    const gate = progressForStage(STAGES.findIndex((s) => s.gate))
    expect(GATE_ENTER).toBeLessThan(gate)
    expect(GATE_LEAVE).toBeGreaterThan(gate)
  })
})
