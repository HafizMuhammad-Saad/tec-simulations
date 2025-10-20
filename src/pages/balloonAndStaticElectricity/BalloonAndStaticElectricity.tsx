import React, { useEffect, useRef, useState } from "react";

/**
 * SVG-based PhET-like Balloons & Static Electricity
 * - Sweater with many + / - symbols (SVG)
 * - Balloon (SVG) draggable by pointer
 * - Wall on right with charges
 * - When balloon is rubbed on sweater, negative charges move to balloon (animated)
 * - After enough negative charges transferred, balloon sticks
 */

/* ---------------- constants & layout ---------------- */
const VIEW_W = 1200;
const VIEW_H = 720;

const SWEATER = { x: 48, y: 48, w: 520, h: 560 }; // left big sweater
const BALLOON_INIT = { x: 760, y: 220, r: 60 };
const WALL = { x: VIEW_W - 90, y: 40, w: 70, h: VIEW_H - 80 };

const TOTAL_COLS = 7; // charges per sweater column visually
const TOTAL_ROWS = 9;
const ELECTRON_TOTAL = TOTAL_COLS * TOTAL_ROWS; // number of charge positions available
const TRANSFER_NEEDED = 6; // electrons required to stick
const PROXIMITY_THRESHOLD = 160; // start induction when balloon center closer than this to sweater top center
const RUB_SPEED_THRESHOLD = 6; // pixels per pointer move to count as rubbing
const TRANSFER_INTERVAL_MS = 110; // ms between starting electron transfers
const TRANSFER_TIME_MS = 600; // ms per electron travel animation

type Charge = {
  id: number;
  x: number;
  y: number;
  sign: 1 | -1;         // +1 for plus, -1 for minus
  mobile?: boolean;     // used for small induction shift
  state?: "idle" | "moving" | "attached"; // moving → to balloon, attached → on balloon
  // animated positions (for moving or attached)
  ax?: number; // current animated x
  ay?: number; // current animated y
  t?: number;  // progress 0..1
  offset?: number; // arc offset
};

export default function SimulationCanvas(): JSX.Element {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // balloon state (ref)
  const balloonRef = useRef({
    x: BALLOON_INIT.x,
    y: BALLOON_INIT.y,
    r: BALLOON_INIT.r,
    vx: 0,
    vy: 0,
    dragging: false,
    stuck: false,
  });

  const [renderTick, setRenderTick] = useState(0);

  // charges on sweater (array)
  const chargesRef = useRef<Charge[]>([]);
  const chargeId = useRef(0);

  // wall charges (static array)
  const wallChargesRef = useRef<Charge[]>([]);

  // transfer control
  const transferActiveRef = useRef(false);
  const lastTransferTimeRef = useRef(0);
  const transferredCountRef = useRef(0);

  // pointer tracking for rub detection
  const activePointerRef = useRef<number | null>(null);
  const lastPointerPosRef = useRef<{ x: number; y: number } | null>(null);

  // rAF
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  /* ------- initialize charges for sweater and wall ------- */
  useEffect(() => {
    const arr: Charge[] = [];
    const marginX = 36;
    const marginY = 36;
    const cols = TOTAL_COLS;
    const rows = TOTAL_ROWS;
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const x = SWEATER.x + marginX + (col / (cols - 1 || 1)) * (SWEATER.w - marginX * 2) + (Math.random() - 0.5) * 8;
        const y = SWEATER.y + marginY + (row / (rows - 1 || 1)) * (SWEATER.h - marginY * 2) + (Math.random() - 0.5) * 6;
        const sign: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
        arr.push({ id: chargeId.current++, x, y, sign, mobile: Math.random() < 0.5, state: "idle", ax: x, ay: y, t: 0, offset: (Math.random() - 0.5) * 50 });
      }
    }
    chargesRef.current = arr;

    // wall charges: vertical column repeating + and - visually
    const wArr: Charge[] = [];
    const step = 28;
    let y = WALL.y + 16;
    let idx = 0;
    while (y < WALL.y + WALL.h - 16) {
      const sign: 1 | -1 = idx % 2 === 0 ? 1 : -1;
      wArr.push({ id: chargeId.current++, x: WALL.x + WALL.w / 2, y, sign });
      y += step;
      idx++;
    }
    wallChargesRef.current = wArr;

    // initial render
    setRenderTick((v) => v + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------- animation frame loop ------- */
  useEffect(() => {
    lastTimeRef.current = performance.now();
    const loop = (now: number) => {
      const last = lastTimeRef.current || now;
      const dt = now - last;
      lastTimeRef.current = now;
      step(dt);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- step (physics + animation) ---------- */
  function step(dtMs: number) {
    let mutated = false;
    // animate moving charges (t from 0..1)
    for (const c of chargesRef.current) {
      if (c.state === "moving") {
        c.t = Math.min(1, (c.t || 0) + dtMs / TRANSFER_TIME_MS);
        const u = c.t!;
        const ease = u * (2 - u); // smooth ease out-in
        // compute curved path from start(x,y) -> balloonTarget(ax,ay). We saved ax/ay as target when started
        const sx = c.x;
        const sy = c.y;
        const tx = c.ax ?? sx;
        const ty = c.ay ?? sy;
        // curved path: along line with sinusoidal offset perpendicular
        const cx = sx + (tx - sx) * ease;
        const cy = sy + (ty - sy) * ease - Math.sin(ease * Math.PI) * (c.offset ?? 20);
        c.ax = cx; c.ay = cy;
        mutated = true;
        if (c.t! >= 1) {
          c.state = "attached";
          transferredCountRef.current++;
        }
      } else if (c.state === "idle" && c.mobile) {
        // slight induction shift toward balloon when near (visual only)
        const b = balloonRef.current;
        const d = Math.hypot(b.x - c.x, b.y - c.y);
        const effect = Math.max(0, 1 - d / 260);
        if (effect > 0.02) {
          const dirx = (b.x - c.x) / (d + 0.001);
          const diry = (b.y - c.y) / (d + 0.001);
          c.ax = (c.ax ?? c.x) + dirx * effect * 0.6;
          c.ay = (c.ay ?? c.y) + diry * effect * 0.6;
          mutated = true;
        } else {
          // relax back to base
          if (c.ax && Math.abs(c.ax - c.x) > 0.1) {
            c.ax += (c.x - c.ax) * 0.06;
            c.ay! += (c.y - c.ay!) * 0.06;
            mutated = true;
          } else {
            c.ax = c.x; c.ay = c.y;
          }
        }
      }
    }

    // gentle inertia for balloon when not dragging and not stuck
    const b = balloonRef.current;
    if (!b.dragging && !b.stuck) {
      b.vx *= 0.92; b.vy *= 0.92;
      b.x += b.vx * (dtMs / 16);
      b.y += b.vy * (dtMs / 16);
      // clamp above sweater
      b.x = Math.max(b.r + 8, Math.min(VIEW_W - b.r - 120, b.x));
      b.y = Math.max(b.r + 8, Math.min(SWEATER.y - b.r - 8, b.y));
      mutated = true;
    }

    // handle transfer activation when close to sweater top and dragging/rubbing
    const sweaterCenterX = SWEATER.x + SWEATER.w / 2;
    const sweaterTopY = SWEATER.y;
    const dx = b.x - sweaterCenterX;
    const dy = b.y - (sweaterTopY - 12);
    const dist = Math.hypot(dx, dy);

    if (!transferActiveRef.current && dist < PROXIMITY_THRESHOLD) {
      // if balloon is being dragged and user is moving (rub detection)
      if (b.dragging && isRubbing()) {
        startTransfers();
      }
    }

    // if transfers active, schedule additional transfers on interval
    if (transferActiveRef.current) {
      const now = performance.now();
      if (now - lastTransferTimeRef.current >= TRANSFER_INTERVAL_MS) {
        startOneTransfer();
        lastTransferTimeRef.current = now;
      }
    }

    // if enough transferred -> stick
    if (!b.stuck && transferredCountRef.current >= TRANSFER_NEEDED) {
      b.stuck = true;
      // snap balloon onto sweater top near current x but within sweater bounds
      const attachX = Math.max(SWEATER.x + b.r + 8, Math.min(SWEATER.x + SWEATER.w - b.r - 8, b.x));
      b.x = attachX;
      b.y = SWEATER.y - b.r - 2;
      b.vx = 0; b.vy = 0;
      mutated = true;
    }

    if (mutated) setRenderTick((v) => v + 1);
  }

  /* ---------- transfer helpers ---------- */
  function startTransfers() {
    transferActiveRef.current = true;
    lastTransferTimeRef.current = performance.now() - TRANSFER_INTERVAL_MS; // trigger immediate
  }

  function startOneTransfer() {
    // find next idle negative charge on sweater (we choose negative charges only)
    const candidates = chargesRef.current.filter((c) => c.state === "idle" && c.sign === -1);
    if (candidates.length === 0) {
      transferActiveRef.current = false;
      return;
    }
    // pick candidate closest to balloon
    const b = balloonRef.current;
    candidates.sort((a, b2) => {
      const da = Math.hypot(a.x - b.x, a.y - b.y);
      const db = Math.hypot(b2.x - b.x, b2.y - b.y);
      return da - db;
    });
    const chosen = candidates[0];
    // mark moving and set target position near balloon (random around its left face)
    chosen.state = "moving";
    chosen.t = 0;
    const angle = (Math.random() - 0.5) * 0.8 * Math.PI + Math.PI; // bias toward left side
    const tx = b.x + Math.cos(angle) * (b.r * 0.5 + 6);
    const ty = b.y + Math.sin(angle) * (b.r * 0.5 + 6);
    // store tx/ty into ax/ay as final target; we will repurpose ax/ay during animation to hold current pos
    chosen.ax = tx;
    chosen.ay = ty;
    // keep original x,y unchanged for curve start
    chosen.offset = (Math.random() - 0.5) * 48;
  }

  function isRubbing() {
    // detect rubbing via pointer movement speed; returns true if user moved pointer significantly recently
    const last = lastPointerPosRef.current;
    if (!last) return false;
    // compute magnitude of recent movement (counting that we update lastPointerPos in pointermove handler)
    // we'll store a global small movement magnitude into lastPointerPosRef as temp. Simpler: return true if last movement saved > threshold.
    // We keep lastPointerPosRef as {x,y,moved} where moved is last move magnitude
    // But for simplicity, if dragging and last move distance > threshold, consider rubbing.
    const moved = (last as any).moved as number | undefined;
    return (moved ?? 0) > RUB_SPEED_THRESHOLD;
  }

  /* ---------- pointer events (drag + rub detection) ---------- */
  useEffect(() => {
    const svg = svgRef.current!;
    if (!svg) return;
    let captured = false;

    const down = (ev: PointerEvent) => {
      const rect = svg.getBoundingClientRect();
      const px = ev.clientX - rect.left;
      const py = ev.clientY - rect.top;
      const b = balloonRef.current;
      const d = Math.hypot(px - b.x, py - b.y);
      if (d <= b.r + 8) {
        svg.setPointerCapture(ev.pointerId);
        activePointerRef.current = ev.pointerId;
        lastPointerPosRef.current = { x: px, y: py, moved: 0 } as any;
        b.dragging = true;
        b.vx = 0; b.vy = 0;
        captured = true;
      }
    };

    const move = (ev: PointerEvent) => {
      const pid = ev.pointerId;
      if (activePointerRef.current !== pid) return;
      const rect = svg.getBoundingClientRect();
      const px = ev.clientX - rect.left;
      const py = ev.clientY - rect.top;
      const last = lastPointerPosRef.current;
      const moved = last ? Math.hypot(px - last.x, py - last.y) : 0;
      lastPointerPosRef.current = { x: px, y: py, moved } as any;
      const b = balloonRef.current;
      // clamp to not go inside sweater y area
      const nx = Math.max(b.r + 8, Math.min(VIEW_W - b.r - 120, px));
      const ny = Math.max(b.r + 8, Math.min(SWEATER.y - b.r - 8, py));
      // smoothing velocity
      b.vx = (nx - b.x) * 0.6;
      b.vy = (ny - b.y) * 0.6;
      b.x = nx; b.y = ny;
      // dragging away resets stick
      if (b.stuck) b.stuck = false;
      setRenderTick((v) => v + 1);
    };

    const up = (ev: PointerEvent) => {
      const pid = ev.pointerId;
      if (activePointerRef.current !== pid) return;
      const b = balloonRef.current;
      b.dragging = false;
      activePointerRef.current = null;
      lastPointerPosRef.current = null;
      if (captured) {
        try { svg.releasePointerCapture(ev.pointerId); } catch {}
      }
    };

    svg.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);

    return () => {
      svg.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  /* ---------- small helper for drawing +/- symbol ---------- */
  function PlusMinusSymbol({ sign, size = 12 }: { sign: 1 | -1; size?: number }) {
    const color = sign === 1 ? "#ff4d4f" : "#2fa6ff";
    const stroke = "#fff";
    if (sign === 1) {
      // plus
      return (
        <g>
          <circle r={size / 2} fill={color} stroke={stroke} strokeWidth={1} />
          <rect x={-size * 0.15} y={-size * 0.4} width={size * 0.3} height={size * 0.8} fill={stroke} />
          <rect x={-size * 0.4} y={-size * 0.15} width={size * 0.8} height={size * 0.3} fill={stroke} />
        </g>
      );
    } else {
      // minus
      return (
        <g>
          <circle r={size / 2} fill={color} stroke={stroke} strokeWidth={1} />
          <rect x={-size * 0.35} y={-size * 0.12} width={size * 0.7} height={size * 0.24} fill={stroke} />
        </g>
      );
    }
  }

  /* ---------- render ---------- */
  const b = balloonRef.current;
  const charges = chargesRef.current;
  const wallCharges = wallChargesRef.current;
  const transferred = transferredCountRef.current;

  return (
    <div className="w-full flex justify-center">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width="100%"
        height={(VIEW_H / VIEW_W) * 100 + "%"}
        preserveAspectRatio="xMidYMid meet"
        className="rounded-md shadow-2xl"
        style={{ background: "linear-gradient(180deg,#bfe9ff,#97d1ff)" }}
        aria-label="Balloons and Static Electricity simulation"
      >
        {/* sweater background + knit pattern */}
        <defs>
          <pattern id="knit" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M0 6 Q2 2 4 6 T8 6" stroke="#d6d6d6" strokeWidth="1" fill="none" />
          </pattern>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* wall (right) */}
        <rect x={WALL.x} y={WALL.y} width={WALL.w} height={WALL.h} rx={8} fill="#fff" stroke="#cbd5e1" />
        <g>
          {wallCharges.map((c, i) => (
            <g key={c.id} transform={`translate(${c.x}, ${c.y})`}>
              <PlusMinusSymbol sign={c.sign} size={18} />
            </g>
          ))}
        </g>

        {/* sweater */}
        <g>
          <rect x={SWEATER.x} y={SWEATER.y} width={SWEATER.w} height={SWEATER.h} rx={24}
            fill="#f7f7f7" stroke="#c2c2c2" strokeWidth={3} />
          <rect x={SWEATER.x} y={SWEATER.y} width={SWEATER.w} height={SWEATER.h} rx={24} fill="url(#knit)" opacity={0.45} />
        </g>

        {/* render sweater charges */}
        <g>
          {charges.map((c) => {
            const px = c.state === "moving" || c.state === "attached" ? (c.ax ?? c.x) : (c.ax ?? c.x);
            const py = c.state === "moving" || c.state === "attached" ? (c.ay ?? c.y) : (c.ay ?? c.y);
            return (
              <g key={c.id} transform={`translate(${px}, ${py})`} style={{ pointerEvents: "none" }}>
                <PlusMinusSymbol sign={c.sign} size={14} />
              </g>
            );
          })}
        </g>

        {/* balloon (circle + shine) */}
        <g transform={`translate(${b.x}, ${b.y})`} style={{ cursor: "grab" }}>
          <defs>
            <radialGradient id="ballGrad" cx="30%" cy="30%">
              <stop offset="0%" stopColor="#fffebb" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#fff77a" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#ffd200" stopOpacity="0.95" />
            </radialGradient>
          </defs>
          <circle r={b.r} fill="url(#ballGrad)" stroke="#caa300" strokeWidth={3} />
          {/* highlight */}
          <ellipse cx={-b.r * 0.22} cy={-b.r * 0.35} rx={b.r * 0.36} ry={b.r * 0.18} fill="rgba(255,255,255,0.55)" />
          {/* small string */}
          <path d={`M 6 ${b.r - 8} q 6 24 0 48`} stroke="#222" strokeWidth={1.2} fill="none" opacity={0.38} />
        </g>

        {/* when balloon is stuck, draw subtle connection to sweater */}
        {b.stuck && (
          <line x1={b.x} y1={b.y + b.r * 0.6} x2={b.x} y2={SWEATER.y + 6}
            stroke="rgba(0,0,0,0.06)" strokeWidth={3} />
        )}

        {/* small attraction indicator when not stuck */}
        {!b.stuck && (
          (() => {
            const sx = SWEATER.x + SWEATER.w / 2;
            const sy = SWEATER.y + SWEATER.h / 2;
            const fx = sx - b.x; const fy = sy - b.y;
            const len = Math.hypot(fx, fy) || 1;
            const scale = Math.min(1, 120 / len);
            const ax = b.x + (fx / len) * scale * 26;
            const ay = b.y + (fy / len) * scale * 26;
            return (
              <g opacity={0.08}>
                <line x1={b.x} y1={b.y} x2={ax} y2={ay} stroke="#ffd166" strokeWidth={2} />
                <circle cx={ax} cy={ay} r={6} fill="#ffd166" />
              </g>
            );
          })()
        )}

        {/* HUD: transferred count */}
        {/* <text x={SWEATER.x + 12} y={SWEATER.y + SWEATER.h + 28} fontSize={16} fill="#0f172a">
          {`Transferred: ${transferred} / ${TRANSFER_NEEDED}`}
        </text> */}
      </svg>
    </div>
  );
}
