import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function CaseTracker() {
    const [trackerData, setTrackerData] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        fetch("/server/crime_sight_ai_function3/")
            .then(r => r.json())
            .then(data => {
                setTrackerData(data.caseTracker || {});
            })
            .catch(err => console.error("FETCH ERROR:", err));
    }, []);

    const sorted = Object.entries(trackerData).sort((a, b) => b[1].total - a[1].total);

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#1a1a2e", color: "white" }}>

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
                        <div style={{ color: "#aaa", fontSize: "11px" }}>Karnataka State Police — Case Status Tracker</div>
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

            {/* Table */}
            <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
                <h3 style={{ color: "#e94560", marginBottom: "16px" }}>📋 District Case Status Tracker</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                        <tr style={{ background: "#16213e", color: "#e94560" }}>
                            <th style={th}>#</th>
                            <th style={th}>District</th>
                            <th style={th}>Total</th>
                            <th style={th}>Under Investigation</th>
                            <th style={th}>Chargesheet Filed</th>
                            <th style={th}>Convicted</th>
                            <th style={th}>Acquitted</th>
                            <th style={th}>Closed</th>
                            <th style={th}>Avg Days to Resolve</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map(([district, d], i) => (
                            <tr key={district} style={{ background: i % 2 === 0 ? "#1a1a2e" : "#16213e" }}>
                                <td style={td}>{i + 1}</td>
                                <td style={{ ...td, fontWeight: "bold" }}>{district}</td>
                                <td style={td}>{d.total.toLocaleString()}</td>
                                <td style={{ ...td, color: "#e94560" }}>{d.under_investigation.toLocaleString()}</td>
                                <td style={{ ...td, color: "orange" }}>{d.chargesheet.toLocaleString()}</td>
                                <td style={{ ...td, color: "#4caf50" }}>{d.convicted.toLocaleString()}</td>
                                <td style={{ ...td, color: "#aaa" }}>{d.acquitted.toLocaleString()}</td>
                                <td style={{ ...td, color: "#4caf50" }}>{d.closed.toLocaleString()}</td>
                                <td style={td}>{d.avg_days} days</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const th = {
    padding: "12px 16px",
    textAlign: "left",
    borderBottom: "1px solid #0f3460",
};

const td = {
    padding: "10px 16px",
    borderBottom: "1px solid #0f3460",
};

export default CaseTracker;