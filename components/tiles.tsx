/*
 * Shared tile primitives for the dashboard and analytics pages: a solid card
 * tile, an empty-state tile (centered monochrome line-art illustration with
 * the explanation underneath), the time-scaled score TrendChart, and the
 * illustration set. Empty states never show sample data that could be
 * mistaken for the real thing.
 */

export function formatTileDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function Tile({
  title,
  caption,
  span,
  children,
}: {
  title: string;
  caption?: React.ReactNode;
  span?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-xl bg-card p-5 shadow-resting ring-1 ring-foreground/10 ${span ?? ""}`}
    >
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="flex flex-1 flex-col justify-center">{children}</div>
      {caption ? (
        <p className="text-sm text-muted-foreground">{caption}</p>
      ) : null}
    </div>
  );
}

export function EmptyTile({
  title,
  description,
  span,
  children,
}: {
  title: string;
  description: string;
  span?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-xl bg-card p-5 shadow-resting ring-1 ring-foreground/10 ${span ?? ""}`}
    >
      <h3 className="text-sm font-medium">{title}</h3>
      <div
        aria-hidden
        className="flex flex-1 items-center justify-center py-4 text-muted-foreground"
      >
        {children}
      </div>
      <p className="mx-auto max-w-xs text-center text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export function TrendChart({
  points,
}: {
  points: { score: number; date: string }[];
}) {
  const values = points.map((p) => p.score);
  const latest = values[values.length - 1];

  // Y domain: data min/max snapped outward to tens, so ticks are round numbers.
  let lo = Math.floor(Math.min(...values) / 10) * 10;
  let hi = Math.ceil(Math.max(...values) / 10) * 10;
  if (lo === hi) {
    lo = Math.max(0, lo - 10);
    hi = Math.min(100, hi + 10);
  }
  const ticks = [hi, Math.round((hi + lo) / 2), lo];

  // X positions follow actual time, so gaps between sessions stay honest.
  const times = points.map((p) => new Date(p.date).getTime());
  const t0 = Math.min(...times);
  const span = Math.max(...times) - t0;

  const W = 260;
  const H = 100;
  const PX = 4;
  const PY = 2;
  const yFor = (v: number) => PY + (1 - (v - lo) / (hi - lo)) * (H - 2 * PY);
  const coords = points.map((p, i) => {
    const fx =
      span === 0 ? i / Math.max(points.length - 1, 1) : (times[i] - t0) / span;
    return [PX + fx * (W - 2 * PX), yFor(p.score)] as const;
  });
  const polyline = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const [lastX, lastY] = coords[coords.length - 1];

  return (
    <div className="flex items-center gap-6">
      <div className="flex min-w-0 flex-1 gap-2">
        <div className="flex h-40 flex-col justify-between text-right text-xs leading-none tabular-nums text-muted-foreground">
          {ticks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative h-40">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="size-full"
              preserveAspectRatio="none"
              role="img"
              aria-label={`Overall scores across ${values.length} interviews between ${formatTileDate(points[0].date)} and ${formatTileDate(points[points.length - 1].date)}, from ${Math.round(values[0])} to ${Math.round(latest)}`}
            >
              <defs>
                <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--badge-accent)"
                    stopOpacity="0.25"
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--badge-accent)"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>
              {ticks.map((tick) => (
                <line
                  key={tick}
                  x1={PX}
                  x2={W - PX}
                  y1={yFor(tick)}
                  y2={yFor(tick)}
                  vectorEffect="non-scaling-stroke"
                  strokeWidth="1"
                  className="stroke-foreground/10"
                />
              ))}
              <polygon
                points={`${polyline} ${lastX},${yFor(lo)} ${coords[0][0]},${yFor(lo)}`}
                fill="url(#trend-fill)"
                stroke="none"
              />
              <polyline
                points={polyline}
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className="stroke-badge-accent"
              />
            </svg>
            <div
              aria-hidden
              className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-badge-accent"
              style={{
                left: `${(lastX / W) * 100}%`,
                top: `${(lastY / H) * 100}%`,
              }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
            <span>{formatTileDate(points[0].date)}</span>
            <span>{formatTileDate(points[points.length - 1].date)}</span>
          </div>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-2xl font-medium tabular-nums">{Math.round(latest)}</p>
        <p className="text-sm text-muted-foreground">latest score</p>
      </div>
    </div>
  );
}

/**
 * Compact score sparkline for project tiles: shape only, no axes — the
 * adjacent number carries the value, the line carries the direction.
 */
export function Sparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null;

  const W = 96;
  const H = 28;
  const P = 3;
  let lo = Math.min(...scores);
  let hi = Math.max(...scores);
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const coords = scores.map((s, i) => {
    const x = P + (i / (scores.length - 1)) * (W - 2 * P);
    const y = P + (1 - (s - lo) / (hi - lo)) * (H - 2 * P);
    return [x, y] as const;
  });
  const [lastX, lastY] = coords[coords.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-7 w-24"
      role="img"
      aria-label={`Score trend across ${scores.length} interviews, from ${Math.round(scores[0])} to ${Math.round(scores[scores.length - 1])}`}
    >
      <polyline
        points={coords.map(([x, y]) => `${x},${y}`).join(" ")}
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="stroke-badge-accent"
      />
      <circle cx={lastX} cy={lastY} r="2.5" className="fill-badge-accent" />
    </svg>
  );
}

/* -------------------------------------------------------- illustrations -- */
/* Monochrome line art, stroke = currentColor (set on the EmptyTile wrapper). */

export function TrendIllustration() {
  return (
    <svg viewBox="0 0 96 64" className="h-20 w-auto" fill="none">
      <path
        d="M12 8 V50 H88"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        d="M18 42 L33 30 L47 36 L63 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M63 20 L80 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="1 5"
        opacity="0.6"
      />
      <circle cx="33" cy="30" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="47" cy="36" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="63" cy="20" r="3" fill="currentColor" />
    </svg>
  );
}

export function ContinueIllustration() {
  return (
    <svg viewBox="0 0 96 64" className="h-20 w-auto" fill="none">
      <circle cx="48" cy="24" r="15" stroke="currentColor" strokeWidth="2" />
      <path d="M44 18.5 L54 24 L44 29.5 Z" fill="currentColor" />
      <path
        d="M20 50 H76"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.25"
      />
      <path d="M20 50 H52" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="52" cy="50" r="4" fill="currentColor" />
    </svg>
  );
}

export function PracticeIllustration() {
  return (
    <svg viewBox="0 0 96 64" className="h-20 w-auto" fill="none">
      <path
        d="M16 14 h38 a6 6 0 0 1 6 6 v10 a6 6 0 0 1 -6 6 h-24 l-8 8 v-8 h-6 a6 6 0 0 1 -6 -6 v-10 a6 6 0 0 1 6 -6 Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="27" cy="25" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="35" cy="25" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="43" cy="25" r="2" fill="currentColor" opacity="0.5" />
      <path
        d="M56 34 h20 a5 5 0 0 1 5 5 v6 a5 5 0 0 1 -5 5 h-4 v6 l-7 -6 h-9 a5 5 0 0 1 -5 -5 v-6 a5 5 0 0 1 5 -5 Z"
        fill="currentColor"
        opacity="0.15"
      />
    </svg>
  );
}

export function ScoresIllustration() {
  return (
    <svg viewBox="0 0 96 64" className="h-20 w-auto" fill="none">
      <path
        d="M22 48 A26 26 0 0 1 74 48"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />
      <path
        d="M22 48 A26 26 0 0 1 60 25"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M48 48 L61 31"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="48" cy="48" r="3.5" fill="currentColor" />
      <path
        d="M79 14 v8 M75 18 h8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

export function ClockIllustration() {
  return (
    <svg viewBox="0 0 96 64" className="h-20 w-auto" fill="none">
      <circle cx="48" cy="32" r="18" stroke="currentColor" strokeWidth="2" />
      <path
        d="M48 22 V32 L56 37"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M48 11 v-4 M69 32 h4 M48 53 v4 M27 32 h-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

export function AnswerLengthIllustration() {
  return (
    <svg viewBox="0 0 96 64" className="h-20 w-auto" fill="none">
      <path
        d="M18 16 v32"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.3"
      />
      <path d="M28 20 H78" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M28 32 H64"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M28 44 H48"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

export function CadenceIllustration() {
  return (
    <svg viewBox="0 0 96 64" className="h-20 w-auto" fill="none">
      <path
        d="M14 52 H82"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
      />
      <rect x="21" y="36" width="7" height="16" rx="3" fill="currentColor" opacity="0.3" />
      <rect x="34" y="28" width="7" height="24" rx="3" fill="currentColor" opacity="0.4" />
      <rect x="47" y="38" width="7" height="14" rx="3" fill="currentColor" opacity="0.3" />
      <rect x="60" y="22" width="7" height="30" rx="3" fill="currentColor" opacity="0.5" />
      <rect x="73" y="14" width="7" height="38" rx="3" fill="currentColor" />
    </svg>
  );
}
