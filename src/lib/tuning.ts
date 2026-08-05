/**
 * Standard tuning, EADGBE. Six strings, six sections — the navigation and the
 * instrument are the same object.
 */

export type StringDef = {
  /** DOM id of the section this string jumps to. */
  id: string
  index: string
  label: string
  note: string
  freq: number
  /** Visual line weight, low to high. */
  gauge: number
  /** Hz for the *drawn* vibration. The real pitch aliases badly at 60fps. */
  visualFreq: number
}

export const TUNING: Array<StringDef> = [
  {
    id: 'top',
    index: '00',
    label: 'Overture',
    note: 'E2',
    freq: 82.41,
    gauge: 3.1,
    visualFreq: 5.5,
  },
  {
    id: 'notes',
    index: '01',
    label: 'Liner Notes',
    note: 'A2',
    freq: 110.0,
    gauge: 2.7,
    visualFreq: 6.4,
  },
  {
    id: 'setlist',
    index: '02',
    label: 'Setlist',
    note: 'D3',
    freq: 146.83,
    gauge: 2.3,
    visualFreq: 7.6,
  },
  {
    id: 'tour',
    index: '03',
    label: 'Tour Dates',
    note: 'G3',
    freq: 196.0,
    gauge: 1.9,
    visualFreq: 9.0,
  },
  {
    id: 'rig',
    index: '04',
    label: 'The Rig',
    note: 'B3',
    freq: 246.94,
    gauge: 1.6,
    visualFreq: 10.6,
  },
  {
    id: 'encore',
    index: '05',
    label: 'Encore',
    note: 'E4',
    freq: 329.63,
    gauge: 1.3,
    visualFreq: 12.4,
  },
]

/** Where the strings sit inside the instrument, as fractions of its height. */
export const STRING_TOP = 0.3
export const STRING_BOTTOM = 0.8

export function stringY(i: number) {
  return STRING_TOP + ((STRING_BOTTOM - STRING_TOP) * i) / (TUNING.length - 1)
}

/* -- a tiny bus, so the labels and the canvas can pluck each other -------- */

type PluckEvent = { velocity: number; position: number }
type Listener = (index: number, event: PluckEvent) => void

const listeners = new Set<Listener>()

export function onPluck(fn: Listener) {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

export function emitPluck(index: number, event: PluckEvent) {
  for (const fn of listeners) fn(index, event)
}
