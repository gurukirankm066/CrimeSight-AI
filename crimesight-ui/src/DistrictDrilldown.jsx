import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function DistrictDrilldown() {
    const { name } = useParams();
    const navigate = useNavigate();
    const district = decodeURIComponent(name);

    const [data, setData] = useState(null);

    useEffect(() => {
        fetch("/server/crime_sight_ai_function3/")
            .then(r => r.json())
            .then(result => {
                const crimeTypes = result.crimeTypes?.[district] || {};
                const totalCrimes = result.districtSummary?.[district] || 0;
                setData({ crimeTypes, totalCrimes });
            })
            .catch(err => console.error(err));
    }, [district]);

    if (!data) return (
        <div style={{ height: "100vh", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
            Loading...
        </div>
    );

    const crimeEntries = Object.entries(data.crimeTypes).sort((a, b) => b[1] - a[1]);
    const max = crimeEntries[0]?.[1] || 1;

    const riskLevel = data.totalCrimes > 5000 ? "🔴 High" : data.totalCrimes > 2000 ? "🟠 Medium" : "🟢 Low";

    return (
        <div style={{ height: "100vh", width: "100%", background: "#1a1a2e", display: "flex", flexDirection: "column" }}>

            {/* Header */}
            <div style={{
                background: "#16213e",
                borderBottom: "2px solid #e94560",
                padding: "12px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "24px" }}>🚨</span>
                    <div>
                        <div style={{ color: "white", fontWeight: "bold", fontSize: "18px" }}>CrimeSight AI</div>
                        <div style={{ color: "#aaa", fontSize: "11px" }}>District Intelligence — {district}</div>
                    </div>
                </div>
                <button
                    onClick={() => navigate("/")}
                    style={{
                        background: "#e94560",
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "13px",
                    }}
                >
                    ← Back to Map
                </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>

                {/* District Summary Cards */}
                <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
                    <div style={{
                        background: "#16213e",
                        border: "1px solid #e94560",
                        borderRadius: "8px",
                        padding: "20px 28px",
                        textAlign: "center",
                        flex: 1,
                    }}>
                        <div style={{ color: "#e94560", fontSize: "28px", fontWeight: "bold" }}>{data.totalCrimes.toLocaleString()}</div>
                        <div style={{ color: "#aaa", fontSize: "12px", marginTop: "4px" }}>Total Crimes</div>
                    </div>
                    <div style={{
                        background: "#16213e",
                        border: "1px solid #e94560",
                        borderRadius: "8px",
                        padding: "20px 28px",
                        textAlign: "center",
                        flex: 1,
                    }}>
                        <div style={{ color: "#e94560", fontSize: "28px", fontWeight: "bold" }}>{crimeEntries.length}</div>
                        <div style={{ color: "#aaa", fontSize: "12px", marginTop: "4px" }}>Crime Types</div>
                    </div>
                    <div style={{
                        background: "#16213e",
                        border: "1px solid #e94560",
                        borderRadius: "8px",
                        padding: "20px 28px",
                        textAlign: "center",
                        flex: 1,
                    }}>
                        <div style={{ color: "#e94560", fontSize: "22px", fontWeight: "bold" }}>{riskLevel}</div>
                        <div style={{ color: "#aaa", fontSize: "12px", marginTop: "4px" }}>Risk Level</div>
                    </div>
                    <div style={{
                        background: "#16213e",
                        border: "1px solid #e94560",
                        borderRadius: "8px",
                        padding: "20px 28px",
                        textAlign: "center",
                        flex: 1,
                    }}>
                        <div style={{ color: "#e94560", fontSize: "16px", fontWeight: "bold" }}>{crimeEntries[0]?.[0] || "-"}</div>
                        <div style={{ color: "#aaa", fontSize: "12px", marginTop: "4px" }}>Top Crime Type</div>
                    </div>
                </div>

                {/* Crime Type Breakdown Chart */}
                <div style={{
                    background: "#16213e",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    padding: "24px",
                }}>
                    <h3 style={{ color: "#e94560", marginBottom: "20px", marginTop: 0 }}>📊 Crime Type Breakdown — {district}</h3>
                    {crimeEntries.map(([type, count]) => {
                        const pct = (count / max) * 100;
                        return (
                            <div key={type} style={{ marginBottom: "14px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#ddd", marginBottom: "4px" }}>
                                    <span>{type}</span>
                                    <span style={{ color: "#e94560", fontWeight: "bold" }}>{count.toLocaleString()}</span>
                                </div>
                                <div style={{ background: "#0f3460", borderRadius: "4px", height: "10px" }}>
                                    <div style={{
                                        background: "#e94560",
                                        width: `${pct}%`,
                                        height: "10px",
                                        borderRadius: "4px",
                                        transition: "width 0.3s ease",
                                    }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default DistrictDrilldown;