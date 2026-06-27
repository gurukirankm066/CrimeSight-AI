import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import cytoscape from "cytoscape";

function SuspectNetwork() {
    const navigate = useNavigate();
    const cyRef = useRef(null);
    const cyInstance = useRef(null);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedNode, setSelectedNode] = useState(null);
    const [recordCount, setRecordCount] = useState(0);

    const handleSearch = async () => {
        if (!search.trim()) return;
        setLoading(true);
        setError("");
        setSelectedNode(null);

        try {
            const res = await fetch(
                `/server/crime_sight_ai_function3/?accused=${encodeURIComponent(search.trim())}`
            );
            const data = await res.json();

            if (data.error) { setError(data.error); setLoading(false); return; }

            const records = data.suspectRecords || [];
            if (records.length === 0) { setError("No records found for this name."); setLoading(false); return; }

            setRecordCount(records.length);
            buildGraph(records, search.trim());
        } catch (err) {
            setError("Failed to fetch data.");
        }
        setLoading(false);
    };

    const buildGraph = (records, accusedName) => {
        const elements = [];

        elements.push({
            data: { id: accusedName, label: accusedName, type: "accused" }
        });

        records.forEach((r, i) => {
            const firId = `fir-${i}`;
            elements.push({
                data: {
                    id: firId, label: r.FIR_Number, type: "fir",
                    district: r.District, crime_type: r.Crime_Type,
                    date: r.Crime_Date, status: r.Case_Status,
                }
            });
            elements.push({ data: { source: accusedName, target: firId } });
        });

        if (cyInstance.current) cyInstance.current.destroy();

        cyInstance.current = cytoscape({
            container: cyRef.current,
            elements,
            style: [
                {
                    selector: "node[type='accused']",
                    style: {
                        "background-color": "#e94560",
                        "border-color": "#ff6b81",
                        "border-width": 4,
                        "label": "data(label)",
                        "color": "#ffffff",
                        "font-size": "13px",
                        "font-weight": "bold",
                        "text-valign": "center",
                        "text-halign": "center",
                        "width": 80,
                        "height": 80,
                        "text-wrap": "wrap",
                        "text-max-width": "70px",
                        "text-outline-color": "#e94560",
                        "text-outline-width": 2,
                    }
                },
                {
                    selector: "node[type='fir']",
                    style: {
                        "background-color": "#0d2137",
                        "border-color": "#1a6fdb",
                        "border-width": 2,
                        "label": "data(label)",
                        "color": "#7eb8f7",
                        "font-size": "8px",
                        "text-valign": "bottom",
                        "text-margin-y": 4,
                        "text-halign": "center",
                        "width": 40,
                        "height": 40,
                    }
                },
                {
                    selector: "node[type='fir']:selected",
                    style: {
                        "background-color": "#1a6fdb",
                        "border-color": "#ffffff",
                        "border-width": 3,
                    }
                },
                {
                    selector: "edge",
                    style: {
                        "width": 1,
                        "line-color": "#1a3a5c",
                        "opacity": 0.8,
                        "curve-style": "straight",
                    }
                },
                {
                    selector: "edge:selected",
                    style: {
                        "line-color": "#1a6fdb",
                        "width": 2,
                    }
                }
            ],
            layout: {
                name: "cose",
                animate: true,
                animationDuration: 600,
                nodeRepulsion: 8000,
                idealEdgeLength: 120,
                gravity: 0.4,
                padding: 60,
            }
        });

        cyInstance.current.on("tap", "node[type='fir']", (evt) => {
            setSelectedNode(evt.target.data());
        });

        cyInstance.current.on("tap", (evt) => {
            if (evt.target === cyInstance.current) setSelectedNode(null);
        });
    };

    const statusColor = (status) => {
        if (status === "Under Investigation") return "#e94560";
        if (status === "Chargesheet Filed") return "orange";
        if (status === "Convicted") return "#4caf50";
        if (status === "Acquitted") return "#aaa";
        return "#7eb8f7";
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#060d1a", color: "white" }}>

            {/* Header */}
            <div style={{
                background: "#0a1628",
                borderBottom: "1px solid #1a3a5c",
                padding: "12px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "22px" }}>🚨</span>
                    <div>
                        <div style={{ color: "white", fontWeight: "bold", fontSize: "17px", letterSpacing: "0.5px" }}>CrimeSight AI</div>
                        <div style={{ color: "#4a7fa5", fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase" }}>Suspect Intelligence Network</div>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    {recordCount > 0 && (
                        <div style={{ fontSize: "12px", color: "#4a7fa5" }}>
                            <span style={{ color: "#e94560", fontWeight: "bold", fontSize: "16px" }}>{recordCount}</span> FIRs linked
                        </div>
                    )}
                    <button onClick={() => navigate("/")} style={{
                        background: "transparent", color: "#7eb8f7", border: "1px solid #1a3a5c",
                        padding: "7px 14px", borderRadius: "4px", cursor: "pointer", fontSize: "12px",
                    }}>
                        ← Dashboard
                    </button>
                </div>
            </div>

            {/* Search */}
            <div style={{ padding: "14px 24px", background: "#0a1628", borderBottom: "1px solid #1a3a5c", display: "flex", gap: "10px" }}>
                <div style={{ position: "relative", flex: 1 }}>
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#4a7fa5", fontSize: "14px" }}>🔍</span>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSearch()}
                        placeholder="Enter accused name — e.g. Praveen Nayak"
                        style={{
                            width: "100%", background: "#060d1a", color: "white",
                            border: "1px solid #1a3a5c", padding: "10px 14px 10px 36px",
                            borderRadius: "4px", fontSize: "13px", boxSizing: "border-box",
                            outline: "none",
                        }}
                    />
                </div>
                <button onClick={handleSearch} disabled={loading} style={{
                    background: loading ? "#1a3a5c" : "#1a6fdb", color: "white", border: "none",
                    padding: "10px 24px", borderRadius: "4px", cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "13px", fontWeight: "bold", letterSpacing: "0.5px",
                }}>
                    {loading ? "SEARCHING..." : "SEARCH"}
                </button>
            </div>

            {error && (
                <div style={{ padding: "10px 24px", background: "#1a0a0e", borderBottom: "1px solid #e94560", color: "#e94560", fontSize: "12px" }}>
                    ⚠ {error}
                </div>
            )}

            {/* Body */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

                {/* Graph */}
                <div ref={cyRef} style={{ flex: 1, background: "#060d1a" }} />

                {/* Detail Panel */}
                {selectedNode && (
                    <div style={{
                        width: "280px", background: "#0a1628", padding: "20px",
                        overflowY: "auto", borderLeft: "1px solid #1a3a5c", flexShrink: 0,
                    }}>
                        <div style={{ fontSize: "10px", color: "#4a7fa5", letterSpacing: "2px", marginBottom: "16px", textTransform: "uppercase" }}>FIR Details</div>
                        <div style={{ fontWeight: "bold", fontSize: "14px", color: "#7eb8f7", marginBottom: "16px", wordBreak: "break-all" }}>
                            {selectedNode.label}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {[
                                { label: "District", value: selectedNode.district },
                                { label: "Crime Type", value: selectedNode.crime_type },
                                { label: "Date", value: selectedNode.date },
                            ].map(({ label, value }) => (
                                <div key={label} style={{ borderBottom: "1px solid #1a3a5c", paddingBottom: "10px" }}>
                                    <div style={{ fontSize: "10px", color: "#4a7fa5", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>{label}</div>
                                    <div style={{ fontSize: "13px", color: "white" }}>{value}</div>
                                </div>
                            ))}
                            <div>
                                <div style={{ fontSize: "10px", color: "#4a7fa5", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>Case Status</div>
                                <div style={{
                                    display: "inline-block", padding: "4px 10px", borderRadius: "12px",
                                    fontSize: "11px", fontWeight: "bold",
                                    background: statusColor(selectedNode.status) + "22",
                                    color: statusColor(selectedNode.status),
                                    border: `1px solid ${statusColor(selectedNode.status)}44`,
                                }}>
                                    {selectedNode.status}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {recordCount === 0 && !loading && (
                    <div style={{
                        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                        textAlign: "center", color: "#1a3a5c", pointerEvents: "none",
                    }}>
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🕸️</div>
                        <div style={{ fontSize: "14px", letterSpacing: "2px", textTransform: "uppercase" }}>Search an accused name to build the network</div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SuspectNetwork;