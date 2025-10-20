import React, { useEffect, useRef, useState } from "react";

/**
 * SVG-based Balloon & Sweater static electricity sim.
 * - Drag the balloon (mouse/touch).
 * - When it gets close to the sweater, electrons animate from sweater -> balloon.
 * - After enough electrons transfer, the balloon sticks to the sweater (visually attaches).
 *
 * No sound. No auto-reset. No control panel.
 */

/* ====== Assets (place images in src/assets/) ====== */
import balloonImg from "../assets/balloon.png";
import sweaterImg from "../assets/sweater.png";
// electronImg is optional; if missing, sim draws a small glowing circle
let electronImg: string | null = null;
try {
  // @ts-expect-error
  electronImg = require("../assets/electron.png").default;
} catch (e) {
  electronImg = null;
}

/* ====== Types ====== */
type Electron = {
  id: number;
  // start position (on sweater), target position (on balloon)
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  // animation progress 0..1
  t: number;
  // state: 'idle' (lying on sweater), 'moving', 'attached' (on balloon)
  state: "idle" | "moving" | "attached";
  // visual offset for small curve
  offset: number;
};

/* ====== Visual constants ====== */
const VIEW_W = 1000;
const VIEW_H = 640;

/* Sweater placement */
const SWEATER = {
  x: 120,
  y: 360,
  w: 760,
  h: 140,
};

/* Balloon initial placement */
const BALLOON_INIT = { x: VIEW_W - 180, y: 160, r: 44 };

/* Sim tuning */
const PROXIMITY_THRESHOLD = 160; // px from balloon center to sweater top center to start induction
const ELECTRON_TOTAL = 16; // how many electrons visually available in sweater
const ELECTRON_TO_STICK = 6; // how many electrons must transfer to make balloon stick
const TRANSFER_DURATION = 700; // ms for each electron animation
const TRANSFER_INTERVAL = 90; // ms between starting successive electron animations

export default function SimulationCanvas(): JSX.Element {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // balloon state (ref so animation loop doesn't cause rerenders)
  const balloonRef = useRef({
    x: BALLOON_INIT.x,
    y: BALLOON_INIT.y,
    r: BALLOON_INIT.r,
    vx: 0,
    vy: 0,
    dragging: false,
    stuck: false,
  });

  // reactive state used to force small re-renders for UI updates like electron rendering
  const [, setTick] = useState(0);

  // electrons
  const electronsRef = useRef<Electron[]>([]);
  const electronIdRef = useRef(0);

  // transfer control
  const transferActiveRef = useRef(false);
  const lastTransferStartRef = useRef<number>(0);
  const nextTransferIndexRef = useRef(0);
  const transferredCountRef = useRef(0);

  // pointer dragging
  const activePointerRef = useRef<number | null>(null);

  // rAF
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);

  // initialize electrons lying on sweater
  useEffect(() => {
    const arr: Electron[] = [];
    const cols = 8;
    const rows = Math.ceil(ELECTRON_TOTAL / cols);
    let id = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols && id < ELECTRON_TOTAL; c++) {
        const sx =
          SWEATER.x + 24 + (c / (cols - 1 || 1)) * (SWEATER.w - 48) + (Math.random() - 0.5) * 8;
        const sy =
          SWEATER.y + 20 + (r / (rows - 1 || 1)) * (SWEATER.h - 48) + (Math.random() - 0.5) * 8;
        arr.push({
          id: electronIdRef.current++,
          sx,
          sy,
          tx: sx,
          ty: sy,
          t: 0,
          state: "idle",
          offset: (Math.random() - 0.5) * 40,
        });
        id++;
      }
    }
    electronsRef.current = arr;
    // small initial render
    setTick((v) => v + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // animation loop
  useEffect(() => {
    lastFrameRef.current = performance.now();

    const frame = (now: number) => {
      const last = lastFrameRef.current || now;
      const dt = now - last;
      lastFrameRef.current = now;

      step(dt);
      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // physics & progression
  function step(dtMs: number) {
    // animate electrons
    const electrons = electronsRef.current;
    let anyChange = false;
    for (const e of electrons) {
      if (e.state === "moving") {
        // progress
        const speed = dtMs / TRANSFER_DURATION;
        e.t = Math.min(1, e.t + speed);
        // quadratic ease for nicer motion
        const u = e.t;
        const ease = u * (2 - u);
        // compute curved path using offset for slight arc
        const cx = e.sx + (e.tx - e.sx) * ease;
        const cy = e.sy + (e.ty - e.sy) * ease - Math.sin(ease * Math.PI) * (e.offset * 0.5);
        // save temporary positions in tx/ty (we don't need separate storage)
        e.tx = cx;
        e.ty = cy;
        anyChange = true;
        if (e.t >= 1) {
          // arrived -> mark as attached
          e.state = "attached";
          transferredCountRef.current++;
        }
      }
    }

    // balloon dynamics: when stuck, it should gently remain attached; otherwise small physics (inertia)
    const b = balloonRef.current;
    if (!b.dragging && !b.stuck) {
      // gentle damping
      b.vx *= 0.92;
      b.vy *= 0.92;
      b.x += b.vx * (dtMs / 16);
      b.y += b.vy * (dtMs / 16);
      // bounds
      b.x = Math.max(b.r + 6, Math.min(VIEW_W - b.r - 6, b.x));
      b.y = Math.max(b.r + 6, Math.min(SWEATER.y - b.r - 6, b.y));
      anyChange = true;
    }

    // transfer orchestration: if balloon is close to sweater top center, start transfers
    const sweaterCenterX = SWEATER.x + SWEATER.w / 2;
    const sweaterTopY = SWEATER.y;
    const dx = b.x - sweaterCenterX;
    const dy = b.y - (sweaterTopY - 12); // measure to slightly above sweater top
    const distance = Math.hypot(dx, dy);

    // start transfer when within threshold and not already active and not stuck
    if (!transferActiveRef.current && distance < PROXIMITY_THRESHOLD && !b.stuck) {
      transferActiveRef.current = true;
      nextTransferIndexRef.current = 0;
      lastTransferStartRef.current = performance.now();
      // schedule first electron immediately
      triggerNextElectron();
    }

    // If transfers are active, periodically start next electron animations until none left idle
    if (transferActiveRef.current) {
      const now = performance.now();
      if (
        nextTransferIndexRef.current < electronsRef.current.length &&
        now - lastTransferStartRef.current >= TRANSFER_INTERVAL
      ) {
        triggerNextElectron();
        lastTransferStartRef.current = now;
      }
      // if enough electrons attached, make balloon stick
      if (transferredCountRef.current >= ELECTRON_TO_STICK && !b.stuck) {
        // compute attach position: slightly above sweater
        b.stuck = true;
        // snap balloon to an x near current x but clamped inside sweater width
        const attachX = Math.max(
          SWEATER.x + b.r + 12,
          Math.min(SWEATER.x + SWEATER.w - b.r - 12, b.x)
        );
        b.x = attachX;
        b.y = SWEATER.y - b.r - 2;
        b.vx = 0;
        b.vy = 0;
        anyChange = true;
      }

      // stop transfer if all electrons moved or balloon moved away before stick
      const allStarted = electronsRef.current.every((e) => e.state !== "idle");
      // if balloon moved away before many transferred and all started, we stop attempts
      if (allStarted && distance > PROXIMITY_THRESHOLD * 1.35) {
        transferActiveRef.current = false;
      }
    }

    if (anyChange) {
      // re-render by ticking state
      setTick((v) => v + 1);
    }
  }

  function triggerNextElectron() {
    const electrons = electronsRef.current;
    // find next idle electron
    const idx = electrons.findIndex((e) => e.state === "idle");
    if (idx === -1) {
      // none left
      transferActiveRef.current = false;
      return;
    }
    const e = electrons[idx];
    // set target to a point on balloon circumference (random angle cluster towards sweater)
    const b = balloonRef.current;
    const angle = (Math.random() * 0.9 - 0.45) * Math.PI + Math.PI; // bias toward left (balloon -> sweater direction)
    const tx = b.x + Math.cos(angle) * (b.r * 0.5 + 6);
    const ty = b.y + Math.sin(angle) * (b.r * 0.5 + 6);
    e.tx = tx;
    e.ty = ty;
    e.t = 0;
    e.state = "moving";
    nextTransferIndexRef.current++;
  }

  /* ===== Pointer events ===== */
  useEffect(() => {
    const svg = svgRef.current!;
    if (!svg) return;

    let pointerCaptured = false;

    const onPointerDown = (ev: PointerEvent) => {
      const b = balloonRef.current;
      // compute pointer in SVG coords
      const rect = svg.getBoundingClientRect();
      const px = ev.clientX - rect.left;
      const py = ev.clientY - rect.top;
      const d = Math.hypot(px - b.x, py - b.y);
      if (d <= b.r + 6) {
        // start dragging
        (ev.target as Element).setPointerCapture(ev.pointerId);
        activePointerRef.current = ev.pointerId;
        b.dragging = true;
        b.vx = 0;
        b.vy = 0;
        pointerCaptured = true;
      }
    };

    const onPointerMove = (ev: PointerEvent) => {
      const pid = ev.pointerId;
      if (activePointerRef.current !== pid) return;
      const b = balloonRef.current;
      const rect = svg.getBoundingClientRect();
      const px = ev.clientX - rect.left;
      const py = ev.clientY - rect.top;

      // update position — keep balloon above sweater (cannot drag into sweater)
      const clampedX = Math.max(b.r + 8, Math.min(VIEW_W - b.r - 8, px));
      const clampedY = Math.max(b.r + 8, Math.min(SWEATER.y - b.r - 8, py));
      // update velocity as smoothing
      b.vx = (clampedX - b.x) * 0.6;
      b.vy = (clampedY - b.y) * 0.6;
      b.x = clampedX;
      b.y = clampedY;
      // cancel any "stuck" state if user drags away
      if (b.stuck) {
        b.stuck = false;
        // when user drags away, transferred electrons remain attached visually; they do not auto-return
      }
      setTick((v) => v + 1);
    };

    const onPointerUp = (ev: PointerEvent) => {
      const pid = ev.pointerId;
      if (activePointerRef.current !== pid) return;
      const b = balloonRef.current;
      b.dragging = false;
      activePointerRef.current = null;
      if (pointerCaptured) {
        try {
          (ev.target as Element).releasePointerCapture(ev.pointerId);
        } catch (e) {
          // ignore
        }
      }
    };

    svg.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      svg.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  /* ======== Render SVG ======== */
  const electrons = electronsRef.current;
  const b = balloonRef.current;

  return (
    <div className="w-full flex justify-center">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width="100%"
        height={(VIEW_H / VIEW_W) * 100 + "%"}
        preserveAspectRatio="xMidYMid meet"
        className="rounded-md bg-transparent shadow-2xl"
        style={{ maxHeight: "72vh", background: "linear-gradient(180deg,#071025,#071820)" }}
      >
        {/* Sweater (image) */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <image
          href={sweaterImg}
          x={SWEATER.x}
          y={SWEATER.y}
          width={SWEATER.w}
          height={SWEATER.h}
          preserveAspectRatio="xMidYMid slice"
        />

        {/* electrons on sweater and moving ones */}
        <g id="electrons">
          {electrons.map((e) => {
            if (e.state === "idle") {
              // draw at starting position
              return electronImg ? (
                <image
                  key={e.id}
                  href={electronImg as string}
                  x={e.sx - 6}
                  y={e.sy - 6}
                  width={12}
                  height={12}
                />
              ) : (
                <circle key={e.id} cx={e.sx} cy={e.sy} r={4} fill="#65d0ff" opacity={0.95} />
              );
            } else if (e.state === "moving") {
              // use tx,ty as temporary current position
              return electronImg ? (
                <image
                  key={e.id}
                  href={electronImg as string}
                  x={e.tx - 7}
                  y={e.ty - 7}
                  width={14}
                  height={14}
                />
              ) : (
                <g key={e.id}>
                  <circle cx={e.tx} cy={e.ty} r={5} fill="#7fe1ff" opacity={0.98} />
                  <circle cx={e.tx} cy={e.ty} r={8} fill="none" stroke="#7fe1ff" strokeOpacity={0.16} />
                </g>
              );
            } else {
              // attached: show on balloon edge (we keep e.tx,e.ty where attached)
              return electronImg ? (
                <image
                  key={e.id}
                  href={electronImg as string}
                  x={e.tx - 6}
                  y={e.ty - 6}
                  width={12}
                  height={12}
                />
              ) : (
                <circle key={e.id} cx={e.tx} cy={e.ty} r={4} fill="#60baff" opacity={0.95} />
              );
            }
          })}
        </g>

        {/* balloon tether to sweater (visual subtle line when stuck) */}
        {b.stuck && (
          <line
            x1={b.x}
            y1={b.y + b.r * 0.6}
            x2={b.x}
            y2={SWEATER.y + 6}
            stroke="rgba(255,255,255,0.03)"
            strokeWidth={2}
          />
        )}

        {/* balloon image */}
        <g transform={`translate(${b.x}, ${b.y})`} style={{ pointerEvents: "none" }}>
          <image
            href={balloonImg}
            x={-b.r}
            y={-b.r}
            width={b.r * 2}
            height={b.r * 2}
            preserveAspectRatio="xMidYMid slice"
            style={{ filter: b.stuck ? "none" : "drop-shadow(0 6px 18px rgba(0,0,0,0.45))" }}
          />
        </g>

        {/* subtle attraction indicator (vector) */}
        {!b.stuck && (
          <g>
            {/* compute net approximate force vector from sweater center */}
            {(() => {
              const sx = SWEATER.x + SWEATER.w / 2;
              const sy = SWEATER.y + SWEATER.h / 2;
              const fx = sx - b.x;
              const fy = sy - b.y;
              const len = Math.hypot(fx, fy) || 1;
              const scale = Math.min(1, 120 / len);
              const ax = b.x + (fx / len) * scale * 28;
              const ay = b.y + (fy / len) * scale * 28;
              return (
                <g opacity={0.08}>
                  <line x1={b.x} y1={b.y} x2={ax} y2={ay} stroke="#ffd166" strokeWidth={2} />
                  <circle cx={ax} cy={ay} r={6} fill="#ffd166" />
                </g>
              );
            })()}
          </g>
        )}

        {/* HUD small text */}
        <text x={16} y={28} fontSize={14} fill="#cbd5e1">
          {`Electrons transferred: ${transferredCountRef.current} / ${ELECTRON_TO_STICK}`}
        </text>
      </svg>
    </div>
  );
}
