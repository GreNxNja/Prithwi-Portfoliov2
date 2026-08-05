import { useEffect, useMemo, useRef, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
//#region src/lib/audio.ts
var rig = null;
var muted = false;
/** Rendered strings, keyed by pitch + brightness. Plucking is then free. */
var cache = /* @__PURE__ */ new Map();
var clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
function rigUp() {
	if (typeof window === "undefined") return null;
	if (rig) return rig;
	const ctx = new AudioContext();
	const master = ctx.createGain();
	master.gain.value = .85;
	const analyser = ctx.createAnalyser();
	analyser.fftSize = 2048;
	analyser.smoothingTimeConstant = .7;
	master.connect(analyser);
	analyser.connect(ctx.destination);
	const bus = ctx.createGain();
	bus.connect(master);
	for (const [time, feedback, pan] of [[
		.223,
		.3,
		-.55
	], [
		.311,
		.26,
		.55
	]]) {
		const delay = ctx.createDelay(1);
		delay.delayTime.value = time;
		const fb = ctx.createGain();
		fb.gain.value = feedback;
		const damp = ctx.createBiquadFilter();
		damp.type = "lowpass";
		damp.frequency.value = 2e3;
		const wet = ctx.createGain();
		wet.gain.value = .2;
		const panner = ctx.createStereoPanner();
		panner.pan.value = pan;
		bus.connect(delay);
		delay.connect(damp);
		damp.connect(fb);
		fb.connect(delay);
		damp.connect(wet);
		wet.connect(panner);
		panner.connect(master);
	}
	rig = {
		ctx,
		bus,
		master,
		analyser
	};
	return rig;
}
/** Browsers keep the context suspended until a real gesture. */
function wake() {
	const r = rigUp();
	if (r && r.ctx.state === "suspended") r.ctx.resume();
}
function render(ctx, freq, bright) {
	const key = `${freq.toFixed(1)}|${bright.toFixed(2)}`;
	const hit = cache.get(key);
	if (hit) return hit;
	const sr = ctx.sampleRate;
	const seconds = clamp(2.4 + 90 / freq, 2.4, 5);
	const n = Math.floor(sr * seconds);
	const period = Math.max(2, Math.round(sr / freq));
	const buf = ctx.createBuffer(1, n, sr);
	const out = buf.getChannelData(0);
	const ring = new Float32Array(period);
	let smoothed = 0;
	const openness = .2 + bright * .8;
	for (let i = 0; i < period; i++) {
		const white = Math.random() * 2 - 1;
		smoothed += (white - smoothed) * openness;
		ring[i] = smoothed;
	}
	const feedback = .9958;
	let prev = 0;
	let idx = 0;
	for (let i = 0; i < n; i++) {
		const cur = ring[idx];
		ring[idx] = (cur + prev) * .5 * feedback;
		prev = cur;
		out[i] = cur;
		idx = idx + 1 === period ? 0 : idx + 1;
	}
	const fade = Math.min(n, Math.floor(sr * .4));
	for (let i = 0; i < fade; i++) out[n - fade + i] *= 1 - i / fade;
	cache.set(key, buf);
	return buf;
}
function pluck(freq, options = {}) {
	const r = rigUp();
	if (!r || muted) return;
	wake();
	const velocity = clamp(options.velocity ?? .6, .05, 1);
	const position = clamp(options.position ?? .5, .04, .96);
	const when = r.ctx.currentTime + (options.delay ?? 0);
	const bright = clamp(.22 + Math.abs(position - .5) * 1.25 + velocity * .2, .15, .95);
	const src = r.ctx.createBufferSource();
	src.buffer = render(r.ctx, freq, Math.round(bright * 6) / 6);
	src.detune.value = (Math.random() - .5) * 6;
	const tone = r.ctx.createBiquadFilter();
	tone.type = "lowpass";
	tone.frequency.value = 800 + bright * 6500;
	tone.Q.value = .7;
	const gain = r.ctx.createGain();
	gain.gain.value = .08 + velocity * .3;
	src.connect(tone);
	tone.connect(gain);
	gain.connect(r.bus);
	src.start(when);
	src.onended = () => {
		src.disconnect();
		tone.disconnect();
		gain.disconnect();
	};
}
/** Roll a chord, one string at a time. */
function strum(freqs, options = {}) {
	const spread = options.spread ?? .055;
	freqs.forEach((f, i) => {
		pluck(f, {
			...options,
			delay: (options.delay ?? 0) + i * spread
		});
	});
}
function setMuted(next) {
	muted = next;
	const r = rigUp();
	if (!r) return;
	r.master.gain.setTargetAtTime(next ? 0 : .85, r.ctx.currentTime, .03);
}
function isMuted() {
	return muted;
}
function getAnalyser() {
	return rigUp()?.analyser ?? null;
}
//#endregion
//#region src/lib/frame.ts
var subscribers = /* @__PURE__ */ new Set();
var raf = 0;
var last = 0;
function loop(now) {
	const dt = Math.min(.05, (now - last) / 1e3);
	last = now;
	for (const fn of subscribers) fn(dt, now);
	raf = requestAnimationFrame(loop);
}
function onFrame(fn) {
	subscribers.add(fn);
	if (subscribers.size === 1 && typeof window !== "undefined") {
		last = performance.now();
		raf = requestAnimationFrame(loop);
	}
	return () => {
		subscribers.delete(fn);
		if (subscribers.size === 0) cancelAnimationFrame(raf);
	};
}
//#endregion
//#region src/lib/tuning.ts
var TUNING = [
	{
		id: "top",
		index: "00",
		label: "Overture",
		note: "E2",
		freq: 82.41,
		gauge: 3.1,
		visualFreq: 5.5
	},
	{
		id: "notes",
		index: "01",
		label: "Liner Notes",
		note: "A2",
		freq: 110,
		gauge: 2.7,
		visualFreq: 6.4
	},
	{
		id: "setlist",
		index: "02",
		label: "Setlist",
		note: "D3",
		freq: 146.83,
		gauge: 2.3,
		visualFreq: 7.6
	},
	{
		id: "tour",
		index: "03",
		label: "Tour Dates",
		note: "G3",
		freq: 196,
		gauge: 1.9,
		visualFreq: 9
	},
	{
		id: "rig",
		index: "04",
		label: "The Rig",
		note: "B3",
		freq: 246.94,
		gauge: 1.6,
		visualFreq: 10.6
	},
	{
		id: "encore",
		index: "05",
		label: "Encore",
		note: "E4",
		freq: 329.63,
		gauge: 1.3,
		visualFreq: 12.4
	}
];
/** Where the strings sit inside the instrument, as fractions of its height. */
var STRING_TOP = .3;
var STRING_BOTTOM = .8;
function stringY(i) {
	return STRING_TOP + .5 * i / (TUNING.length - 1);
}
var listeners = /* @__PURE__ */ new Set();
function onPluck(fn) {
	listeners.add(fn);
	return () => void listeners.delete(fn);
}
function emitPluck(index, event) {
	for (const fn of listeners) fn(index, event);
}
//#endregion
//#region src/components/Instrument.tsx
/** How many modes of the standing wave we bother to draw. */
var MODES = 4;
var SEGMENTS = 120;
/** Afterimages behind a moving string. This is why it reads as blur, not a wire. */
var TRAILS = 3;
var MAX_SPARKS = 130;
/**
* Catch radius and pull limit are derived from the gap between strings, not
* fixed: on a short viewport the strings crowd together, and fixed values would
* overlap the catch zones and let a bent string cross its neighbour.
*/
var catchRadius = (gap) => Math.max(9, Math.min(26, gap * .45));
var pullLimit = (gap) => Math.max(13, Math.min(46, gap * .92));
var EMBER = [
	255,
	159,
	69
];
var IDLE = [
	58,
	58,
	70
];
/**
* A plucked string is a sum of standing waves. Amplitude of mode m for a
* triangular displacement d pulled at position p along the string:
*
*   A(m) = 2d / (m²π² · p(1-p)) · sin(mπp)
*
* Which is why plucking dead centre silences every even mode, and why plucking
* near the bridge sounds thin — the same maths drives the audio.
*/
function excite(target, displacement, position) {
	const p = Math.min(.97, Math.max(.03, position));
	for (let m = 1; m <= MODES; m++) {
		const a = 2 * displacement / (m * m * Math.PI * Math.PI * p * (1 - p)) * Math.sin(m * Math.PI * p);
		target[m - 1] += a;
	}
}
function Instrument() {
	const wrapRef = useRef(null);
	const canvasRef = useRef(null);
	const [touched, setTouched] = useState(false);
	useEffect(() => {
		const canvas = canvasRef.current;
		const wrap = wrapRef.current;
		if (!canvas || !wrap) return;
		const c = canvas.getContext("2d");
		if (!c) return;
		const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const strings = TUNING.map(() => ({
			amp: new Float32Array(MODES),
			clock: 0,
			grab: null,
			glow: 0,
			hitX: 0,
			hitY: 0
		}));
		const sparks = [];
		let w = 0;
		let h = 0;
		let x0 = 0;
		let x1 = 0;
		let gap = 0;
		let held = -1;
		let pointer = null;
		const resize = () => {
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			w = canvas.clientWidth;
			h = canvas.clientHeight;
			canvas.width = Math.round(w * dpr);
			canvas.height = Math.round(h * dpr);
			c.setTransform(dpr, 0, 0, dpr, 0, 0);
			x0 = w * .05;
			const wrapLeft = wrap.getBoundingClientRect().left;
			let labelLeft = w;
			for (const el of wrap.querySelectorAll("[data-string-label]")) labelLeft = Math.min(labelLeft, el.getBoundingClientRect().left - wrapLeft);
			x1 = Math.max(x0 + 80, Math.min(w * .85, labelLeft - 22));
			gap = (STRING_BOTTOM - STRING_TOP) * h / (TUNING.length - 1);
		};
		const ro = new ResizeObserver(resize);
		ro.observe(canvas);
		resize();
		const baseline = (i) => stringY(i) * h;
		const spawnSparks = (x, y, force) => {
			if (calm) return;
			const n = Math.round(6 + force * 14);
			for (let k = 0; k < n && sparks.length < MAX_SPARKS; k++) {
				const a = Math.random() * Math.PI * 2;
				const speed = (18 + Math.random() * 70) * (.4 + force);
				sparks.push({
					x,
					y,
					vx: Math.cos(a) * speed,
					vy: Math.sin(a) * speed * .7,
					age: 0,
					life: .45 + Math.random() * .55
				});
			}
		};
		/** Release a held string, or fire one programmatically. */
		const release = (i, displacement, position) => {
			const s = strings[i];
			excite(s.amp, displacement, position);
			s.clock = 0;
			s.glow = 1;
			s.hitX = x0 + (x1 - x0) * position;
			s.hitY = baseline(i);
			const velocity = Math.min(1, Math.abs(displacement) / pullLimit(gap));
			spawnSparks(s.hitX, s.hitY, velocity);
			pluck(TUNING[i].freq, {
				velocity: .25 + velocity * .75,
				position
			});
			emitPluck(i, {
				velocity,
				position
			});
		};
		const off = onPluck((i, ev) => {
			const s = strings[i];
			if (s.grab) return;
			excite(s.amp, pullLimit(gap) * (.35 + ev.velocity * .5), ev.position);
			s.clock = 0;
			s.glow = 1;
			s.hitX = x0 + (x1 - x0) * ev.position;
			s.hitY = baseline(i);
			spawnSparks(s.hitX, s.hitY, ev.velocity);
		});
		const local = (e) => {
			const rect = canvas.getBoundingClientRect();
			return {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top
			};
		};
		const onDown = (e) => {
			wake();
			const p = local(e);
			if (p.x < x0 - 20 || p.x > x1 + 20) return;
			let best = -1;
			let bestDist = catchRadius(gap);
			for (let i = 0; i < strings.length; i++) {
				const d = Math.abs(p.y - baseline(i));
				if (d < bestDist) {
					bestDist = d;
					best = i;
				}
			}
			if (best === -1) return;
			held = best;
			strings[best].amp.fill(0);
			strings[best].grab = p;
			pointer = p;
			setTouched(true);
			try {
				canvas.setPointerCapture(e.pointerId);
			} catch {}
			e.preventDefault();
		};
		const onMove = (e) => {
			const p = local(e);
			pointer = p;
			if (held === -1) return;
			const base = baseline(held);
			const limit = pullLimit(gap);
			strings[held].grab = {
				x: Math.min(x1, Math.max(x0, p.x)),
				y: base + Math.max(-limit, Math.min(limit, p.y - base))
			};
		};
		const onUp = () => {
			if (held === -1) return;
			const s = strings[held];
			const grab = s.grab;
			s.grab = null;
			if (grab) {
				const displacement = grab.y - baseline(held);
				const position = (grab.x - x0) / (x1 - x0);
				release(held, Math.abs(displacement) < 1.5 ? 9 : displacement, position);
			}
			held = -1;
		};
		const onLeave = () => {
			pointer = null;
		};
		const onKey = (e) => {
			if (e.metaKey || e.ctrlKey || e.altKey) return;
			const n = Number(e.key);
			if (!Number.isInteger(n) || n < 1 || n > TUNING.length) return;
			const target = e.target;
			if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
			wake();
			setTouched(true);
			release(n - 1, pullLimit(gap) * .55, .28 + Math.random() * .44);
		};
		canvas.addEventListener("pointerdown", onDown);
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
		window.addEventListener("pointercancel", onUp);
		canvas.addEventListener("pointerleave", onLeave);
		window.addEventListener("keydown", onKey);
		/** Displacement of string i at 0–1 along its length, at a given time. */
		const shape = (s, i, t, clock) => {
			let y = 0;
			for (let m = 1; m <= MODES; m++) {
				const a = s.amp[m - 1];
				if (Math.abs(a) < .04) continue;
				y += a * Math.sin(m * Math.PI * t) * Math.cos(2 * Math.PI * TUNING[i].visualFreq * m * clock);
			}
			return y;
		};
		const stop = onFrame((dt) => {
			c.clearRect(0, 0, w, h);
			c.strokeStyle = "rgba(120,120,140,0.22)";
			c.lineWidth = 1;
			for (const x of [x0, x1]) {
				c.beginPath();
				c.moveTo(x, baseline(0) - 22);
				c.lineTo(x, baseline(strings.length - 1) + 22);
				c.stroke();
			}
			const mid = (baseline(0) + baseline(strings.length - 1)) / 2;
			c.fillStyle = "rgba(120,120,140,0.16)";
			for (const at of [
				.24,
				.42,
				.56,
				.68
			]) {
				c.beginPath();
				c.arc(x0 + (x1 - x0) * at, mid, 2.5, 0, Math.PI * 2);
				c.fill();
			}
			for (let i = 0; i < strings.length; i++) {
				const s = strings[i];
				const def = TUNING[i];
				const base = baseline(i);
				s.clock += dt;
				for (let m = 1; m <= MODES; m++) s.amp[m - 1] *= Math.exp(-dt * m * m / (calm ? .7 : 1.7));
				s.glow = Math.max(0, s.glow - dt * 1.15);
				const energy = Math.min(1, Math.abs(s.amp[0]) / 26);
				const heat = Math.max(energy, s.glow * .7);
				if (s.glow > .01) {
					const r = 26 + (1 - s.glow) * 90;
					const bloom = c.createRadialGradient(s.hitX, s.hitY, 0, s.hitX, s.hitY, r);
					bloom.addColorStop(0, `rgba(255,175,100,${s.glow * .3})`);
					bloom.addColorStop(1, "rgba(255,159,69,0)");
					c.fillStyle = bloom;
					c.fillRect(s.hitX - r, s.hitY - r, r * 2, r * 2);
				}
				const passes = calm || heat < .02 ? 1 : TRAILS;
				for (let k = passes - 1; k >= 0; k--) {
					const clock = s.clock - k * .014;
					const fade = k === 0 ? 1 : .28 / k;
					c.beginPath();
					for (let j = 0; j <= SEGMENTS; j++) {
						const t = j / SEGMENTS;
						const px = x0 + (x1 - x0) * t;
						let py = base;
						if (s.grab) {
							const gt = (s.grab.x - x0) / (x1 - x0);
							py = base + (s.grab.y - base) * (t < gt ? t / gt : (1 - t) / (1 - gt));
						} else {
							py += shape(s, i, t, clock);
							if (!calm) {
								py += Math.sin(s.clock * .7 + i * 1.9 + t * Math.PI) * .5;
								if (pointer) {
									const near = Math.exp(-(((px - pointer.x) / 100) ** 2));
									const reach = Math.max(0, 1 - Math.abs(pointer.y - base) / 80);
									py += Math.sign(pointer.y - base) * near * reach * 6;
								}
							}
						}
						if (j === 0) c.moveTo(px, py);
						else c.lineTo(px, py);
					}
					const col = IDLE.map((v, n) => Math.round(v + (EMBER[n] - v) * heat));
					c.strokeStyle = k === 0 ? `rgb(${col[0]},${col[1]},${col[2]})` : `rgba(${EMBER[0]},${EMBER[1]},${EMBER[2]},${(heat * fade).toFixed(3)})`;
					c.lineWidth = def.gauge * (k === 0 ? 1 : .8);
					c.lineCap = "round";
					if (k === 0 && heat > .02) {
						c.shadowColor = `rgba(255,159,69,${heat * .85})`;
						c.shadowBlur = 10 + heat * 30;
					}
					c.stroke();
					c.shadowBlur = 0;
				}
			}
			if (sparks.length) {
				c.globalCompositeOperation = "lighter";
				for (let i = sparks.length - 1; i >= 0; i--) {
					const p = sparks[i];
					p.age += dt;
					if (p.age >= p.life) {
						sparks.splice(i, 1);
						continue;
					}
					p.x += p.vx * dt;
					p.y += p.vy * dt;
					p.vy += 42 * dt;
					p.vx *= 1 - 1.6 * dt;
					p.vy *= 1 - 1.6 * dt;
					const k = 1 - p.age / p.life;
					c.fillStyle = `rgba(255,${Math.round(150 + 80 * k)},${Math.round(60 + 90 * (1 - k))},${(k * .65).toFixed(3)})`;
					c.beginPath();
					c.arc(p.x, p.y, .6 + k * 1.7, 0, Math.PI * 2);
					c.fill();
				}
				c.globalCompositeOperation = "source-over";
			}
		});
		return () => {
			stop();
			ro.disconnect();
			off();
			canvas.removeEventListener("pointerdown", onDown);
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
			window.removeEventListener("pointercancel", onUp);
			canvas.removeEventListener("pointerleave", onLeave);
			window.removeEventListener("keydown", onKey);
		};
	}, []);
	return /* @__PURE__ */ jsxs("div", {
		ref: wrapRef,
		className: "absolute inset-0",
		children: [
			/* @__PURE__ */ jsx("canvas", {
				ref: canvasRef,
				className: "pick-cursor absolute inset-0 h-full w-full touch-none"
			}),
			TUNING.map((s, i) => /* @__PURE__ */ jsxs("a", {
				href: `#${s.id}`,
				"data-string-label": true,
				onClick: () => {
					wake();
					pluck(s.freq, {
						velocity: .5,
						position: .4
					});
					emitPluck(i, {
						velocity: .5,
						position: .4
					});
				},
				style: { top: `${stringY(i) * 100}%` },
				className: "group absolute right-[3vw] flex -translate-y-1/2 items-baseline gap-3 font-mono text-xs tracking-widest text-muted transition-all duration-300 hover:-translate-x-1 hover:text-ember focus-visible:text-ember focus-visible:outline-none sm:right-[5vw]",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "hidden tabular-nums opacity-50 group-hover:opacity-100 sm:inline",
						children: s.index
					}),
					/* @__PURE__ */ jsx("span", {
						className: "uppercase",
						children: s.label
					}),
					/* @__PURE__ */ jsx("span", {
						className: "w-7 text-right opacity-40 group-hover:text-ember group-hover:opacity-100",
						children: s.note
					})
				]
			}, s.id)),
			/* @__PURE__ */ jsxs("p", {
				className: `pointer-events-none absolute bottom-4 left-[5vw] font-mono text-[0.7rem] tracking-[0.2em] text-muted uppercase transition-opacity duration-700 ${touched ? "opacity-0" : "opacity-100"}`,
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "text-ember",
						children: "↔"
					}),
					" drag a string, then let go",
					/* @__PURE__ */ jsx("span", {
						className: "mx-3 opacity-30",
						children: "·"
					}),
					"or press ",
					/* @__PURE__ */ jsx("span", {
						className: "text-ember",
						children: "1–6"
					})
				]
			})
		]
	});
}
//#endregion
//#region src/data/content.ts
var ME = {
	name: "Prithwijit Ghosh",
	handle: "GreNxNja",
	role: "Software Developer",
	tagline: "Building sentient AI so I can enjoy my guitar sessions in peace.",
	location: "Kolkata, IN",
	email: "dev.prith@proton.me",
	github: "https://github.com/GreNxNja"
};
var ABOUT = [
	`Computer science graduate working in system architecture, platform
   engineering and AI/ML. Right now that means building an enterprise ERP that
   real companies run their money and inventory through — the kind of software
   where a rounding error is somebody's afternoon.`,
	`Two halves that keep arguing. One writes Python that stares at satellite
   imagery until cloud motion falls out of it. The other writes TypeScript that
   has to feel right in the hand within 100ms. The AI half keeps promising it
   will automate the rest so the guitar half can get back to work.`,
	`Somewhere between the two is the actual interest: system design as
   storytelling. A codebase is an argument about what you thought mattered. So
   is a setlist.`
];
var FACTS = [
	["Based", "Kolkata, West Bengal"],
	["Now", "Software Developer, Rajwada Infotech"],
	["Degree", "B.Tech CS (AI/ML) — 8.17 CGPA"],
	["Handle", "@GreNxNja"],
	["Tuning", "E A D G B E"]
];
var AWARDS = [{
	title: "AI Unite Hackathon — Winner",
	what: "Epiphany, AI academic platform",
	when: "Jun 2024"
}, {
	title: "Smart India Hackathon — Runner-Up",
	what: "Myrtle, image recognition system",
	when: "Oct 2023"
}];
var SETLIST = [
	{
		no: "01",
		title: "InkVisage",
		when: "Jul 2026",
		blurb: "An AI tattoo platform you can try on before you commit",
		detail: `AR body preview, style-based design generation, and artist and
      gallery discovery driven by Meilisearch. Underneath it's a multi-role
      marketplace — artists, shops and clients each see a different product —
      with real-time booking, messaging and notifications tying them together.`,
		stack: [
			"React",
			"TypeScript",
			"Prisma",
			"SQLite",
			"Socket.io",
			"Meilisearch",
			"Tailwind"
		],
		string: 0
	},
	{
		no: "02",
		title: "GeoVisionAI",
		repo: "https://github.com/GreNxNja/GeoVisionAI",
		when: "Dec 2024",
		blurb: "Video generated from still satellite imagery",
		detail: `Satellites photograph the earth on a schedule. This invents the
      moments in between: an encoder-decoder CNN doing frame interpolation, so a
      sequence of stills becomes smooth, watchable cloud motion.`,
		stack: [
			"Python",
			"PyTorch",
			"OpenLayers",
			"WMS"
		],
		string: 1
	},
	{
		no: "03",
		title: "NextRead",
		repo: "https://github.com/GreNxNja/nextRead-beta",
		when: "Sep 2024",
		blurb: "A book recommender that reads your reading",
		detail: `Recommendations built from a reader's own preferences rather than
      what's selling, with a dashboard that visualises the reading journey as it
      happens.`,
		stack: [
			"TanStack",
			"Supabase",
			"Google Books API",
			"Tailwind"
		],
		string: 3
	},
	{
		no: "04",
		title: "Epiphany",
		when: "Jun 2024",
		award: "AI Unite Hackathon Winner",
		blurb: "An AI learning platform that plans the route for you",
		detail: `Study-path optimisation over what a student actually knows, plus an
      NLP chatbot built on Transformers to answer in context. Architected to hold
      100+ concurrent users without the session falling over.`,
		stack: [
			"Next.js",
			"Convex",
			"Clerk",
			"Transformers"
		],
		string: 5
	}
];
var TOUR = [{
	company: "Rajwada Infotech",
	title: "Software Developer",
	when: "Mar 2026 — Present",
	where: "Kolkata, WB",
	current: true,
	points: [
		`Led full-stack development of a large-scale ERP platform for the
       construction and civil engineering sector.`,
		`Architected the core financial and inventory modules — transaction
       processing, reconciliation and stock tracking across multiple business
       units.`,
		`Implemented role-based access control and configurable approval
       workflows, now running in production across live enterprise operations.`
	],
	stack: [
		"React",
		"TypeScript",
		"Node.js",
		"SQL Server"
	]
}, {
	company: "ShahparPay Solutions",
	title: "Full Stack Developer",
	when: "Mar 2026 — May 2026",
	where: "Kolkata, WB",
	points: [
		`Built a platform for digital payments and distributor operations,
       improving transaction processing efficiency.`,
		`Shipped an admin dashboard with authentication, activity tracking and
       reporting, giving stakeholders operational visibility they didn't have.`,
		`Designed the core database architecture and business logic, integrating
       external financial service APIs for end-to-end payment workflows.`
	],
	stack: [
		"PHP",
		"MySQL",
		"REST APIs"
	]
}];
var RIG = [
	{
		row: "Input",
		pedals: [
			{
				name: "TypeScript",
				note: "daily driver",
				hot: true
			},
			{
				name: "Python",
				note: "when it has to think",
				hot: true
			},
			{
				name: "Java",
				note: "and the JVM"
			},
			{
				name: "C++",
				note: "close to the metal"
			},
			{
				name: "SQL",
				note: "the honest one"
			}
		]
	},
	{
		row: "Drive",
		pedals: [
			{
				name: "React",
				note: "v19",
				hot: true
			},
			{
				name: "Next.js",
				note: "app router"
			},
			{
				name: "Node.js",
				note: "the server half"
			},
			{
				name: "Hono",
				note: "small and fast"
			},
			{
				name: "Bun",
				note: "faster still"
			},
			{
				name: "TanStack",
				note: "router / start"
			}
		]
	},
	{
		row: "Tone",
		pedals: [
			{
				name: "PostgreSQL",
				note: "default answer",
				hot: true
			},
			{
				name: "SQL Server",
				note: "enterprise duty"
			},
			{
				name: "Supabase",
				note: "batteries included"
			},
			{
				name: "Prisma",
				note: "typed access"
			},
			{
				name: "Socket.io",
				note: "real-time"
			},
			{
				name: "Tailwind",
				note: "v4"
			}
		]
	},
	{
		row: "Rack",
		pedals: [
			{
				name: "PyTorch",
				note: "CNNs, interpolation",
				hot: true
			},
			{
				name: "Transformers",
				note: "NLP"
			},
			{
				name: "AWS",
				note: "EC2, IAM"
			},
			{
				name: "Docker",
				note: "ships it"
			},
			{
				name: "n8n",
				note: "automation"
			},
			{
				name: "OAuth",
				note: "who goes there"
			}
		]
	}
];
var CERTS = [
	"Anthropic — Model Context Protocol (2026)",
	"IBM — Data Science Professional (2025)",
	"Stanford — Machine Learning (2024)",
	"IIT Bombay — e-Yantra Robotics with VLSI (2023)"
];
var SIGNALS = [
	{
		label: "GitHub",
		where: "@GreNxNja",
		href: "https://github.com/GreNxNja",
		band: "AM"
	},
	{
		label: "LinkedIn",
		where: "/in/greninja",
		href: "https://linkedin.com/in/greninja",
		band: "SW"
	},
	{
		label: "Writing",
		where: "prithwiblogs.vercel.app",
		href: "https://prithwiblogs.vercel.app",
		band: "LW"
	},
	{
		label: "Bento",
		where: "bento.me/grenxnja",
		href: "https://bento.me/grenxnja",
		band: "MW"
	}
];
//#endregion
//#region src/components/Pedalboard.tsx
/** Semitones above a low E, so hovering the board is at least in key. */
var SCALE = [
	0,
	3,
	5,
	7,
	10,
	12,
	15,
	17
];
var note = (i) => 82.41 * 2 ** (SCALE[i % SCALE.length] / 12) * 2;
function Pedalboard() {
	return /* @__PURE__ */ jsx("div", {
		className: "space-y-10",
		children: RIG.map((row, r) => /* @__PURE__ */ jsxs("div", {
			className: "grid gap-4 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-6",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-3 sm:block",
				children: [/* @__PURE__ */ jsx("span", {
					className: "font-mono text-[0.65rem] tracking-[0.2em] text-muted uppercase",
					children: row.row
				}), /* @__PURE__ */ jsx("span", {
					"aria-hidden": true,
					className: "h-px flex-1 bg-line sm:mt-3 sm:block sm:w-8"
				})]
			}), /* @__PURE__ */ jsx("div", {
				className: "flex flex-wrap gap-3",
				children: row.pedals.map((pedal, i) => /* @__PURE__ */ jsxs("button", {
					type: "button",
					onMouseEnter: () => {
						wake();
						pluck(note(r * 3 + i), {
							velocity: .18,
							position: .35
						});
					},
					onFocus: () => {
						wake();
						pluck(note(r * 3 + i), {
							velocity: .18,
							position: .35
						});
					},
					className: "group relative w-[9.5rem] rounded-lg border border-line bg-surface px-4 pt-4 pb-3 text-left transition-all duration-200 hover:-translate-y-1 hover:border-ember/50 focus-visible:-translate-y-1 focus-visible:border-ember/50 focus-visible:outline-none",
					children: [
						/* @__PURE__ */ jsx("span", {
							"aria-hidden": true,
							className: `absolute top-3 right-3 h-1.5 w-1.5 rounded-full transition-all duration-200 ${pedal.hot ? "bg-ember shadow-[0_0_8px_var(--color-ember)]" : "bg-line group-hover:bg-ember group-hover:shadow-[0_0_8px_var(--color-ember)]"}`
						}),
						/* @__PURE__ */ jsx("span", {
							"aria-hidden": true,
							className: "mb-3 block h-6 w-6 rounded-full border border-line bg-void transition-transform duration-300 group-hover:rotate-[135deg] group-focus-visible:rotate-[135deg]",
							children: /* @__PURE__ */ jsx("span", { className: "mx-auto block h-2.5 w-px bg-muted" })
						}),
						/* @__PURE__ */ jsx("span", {
							className: "block text-sm font-medium tracking-tight",
							children: pedal.name
						}),
						/* @__PURE__ */ jsx("span", {
							className: "mt-0.5 block font-mono text-[0.6rem] tracking-wide text-muted",
							children: pedal.note
						})
					]
				}, pedal.name))
			})]
		}, row.row))
	});
}
//#endregion
//#region src/components/Rail.tsx
/** The six strings, folded down into a scroll indicator that still plays. */
function Rail() {
	const [active, setActive] = useState(0);
	const [quiet, setQuiet] = useState(false);
	useEffect(() => {
		const sections = TUNING.map((s) => document.getElementById(s.id)).filter((el) => Boolean(el));
		if (!sections.length) return;
		const io = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				const i = TUNING.findIndex((s) => s.id === entry.target.id);
				if (i >= 0) setActive(i);
			}
		}, { rootMargin: "-45% 0px -50% 0px" });
		for (const el of sections) io.observe(el);
		return () => io.disconnect();
	}, []);
	const toggle = () => {
		wake();
		const next = !isMuted();
		setMuted(next);
		setQuiet(next);
		if (!next) pluck(TUNING[5].freq, {
			velocity: .4,
			position: .3
		});
	};
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("nav", {
		"aria-label": "Sections",
		className: "fixed top-1/2 left-4 z-40 hidden -translate-y-1/2 flex-col gap-4 lg:flex",
		children: TUNING.map((s, i) => /* @__PURE__ */ jsxs("a", {
			href: `#${s.id}`,
			"aria-label": s.label,
			"aria-current": active === i ? "true" : void 0,
			onClick: () => {
				wake();
				pluck(s.freq, {
					velocity: .45,
					position: .35
				});
				emitPluck(i, {
					velocity: .45,
					position: .35
				});
			},
			className: "group flex items-center gap-3",
			children: [/* @__PURE__ */ jsx("span", {
				className: "block h-px transition-all duration-300",
				style: {
					width: active === i ? 32 : 16,
					background: active === i ? "var(--color-ember)" : "var(--color-line)",
					boxShadow: active === i ? "0 0 10px var(--color-ember)" : "none"
				}
			}), /* @__PURE__ */ jsx("span", {
				className: `font-mono text-[0.6rem] tracking-[0.2em] uppercase transition-opacity duration-300 ${active === i ? "text-ember opacity-100" : "text-muted opacity-0 group-hover:opacity-70"}`,
				children: s.label
			})]
		}, s.id))
	}), /* @__PURE__ */ jsxs("button", {
		type: "button",
		onClick: toggle,
		"aria-pressed": quiet,
		className: "fixed top-5 right-[5vw] z-40 flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.2em] text-muted uppercase transition-colors hover:text-ember",
		children: [/* @__PURE__ */ jsx("span", {
			className: "inline-block h-1.5 w-1.5 rounded-full transition-all",
			style: {
				background: quiet ? "var(--color-line)" : "var(--color-ember)",
				boxShadow: quiet ? "none" : "0 0 8px var(--color-ember)"
			}
		}), quiet ? "muted" : "live"]
	})] });
}
//#endregion
//#region src/components/Reveal.tsx
/**
* Fades and lifts its children the first time they scroll into view.
*
* The hidden state lives in CSS behind a `.js` class rather than in inline
* styles, so a failed or disabled script leaves the text readable instead of
* invisible. See `[data-reveal]` in styles.css.
*/
function Reveal({ children, delay = 0, className }) {
	const ref = useRef(null);
	const [shown, setShown] = useState(false);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const box = el.getBoundingClientRect();
		if (box.top < window.innerHeight && box.bottom > 0) {
			setShown(true);
			return;
		}
		const io = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				setShown(true);
				io.disconnect();
			}
		}, {
			rootMargin: "0px 0px -10% 0px",
			threshold: .05
		});
		io.observe(el);
		return () => io.disconnect();
	}, []);
	return /* @__PURE__ */ jsx("div", {
		ref,
		className,
		"data-reveal": true,
		"data-in": shown ? "true" : "false",
		style: { transitionDelay: `${delay}ms` },
		children
	});
}
//#endregion
//#region src/components/Scope.tsx
/**
* A real oscilloscope on the real output bus. Most portfolios draw a decorative
* squiggle; this one is showing the strings you just plucked, mirrored below
* the centre line so a loud note blooms outward from it.
*/
function Scope({ height = 64 }) {
	const ref = useRef(null);
	useEffect(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const c = canvas.getContext("2d");
		if (!c) return;
		let w = 0;
		let data = null;
		const resize = () => {
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			w = canvas.clientWidth;
			canvas.width = Math.round(w * dpr);
			canvas.height = Math.round(height * dpr);
			c.setTransform(dpr, 0, 0, dpr, 0, 0);
		};
		const ro = new ResizeObserver(resize);
		ro.observe(canvas);
		resize();
		const stop = onFrame(() => {
			c.clearRect(0, 0, w, height);
			const mid = height / 2;
			const analyser = getAnalyser();
			if (!analyser) {
				c.beginPath();
				c.moveTo(0, mid);
				c.lineTo(w, mid);
				c.strokeStyle = "rgba(255,159,69,0.18)";
				c.lineWidth = 1;
				c.stroke();
				return;
			}
			if (!data || data.length !== analyser.frequencyBinCount) data = new Uint8Array(analyser.frequencyBinCount);
			analyser.getByteTimeDomainData(data);
			const trace = (dir, alpha, width) => {
				c.beginPath();
				for (let i = 0; i < data.length; i++) {
					const x = i / (data.length - 1) * w;
					const y = mid + dir * ((data[i] - 128) / 128) * (height * .44);
					if (i === 0) c.moveTo(x, y);
					else c.lineTo(x, y);
				}
				c.strokeStyle = `rgba(255,159,69,${alpha})`;
				c.lineWidth = width;
				c.stroke();
			};
			c.globalCompositeOperation = "lighter";
			c.shadowColor = "rgba(255,159,69,0.55)";
			c.shadowBlur = 10;
			trace(1, .7, 1.3);
			trace(-1, .22, 1);
			c.shadowBlur = 0;
			c.globalCompositeOperation = "source-over";
		});
		return () => {
			stop();
			ro.disconnect();
		};
	}, [height]);
	return /* @__PURE__ */ jsx("canvas", {
		ref,
		className: "w-full",
		style: { height },
		"aria-hidden": true
	});
}
//#endregion
//#region src/components/Collapse.tsx
/**
* Animates open on a measured height.
*
* The tidier `grid-template-rows: 0fr → 1fr` trick collapses to 0px here: the
* inner element is `overflow: hidden`, which drops its automatic minimum size
* to zero, so the fr track has no content size to resolve against. Measuring is
* duller and always correct.
*/
function Collapse({ open, children }) {
	const inner = useRef(null);
	const [height, setHeight] = useState(0);
	useEffect(() => {
		const el = inner.current;
		if (!el) return;
		const measure = () => setHeight(el.scrollHeight);
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		measure();
		return () => ro.disconnect();
	}, []);
	return /* @__PURE__ */ jsx("div", {
		className: "overflow-hidden transition-[height,opacity] duration-500 ease-out",
		style: {
			height: open ? height : 0,
			opacity: open ? 1 : 0
		},
		"aria-hidden": !open,
		children: /* @__PURE__ */ jsx("div", {
			ref: inner,
			children
		})
	});
}
//#endregion
//#region src/components/Harmonograph.tsx
/**
* A harmonograph: the figure two pairs of coupled pendulums trace as they swing
* and die away.
*
*   x(t) = Σ aᵢ·sin(fᵢt + φᵢ)·e^(−dᵢt)
*   y(t) = Σ bᵢ·sin(gᵢt + ψᵢ)·e^(−dᵢt)
*
* Every project gets its own, seeded from its title and tuned to the string it
* sits on — the pendulum frequencies are just-intonation ratios of that note,
* so the curves close on themselves instead of smearing. Real Victorian drawing
* machines worked exactly this way, which makes it the one kind of generative
* art that actually belongs on a page about strings.
*/
var RATIOS = [
	1,
	2,
	3,
	4,
	3 / 2,
	4 / 3,
	5 / 4,
	5 / 3,
	5 / 2
];
function hash(s) {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}
/** Small deterministic PRNG, so a title always draws the same figure. */
function mulberry32(a) {
	return () => {
		a = a + 1831565813 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function Harmonograph({ seed, active, className }) {
	const ref = useRef(null);
	useEffect(() => {
		const canvas = ref.current;
		if (!canvas || !active) return;
		const c = canvas.getContext("2d");
		if (!c) return;
		const rnd = mulberry32(hash(seed));
		const pendulum = () => ({
			amp: .28 + rnd() * .24,
			freq: RATIOS[Math.floor(rnd() * RATIOS.length)] + (rnd() - .5) * .012,
			phase: rnd() * Math.PI * 2,
			decay: .004 + rnd() * .011
		});
		const px = [pendulum(), pendulum()];
		const py = [pendulum(), pendulum()];
		const STEP = .018;
		const LIMIT = 62;
		const PER_FRAME = 320;
		const count = Math.floor(LIMIT / STEP) + 1;
		const pts = new Float32Array(count * 2);
		let minX = Infinity;
		let maxX = -Infinity;
		let minY = Infinity;
		let maxY = -Infinity;
		for (let i = 0; i < count; i++) {
			const time = i * STEP;
			let x = 0;
			let y = 0;
			for (const p of px) x += p.amp * Math.sin(p.freq * time + p.phase) * Math.exp(-p.decay * time);
			for (const p of py) y += p.amp * Math.sin(p.freq * time + p.phase) * Math.exp(-p.decay * time);
			pts[i * 2] = x;
			pts[i * 2 + 1] = y;
			if (x < minX) minX = x;
			if (x > maxX) maxX = x;
			if (y < minY) minY = y;
			if (y > maxY) maxY = y;
		}
		let w = 0;
		let h = 0;
		let scale = 1;
		let ox = 0;
		let oy = 0;
		let head = 0;
		const resize = () => {
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			w = canvas.clientWidth;
			h = canvas.clientHeight;
			canvas.width = Math.round(w * dpr);
			canvas.height = Math.round(h * dpr);
			c.setTransform(dpr, 0, 0, dpr, 0, 0);
			c.clearRect(0, 0, w, h);
			const spanX = Math.max(1e-6, maxX - minX);
			const spanY = Math.max(1e-6, maxY - minY);
			scale = Math.min((w - 24) / spanX, (h - 24) / spanY);
			ox = (w - spanX * scale) / 2 - minX * scale;
			oy = (h - spanY * scale) / 2 - minY * scale;
			c.globalCompositeOperation = "lighter";
			c.lineWidth = 1;
			c.lineCap = "round";
			head = 0;
		};
		new ResizeObserver(resize).observe(canvas);
		resize();
		return onFrame(() => {
			if (head >= 3444) return;
			const end = Math.min(3444, head + PER_FRAME);
			c.beginPath();
			c.moveTo(pts[head * 2] * scale + ox, pts[head * 2 + 1] * scale + oy);
			for (let i = head + 1; i <= end; i++) c.lineTo(pts[i * 2] * scale + ox, pts[i * 2 + 1] * scale + oy);
			const fade = 1 - head / count;
			c.strokeStyle = `rgba(255, 159, 69, ${(.05 + fade * .05).toFixed(3)})`;
			c.shadowColor = "rgba(255, 159, 69, 0.5)";
			c.shadowBlur = 6;
			c.stroke();
			head = end;
		});
	}, [seed, active]);
	return /* @__PURE__ */ jsx("canvas", {
		ref,
		className,
		"aria-hidden": true
	});
}
//#endregion
//#region src/components/Setlist.tsx
/** Deterministic pseudo-waveform, so each track keeps its own shape forever. */
function waveform(seed, n) {
	let h = 2166136261;
	for (let i = 0; i < seed.length; i++) {
		h ^= seed.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	const out = [];
	for (let i = 0; i < n; i++) {
		h ^= h << 13;
		h ^= h >>> 17;
		h ^= h << 5;
		h |= 0;
		const r = Math.abs(h % 1e3) / 1e3;
		const envelope = Math.sin(i / (n - 1) * Math.PI) ** .6;
		out.push(Math.round((12 + r * 88 * envelope) * 100) / 100);
	}
	return out;
}
function Setlist() {
	const [open, setOpen] = useState(null);
	const shapes = useMemo(() => Object.fromEntries(SETLIST.map((t) => [t.no, waveform(t.title, 48)])), []);
	return /* @__PURE__ */ jsx("ol", {
		className: "border-t border-line",
		children: SETLIST.map((track) => {
			const expanded = open === track.no;
			const string = TUNING[track.string];
			return /* @__PURE__ */ jsxs("li", {
				className: "border-b border-line",
				children: [/* @__PURE__ */ jsxs("button", {
					type: "button",
					"aria-expanded": expanded,
					onClick: () => {
						wake();
						setOpen(expanded ? null : track.no);
						if (!expanded) strum([
							string.freq,
							string.freq * 1.5,
							string.freq * 2
						], {
							velocity: .45,
							position: .3,
							spread: .07
						});
					},
					onMouseEnter: () => {
						wake();
						pluck(string.freq, {
							velocity: .22,
							position: .55
						});
						emitPluck(track.string, {
							velocity: .22,
							position: .55
						});
					},
					className: "group grid w-full grid-cols-[2.5rem_1fr] items-center gap-x-4 gap-y-2 py-6 text-left transition-colors hover:bg-white/[0.02] sm:grid-cols-[3rem_minmax(0,1fr)_9rem_4rem] sm:gap-x-6",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "self-start font-mono text-xs text-muted tabular-nums transition-colors group-hover:text-ember sm:self-center",
							children: track.no
						}),
						/* @__PURE__ */ jsxs("span", {
							className: "min-w-0",
							children: [/* @__PURE__ */ jsxs("span", {
								className: "flex flex-wrap items-center gap-x-3 gap-y-1",
								children: [/* @__PURE__ */ jsx("span", {
									className: "font-display text-3xl leading-tight tracking-tight transition-colors group-hover:text-ember sm:text-4xl",
									children: track.title
								}), track.award && /* @__PURE__ */ jsxs("span", {
									className: "rounded-full border border-ember/40 px-2.5 py-0.5 font-mono text-[0.6rem] tracking-[0.1em] text-ember uppercase",
									children: ["★ ", track.award]
								})]
							}), /* @__PURE__ */ jsx("span", {
								className: "mt-1 block text-base text-muted",
								children: track.blurb
							})]
						}),
						/* @__PURE__ */ jsx("span", {
							"aria-hidden": true,
							className: "col-span-2 flex h-8 items-center gap-[2px] sm:col-span-1",
							children: shapes[track.no].map((v, i) => /* @__PURE__ */ jsx("span", {
								className: "flex-1 rounded-full bg-line transition-all duration-500 group-hover:bg-ember/70",
								style: {
									height: `${v}%`,
									transitionDelay: `${i * 6}ms`
								}
							}, i))
						}),
						/* @__PURE__ */ jsxs("span", {
							className: "hidden text-right font-mono text-[0.65rem] tracking-widest text-muted uppercase sm:block",
							children: [track.when, /* @__PURE__ */ jsx("span", {
								className: "mt-1 block text-ember/70",
								children: string.note
							})]
						})
					]
				}), /* @__PURE__ */ jsx(Collapse, {
					open: expanded,
					children: /* @__PURE__ */ jsxs("div", {
						className: "grid gap-8 pb-10 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:gap-x-6",
						children: [
							/* @__PURE__ */ jsx("div", { className: "hidden sm:block" }),
							/* @__PURE__ */ jsxs("div", {
								className: "max-w-2xl",
								children: [
									/* @__PURE__ */ jsx("p", {
										className: "text-base leading-relaxed text-ink/80",
										children: track.detail
									}),
									/* @__PURE__ */ jsx("div", {
										className: "mt-5 flex flex-wrap items-center gap-x-2 gap-y-2",
										children: track.stack.map((s) => /* @__PURE__ */ jsx("span", {
											className: "rounded-full border border-line px-3 py-1 font-mono text-[0.65rem] tracking-wide text-muted transition-colors hover:border-ember/50 hover:text-ember",
											children: s
										}, s))
									}),
									track.repo && /* @__PURE__ */ jsxs("a", {
										href: track.repo,
										target: "_blank",
										rel: "noreferrer",
										className: "mt-6 inline-flex items-center gap-2 font-mono text-xs tracking-[0.15em] text-ember uppercase hover:underline hover:underline-offset-4",
										children: ["Source ", /* @__PURE__ */ jsx("span", {
											"aria-hidden": true,
											children: "↗"
										})]
									})
								]
							}),
							/* @__PURE__ */ jsxs("figure", {
								className: "m-0 shrink-0 self-start",
								children: [/* @__PURE__ */ jsx(Harmonograph, {
									seed: track.title,
									active: expanded,
									className: "h-[190px] w-[190px] sm:h-[210px] sm:w-[210px]"
								}), /* @__PURE__ */ jsxs("figcaption", {
									className: "mt-1 text-center font-mono text-[0.55rem] tracking-[0.15em] text-muted uppercase",
									children: ["harmonograph · ", string.note]
								})]
							})
						]
					})
				})]
			}, track.no);
		})
	});
}
//#endregion
//#region src/components/Tour.tsx
function Tour() {
	return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("ol", {
		className: "border-t border-line",
		children: TOUR.map((role, i) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Reveal, {
			delay: i * 90,
			children: /* @__PURE__ */ jsxs("article", {
				className: "grid gap-5 border-b border-line py-9 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-10",
				children: [/* @__PURE__ */ jsxs("header", { children: [/* @__PURE__ */ jsxs("p", {
					className: "flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.15em] text-muted uppercase",
					children: [role.current && /* @__PURE__ */ jsx("span", {
						"aria-hidden": true,
						className: "inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-ember shadow-[0_0_8px_var(--color-ember)]"
					}), role.when]
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-1 font-mono text-[0.65rem] text-muted",
					children: role.where
				})] }), /* @__PURE__ */ jsxs("div", {
					className: "max-w-2xl",
					children: [
						/* @__PURE__ */ jsx("h3", {
							className: "font-display text-2xl tracking-tight sm:text-3xl",
							children: role.company
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-1 font-mono text-xs tracking-[0.12em] text-ember uppercase",
							children: role.title
						}),
						/* @__PURE__ */ jsx("ul", {
							className: "mt-5 space-y-3",
							children: role.points.map((point) => /* @__PURE__ */ jsxs("li", {
								className: "flex gap-3 text-[0.95rem] leading-relaxed text-ink/75",
								children: [/* @__PURE__ */ jsx("span", {
									"aria-hidden": true,
									className: "mt-2.5 h-px w-4 shrink-0 bg-line"
								}), /* @__PURE__ */ jsx("span", { children: point })]
							}, point))
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-5 flex flex-wrap gap-2",
							children: role.stack.map((s) => /* @__PURE__ */ jsx("span", {
								className: "rounded-full border border-line px-3 py-1 font-mono text-[0.65rem] tracking-wide text-muted",
								children: s
							}, s))
						})
					]
				})]
			})
		}) }, role.company))
	}), /* @__PURE__ */ jsx(Reveal, {
		delay: 120,
		children: /* @__PURE__ */ jsxs("div", {
			className: "mt-14 grid gap-10 sm:grid-cols-2 sm:gap-16",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
				className: "font-mono text-[0.65rem] tracking-[0.2em] text-muted uppercase",
				children: "Encores"
			}), /* @__PURE__ */ jsx("ul", {
				className: "mt-5 space-y-4",
				children: AWARDS.map((a) => /* @__PURE__ */ jsxs("li", {
					className: "border-l border-ember/40 pl-4",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-[0.95rem] text-ink",
						children: a.title
					}), /* @__PURE__ */ jsxs("p", {
						className: "mt-0.5 font-mono text-[0.65rem] text-muted",
						children: [
							a.what,
							" · ",
							a.when
						]
					})]
				}, a.title))
			})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
				className: "font-mono text-[0.65rem] tracking-[0.2em] text-muted uppercase",
				children: "Certified"
			}), /* @__PURE__ */ jsx("ul", {
				className: "mt-5 space-y-2.5 font-mono text-[0.7rem] text-muted",
				children: CERTS.map((c) => /* @__PURE__ */ jsx("li", { children: c }, c))
			})] })]
		})
	})] });
}
//#endregion
//#region src/lib/ambience.ts
/**
* Publishes two numbers to the document as CSS custom properties, and lets the
* stylesheet decide what to do with them:
*
*   --energy  0–1, how loud the instrument is right now
*   --scroll  0–1, progress down the page
*
* The backdrop glow breathes on --energy, so the room genuinely lights up with
* what you play rather than looping a canned animation. --scroll warms and
* cools the same glow as you move between the human and machine halves.
*/
function startAmbience() {
	if (typeof window === "undefined") return () => {};
	const root = document.documentElement;
	const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	let bins = null;
	let energy = 0;
	let scroll = 0;
	return onFrame((dt) => {
		const analyser = getAnalyser();
		let target = 0;
		if (analyser) {
			if (!bins || bins.length !== analyser.frequencyBinCount) bins = new Uint8Array(analyser.frequencyBinCount);
			analyser.getByteTimeDomainData(bins);
			let peak = 0;
			for (let i = 0; i < bins.length; i += 4) {
				const v = Math.abs(bins[i] - 128);
				if (v > peak) peak = v;
			}
			target = Math.min(1, peak / 128 * 2.6);
		}
		const rate = target > energy ? 18 : 2.4;
		energy += (target - energy) * Math.min(1, dt * rate);
		const max = document.body.scrollHeight - window.innerHeight;
		const next = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
		scroll += (next - scroll) * Math.min(1, dt * 6);
		root.style.setProperty("--energy", (calm ? target * .3 : energy).toFixed(4));
		root.style.setProperty("--scroll", scroll.toFixed(4));
	});
}
//#endregion
//#region src/routes/index.tsx?tsr-split=component
function Section({ id, index, title, lead, children }) {
	return /* @__PURE__ */ jsxs("section", {
		id,
		className: "edge scroll-mt-20 px-[5vw] py-24 sm:py-32 lg:pl-[9vw]",
		children: [/* @__PURE__ */ jsxs(Reveal, { children: [/* @__PURE__ */ jsxs("header", {
			className: "flex items-baseline gap-4",
			children: [
				/* @__PURE__ */ jsx("span", {
					className: "font-mono text-xs text-ember tabular-nums",
					children: index
				}),
				/* @__PURE__ */ jsx("h2", {
					className: "font-mono text-xs tracking-[0.28em] text-muted uppercase",
					children: title
				}),
				/* @__PURE__ */ jsx("span", {
					"aria-hidden": true,
					className: "h-px flex-1 bg-line"
				})
			]
		}), lead && /* @__PURE__ */ jsx("p", {
			className: "mt-8 max-w-xl text-lg text-muted",
			children: lead
		})] }), /* @__PURE__ */ jsx("div", {
			className: "mt-12",
			children
		})]
	});
}
function Home() {
	useEffect(() => startAmbience(), []);
	const openTuning = () => {
		wake();
		strum(TUNING.map((s) => s.freq), {
			velocity: .55,
			position: .3,
			spread: .09
		});
		TUNING.forEach((_, i) => setTimeout(() => emitPluck(i, {
			velocity: .55,
			position: .3
		}), i * 90));
	};
	return /* @__PURE__ */ jsxs("main", { children: [
		/* @__PURE__ */ jsx(Rail, {}),
		/* @__PURE__ */ jsxs("section", {
			id: "top",
			className: "relative flex min-h-svh flex-col scroll-mt-0",
			children: [
				/* @__PURE__ */ jsx("header", {
					className: "px-[5vw] pt-5",
					children: /* @__PURE__ */ jsx("span", {
						className: "rise font-mono text-[0.65rem] tracking-[0.2em] text-muted uppercase",
						children: /* @__PURE__ */ jsxs("span", {
							style: { animationDelay: "80ms" },
							children: [
								ME.name,
								" ",
								/* @__PURE__ */ jsx("span", {
									className: "text-ember",
									children: "/"
								}),
								" ",
								ME.location
							]
						})
					})
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "px-[5vw] pt-[7vh] lg:pl-[9vw]",
					children: [/* @__PURE__ */ jsxs("h1", {
						className: "font-display text-[clamp(3rem,11.5vw,9rem)] leading-[0.86] font-medium tracking-[-0.04em]",
						children: [/* @__PURE__ */ jsx("span", {
							className: "rise",
							children: /* @__PURE__ */ jsx("span", {
								style: { animationDelay: "150ms" },
								children: "Prithwijit"
							})
						}), /* @__PURE__ */ jsx("span", {
							className: "rise",
							children: /* @__PURE__ */ jsx("span", {
								className: "text-muted",
								style: { animationDelay: "260ms" },
								children: "Ghosh"
							})
						})]
					}), /* @__PURE__ */ jsx("p", {
						className: "rise mt-7 max-w-md text-xl leading-snug text-ink/75 sm:text-2xl",
						children: /* @__PURE__ */ jsxs("span", {
							style: { animationDelay: "420ms" },
							children: [
								"Building sentient AI so I can enjoy my",
								" ",
								/* @__PURE__ */ jsx("span", {
									className: "text-ember",
									children: "guitar sessions"
								}),
								" in peace."
							]
						})
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "relative mt-[4vh] min-h-[max(42vh,260px)] flex-1",
					children: [/* @__PURE__ */ jsx("span", {
						"aria-hidden": true,
						className: "ghost pointer-events-none absolute inset-x-[5vw] top-1/2 -translate-y-1/2 text-center font-display text-[22vw] leading-none font-bold tracking-[-0.05em] select-none",
						children: "GHOSH"
					}), /* @__PURE__ */ jsx(Instrument, {})]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "px-[5vw] pb-7 lg:pl-[9vw]",
					children: /* @__PURE__ */ jsx(Scope, { height: 54 })
				})
			]
		}),
		/* @__PURE__ */ jsx(Section, {
			id: "notes",
			index: "01",
			title: "Liner Notes",
			children: /* @__PURE__ */ jsxs("div", {
				className: "grid gap-12 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-20",
				children: [/* @__PURE__ */ jsx("div", {
					className: "max-w-2xl space-y-7",
					children: ABOUT.map((p, i) => /* @__PURE__ */ jsx(Reveal, {
						delay: i * 110,
						children: /* @__PURE__ */ jsx("p", {
							className: i === 0 ? "text-2xl leading-snug text-ink sm:text-3xl" : "text-base leading-relaxed text-ink/70",
							children: p
						})
					}, i))
				}), /* @__PURE__ */ jsx(Reveal, {
					delay: 160,
					children: /* @__PURE__ */ jsx("dl", {
						className: "h-fit border-t border-line font-mono text-xs",
						children: FACTS.map(([k, v]) => /* @__PURE__ */ jsxs("div", {
							className: "flex items-baseline justify-between gap-6 border-b border-line py-3.5",
							children: [/* @__PURE__ */ jsx("dt", {
								className: "shrink-0 tracking-[0.15em] text-muted uppercase",
								children: k
							}), /* @__PURE__ */ jsx("dd", {
								className: "text-right text-ink/80",
								children: v
							})]
						}, k))
					})
				})]
			})
		}),
		/* @__PURE__ */ jsx(Section, {
			id: "setlist",
			index: "02",
			title: "Setlist",
			lead: "Four things I built, each tuned to one of the strings above. Hover to hear it. Click for the liner notes.",
			children: /* @__PURE__ */ jsx(Setlist, {})
		}),
		/* @__PURE__ */ jsx(Section, {
			id: "tour",
			index: "03",
			title: "Tour Dates",
			lead: "Where the work has actually shipped.",
			children: /* @__PURE__ */ jsx(Tour, {})
		}),
		/* @__PURE__ */ jsx(Section, {
			id: "rig",
			index: "04",
			title: "The Rig",
			lead: "Signal chain, input to amp. The lit ones are what I reach for first.",
			children: /* @__PURE__ */ jsx(Pedalboard, {})
		}),
		/* @__PURE__ */ jsxs(Section, {
			id: "encore",
			index: "05",
			title: "Encore",
			children: [
				/* @__PURE__ */ jsxs(Reveal, { children: [/* @__PURE__ */ jsx("p", {
					className: "max-w-3xl font-display text-3xl leading-tight font-medium tracking-tight sm:text-5xl",
					children: "Got something worth building?"
				}), /* @__PURE__ */ jsx("a", {
					href: `mailto:${ME.email}`,
					className: "mt-8 inline-block font-mono text-xl break-all text-ember transition-colors hover:text-ink sm:text-3xl",
					children: ME.email
				})] }),
				/* @__PURE__ */ jsx(Reveal, {
					delay: 100,
					children: /* @__PURE__ */ jsx("ul", {
						className: "mt-16 border-t border-line",
						children: SIGNALS.map((s) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("a", {
							href: s.href,
							target: "_blank",
							rel: "noreferrer",
							className: "group flex items-baseline gap-4 border-b border-line py-5 transition-colors hover:bg-white/[0.02] sm:gap-8",
							children: [
								/* @__PURE__ */ jsx("span", {
									className: "w-8 font-mono text-[0.6rem] tracking-widest text-muted transition-colors group-hover:text-signal",
									children: s.band
								}),
								/* @__PURE__ */ jsx("span", {
									className: "min-w-0 flex-1 font-display text-2xl font-medium tracking-tight transition-colors group-hover:text-ember sm:text-3xl",
									children: s.label
								}),
								/* @__PURE__ */ jsx("span", {
									className: "hidden truncate font-mono text-xs text-muted sm:block",
									children: s.where
								}),
								/* @__PURE__ */ jsx("span", {
									"aria-hidden": true,
									className: "font-mono text-sm text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-ember",
									children: "↗"
								})
							]
						}) }, s.label))
					})
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-14",
					children: /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: openTuning,
						className: "rounded-full border border-line px-6 py-3 font-mono text-[0.7rem] tracking-[0.2em] text-muted uppercase transition-all hover:-translate-y-0.5 hover:border-ember/60 hover:text-ember",
						children: "♪ Strum all six"
					})
				}),
				/* @__PURE__ */ jsxs("footer", {
					className: "mt-24 flex flex-col gap-3 border-t border-line pt-8 font-mono text-[0.65rem] tracking-wide text-muted sm:flex-row sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ jsx("span", {
						className: "max-w-xl",
						children: "Strings are simulated, not sampled — Karplus-Strong synthesis and the modal equation for a plucked string. No audio libraries."
					}), /* @__PURE__ */ jsxs("span", {
						className: "shrink-0",
						children: [
							"© ",
							(/* @__PURE__ */ new Date()).getFullYear(),
							" — ",
							ME.location
						]
					})]
				})
			]
		})
	] });
}
//#endregion
export { Home as component };
