import { useState } from "react";
type Props = {
    districtSummary: Record<string, number>;
    crimeTypes: Record<string, Record<string, number>>;
    onDistrictClick?: (district: string) => void;
};

const districtPositions: Record<string, [number, number]> = {
    "Bengaluru Urban": [620, 520],
    "Bengaluru Rural": [590, 480],
    "Mysuru": [560, 580],
    "Mandya": [560, 540],
    "Chamarajanagar": [540, 620],
    "Kodagu": [490, 590],
    "Hassan": [490, 510],
    "Chikkamagaluru": [470, 460],
    "Tumakuru": [570, 440],
    "Ramanagara": [600, 500],
    "Kolar": [660, 480],
    "Chikkaballapura": [650, 440],
    "Shivamogga": [450, 400],
    "Davanagere": [490, 360],
    "Chitradurga": [520, 340],
    "Ballari": [580, 300],
    "Vijayanagara": [550, 280],
    "Raichur": [600, 240],
    "Koppal": [560, 220],
    "Gadag": [430, 260],
    "Dharwad": [400, 220],
    "Haveri": [420, 300],
    "Belagavi": [380, 160],
    "Bagalkote": [440, 200],
    "Vijayapura": [500, 180],
    "Bidar": [600, 140],
    "Kalaburagi": [640, 200],
    "Yadgir": [640, 260],
    "Uttara Kannada": [370, 340],
    "Dakshina Kannada": [390, 560],
    "Udupi": [360, 490],
};

export function KarnatakaMap({ districtSummary, crimeTypes, onDistrictClick }: Props) {
    const [tooltip, setTooltip] = useState<{
        district: string;
        x: number;
        y: number;
        count: number;
    } | null>(null);

    const maxCount = Math.max(...Object.values(districtSummary), 1);

    return (
        <div className="relative w-full h-full bg-[#060e20] overflow-hidden">
            {/* Grid lines */}
            <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="none">
                <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1a3a5c" strokeWidth="0.5" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Karnataka outline label */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 text-[10px] font-bold text-outline/40 uppercase tracking-[0.3em] z-10">
                Karnataka State · 31 Districts
            </div>

            {/* Map SVG */}
            <svg
                viewBox="0 0 800 750"
                className="absolute inset-0 w-full h-full"
                style={{ marginTop: "36px" }}
            >
                {/* Connection lines between districts */}
                {Object.entries(districtPositions).map(([d, [x, y]]) => {
                    const count = districtSummary[d] || 0;
                    if (count < 3000) return null;
                    return (
                        <circle
                            key={`ring-${d}`}
                            cx={x}
                            cy={y}
                            r={30}
                            fill="none"
                            stroke="#e94560"
                            strokeWidth="0.5"
                            opacity="0.15"
                        />
                    );
                })}

                {/* District markers */}
                {Object.entries(districtPositions).map(([district, [x, y]]) => {
                    const count = districtSummary[district] || 0;
                    const color = count > 5000 ? "#e94560" : count > 2000 ? "#f97316" : "#22c55e";
                    const size = count > 5000 ? 12 : count > 2000 ? 9 : 6;
                    const glowId = `glow-${district.replace(/\s+/g, "")}`;

                    return (
                        <g
                            key={district}
                            onClick={() => onDistrictClick?.(district)}
                            onMouseEnter={() => setTooltip({ district, x, y, count })}
                            onMouseLeave={() => setTooltip(null)}
                            style={{ cursor: "pointer" }}
                        >
                            <defs>
                                <filter id={glowId}>
                                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Outer pulse ring */}
                            <circle
                                cx={x}
                                cy={y}
                                r={size + 6}
                                fill="none"
                                stroke={color}
                                strokeWidth="1"
                                opacity="0.3"
                            />

                            {/* Main dot */}
                            <circle
                                cx={x}
                                cy={y}
                                r={size}
                                fill={color}
                                opacity="0.9"
                                filter={`url(#${glowId})`}
                            />

                            {/* Inner bright dot */}
                            <circle
                                cx={x}
                                cy={y}
                                r={size * 0.4}
                                fill="white"
                                opacity="0.6"
                            />

                            {/* District label */}
                            <text
                                x={x}
                                y={y + size + 14}
                                textAnchor="middle"
                                fontSize="9"
                                fill="#7eb8f7"
                                opacity="0.8"
                                fontFamily="monospace"
                            >
                                {district.length > 12 ? district.slice(0, 10) + ".." : district}
                            </text>

                            {/* FIR count */}
                            {count > 0 && (
                                <text
                                    x={x}
                                    y={y + size + 24}
                                    textAnchor="middle"
                                    fontSize="8"
                                    fill={color}
                                    opacity="0.7"
                                    fontFamily="monospace"
                                >
                                    {count.toLocaleString()}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Tooltip */}
            {tooltip && (
                <div
                    className="absolute z-50 pointer-events-none"
                    style={{
                        left: `${(tooltip.x / 800) * 100}%`,
                        top: `${(tooltip.y / 750) * 100}%`,
                        transform: "translate(-50%, -120%)",
                    }}
                >
                    <div className="bg-[#0a1628] border border-primary/30 rounded-xl p-3 shadow-2xl min-w-[160px]">
                        <div className="text-[12px] font-bold text-white mb-1">{tooltip.district}</div>
                        <div className="text-[11px] text-primary font-mono">{tooltip.count.toLocaleString()} FIRs</div>
                        <div className="text-[10px] text-outline mt-1">
                            {tooltip.count > 5000 ? "🔴 HIGH RISK" : tooltip.count > 2000 ? "🟠 MEDIUM RISK" : "🟢 LOW RISK"}
                        </div>
                        {crimeTypes[tooltip.district] && (
                            <div className="mt-2 pt-2 border-t border-white/10">
                                {Object.entries(crimeTypes[tooltip.district])
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 2)
                                    .map(([type, count]) => (
                                        <div key={type} className="text-[10px] text-on-surface-variant flex justify-between">
                                            <span>{type}</span>
                                            <span className="font-mono">{count}</span>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 z-20">
                {[
                    { color: "#e94560", label: "High Risk >5000" },
                    { color: "#f97316", label: "Medium 2000-5000" },
                    { color: "#22c55e", label: "Low Risk <2000" },
                ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-[9px] text-outline font-mono uppercase tracking-wider">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}