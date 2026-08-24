const FOREST = "#0B6E4F";

const CITIES = [
  { name: "Casablanca", x: 92, y: 52 },
  { name: "Cairo", x: 248, y: 58 },
  { name: "Dakar", x: 48, y: 138 },
  { name: "Lagos", x: 128, y: 188 },
  { name: "Accra", x: 108, y: 184 },
  { name: "Addis Ababa", x: 258, y: 148 },
  { name: "Nairobi", x: 252, y: 198 },
  { name: "Kigali", x: 232, y: 194 },
  { name: "Johannesburg", x: 198, y: 292 },
  { name: "Cape Town", x: 168, y: 328 },
] as const;

const ROUTES: Array<[number, number]> = [
  [0, 2],
  [2, 4],
  [4, 3],
  [1, 5],
  [5, 6],
  [6, 7],
  [6, 8],
  [8, 9],
  [3, 6],
];

/** Maghreb, Horn of Africa, Gulf of Guinea, Cape, Madagascar. */
const AFRICA_LAND =
  "M96 48C118 28 158 22 198 30C230 36 258 52 264 82C262 112 254 138 268 162C304 174 342 186 356 206C362 226 336 246 308 258C286 276 274 306 280 336C276 366 258 394 228 414C196 434 164 428 148 400C138 368 132 336 146 304C136 278 108 262 80 250C50 236 24 216 18 186C10 154 28 122 46 98C58 72 72 56 96 48Z";

const MADAGASCAR =
  "M318 258C334 264 342 286 336 308C326 324 310 322 304 302C300 282 306 264 318 258Z";

export function AfricaMapBackdrop() {
  return (
    <div
      className="africa-map-backdrop pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <svg
        className="africa-map-svg absolute inset-0 h-full w-full"
        viewBox="0 0 380 440"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="africa-land-fill" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor={FOREST} stopOpacity="0.28" />
            <stop offset="100%" stopColor={FOREST} stopOpacity="0.12" />
          </linearGradient>
          <filter id="africa-glow" x="-12%" y="-12%" width="124%" height="124%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          className="africa-map-fill"
          d={AFRICA_LAND}
          fill="url(#africa-land-fill)"
          filter="url(#africa-glow)"
        />
        <path
          d={MADAGASCAR}
          fill="url(#africa-land-fill)"
          filter="url(#africa-glow)"
        />

        <path
          className="africa-map-outline"
          d={AFRICA_LAND}
          stroke={FOREST}
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        <path
          className="africa-map-outline"
          d={MADAGASCAR}
          stroke={FOREST}
          strokeWidth="2.6"
          strokeLinejoin="round"
        />

        {ROUTES.map(([from, to], index) => {
          const a = CITIES[from];
          const b = CITIES[to];
          return (
            <line
              key={`${a.name}-${b.name}`}
              className="africa-map-route"
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={FOREST}
              strokeWidth="1.4"
              style={{ animationDelay: `${index * 0.35}s` }}
            />
          );
        })}

        {CITIES.map((city, index) => (
          <g key={city.name}>
            <circle
              className="africa-city-ring"
              cx={city.x}
              cy={city.y}
              r="5"
              fill={FOREST}
              style={{ animationDelay: `${index * 0.35}s` }}
            />
            <circle cx={city.x} cy={city.y} r="4.2" fill={FOREST} />
            <circle cx={city.x} cy={city.y} r="1.8" fill="#ffffff" />
          </g>
        ))}
      </svg>
    </div>
  );
}
