# Portfolio — Prithwijit Ghosh

The page is a guitar. Six strings span the hero: drag one and let go and it
bends, rings and decays. They're also the navigation — six strings, six
sections. Play them and the whole room lights up.

Nothing here is sampled or faked. Built with TanStack Start, TanStack Router and
Tailwind v4.

## Getting Started

```bash
npm install
npm run dev
```

## How the instrument works

**Sound** — [`src/lib/audio.ts`](src/lib/audio.ts). Karplus-Strong synthesis: a
delay line seeded with noise, fed back through a one-pole lowpass. The delay
length sets the pitch; the lowpass is why the high harmonics die before the
fundamental does, exactly as on a real string. Each pluck is rendered into an
`AudioBuffer` up front and cached, so there's no deprecated `ScriptProcessor`
and no `AudioWorklet` file to ship. Two detuned feedback delays make the room.
No audio libraries.

**Motion** — [`src/components/Instrument.tsx`](src/components/Instrument.tsx).
The drawn string is the real modal solution for a plucked string. Pull it to a
displacement `d` at position `p` and mode `m` gets amplitude:

```
A(m) = 2d / (m²π² · p(1-p)) · sin(mπp)
```

Which is why plucking dead centre silences every even mode, and why plucking
near the bridge looks and sounds thin. Modes decay as `m²`, so a note goes
bright to round in a few hundred milliseconds. The same maths drives the audio,
so what you see and what you hear are the same event.

The strings are drawn at a slowed visual frequency — a real 82Hz E would alias
into a strobe at 60fps.

## The room reacts

`src/lib/ambience.ts` reads the analyser every frame and publishes two numbers
to the document as custom properties — `--energy` (how loud the instrument is
right now) and `--scroll` (progress down the page). The stylesheet decides what
to do with them: the backdrop glow brightens and saturates, its hue warms and
cools between the human and machine halves of the page, and every section edge
lights up. The room genuinely responds to what you play rather than looping a
canned animation.

Everything that animates — instrument, oscilloscope, harmonographs, ambience —
subscribes to one shared `requestAnimationFrame` in `src/lib/frame.ts`, so there
is exactly one loop alive, and none at all when nothing is moving.

## Harmonographs

Open any track and it draws its own figure. A harmonograph is what two pairs of
coupled pendulums trace as they swing and die away:

```
x(t) = Σ aᵢ·sin(fᵢt + φᵢ)·e^(−dᵢt)
y(t) = Σ bᵢ·sin(gᵢt + ψᵢ)·e^(−dᵢt)
```

Pendulum frequencies are just-intonation ratios, seeded deterministically from
the project's title, so each one is unique but stable forever. The curve is
traced up front and then uniformly fitted to its frame — amplitudes are random,
so without fitting some figures spill past the edges. Victorian drawing machines
worked exactly this way, which makes it the one kind of generative art that
belongs on a page about strings.

## Structure

| Path                              | What                                   |
| --------------------------------- | -------------------------------------- |
| `src/lib/audio.ts`                | Synthesis, reverb, analyser            |
| `src/lib/tuning.ts`               | EADGBE, section mapping, pluck bus     |
| `src/lib/frame.ts`                | The one rAF everything shares          |
| `src/lib/ambience.ts`             | Analyser + scroll → CSS custom props   |
| `src/components/Instrument.tsx`   | The canvas: physics, pointer, keyboard |
| `src/components/Scope.tsx`        | Oscilloscope on the real output bus    |
| `src/components/Harmonograph.tsx` | Per-project pendulum figures           |
| `src/components/Setlist.tsx`      | Projects as an album tracklist         |
| `src/components/Tour.tsx`         | Experience, awards, certifications     |
| `src/components/Pedalboard.tsx`   | Stack as a signal chain                |
| `src/data/content.ts`             | All copy and project data              |

Edit `src/data/content.ts` to change any content. Type and colour live in
`src/styles.css` under `@theme`.

## Accessibility

Reveal animations are hidden only inside `@media (scripting: enabled)`, so a
browser that can't run the script never strands text at `opacity: 0` — and there
is no pre-paint class to add, hence no server/client mismatch on `<html>`.

Keys `1`–`6` play the strings from anywhere. Every string label is a real
focusable link. `prefers-reduced-motion` drops the ambient sway and shortens
decay. Audio starts muted until you interact (browsers require a gesture) and
there's a live/muted toggle top-right.

## Scripts

```bash
npm run dev      # dev server
npm run build    # production build
npm run lint     # eslint
npm run format   # prettier + eslint --fix
```
