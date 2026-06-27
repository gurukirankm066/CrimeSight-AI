import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const districtCoords = {
  "Bengaluru Rural": [13.2841, 77.6078],
  "Bengaluru Urban": [12.9716, 77.5946],
  "Dakshina Kannada": [12.9141, 74.856],
  Dharwad: [15.4589, 75.0078],
  Shivamogga: [13.9299, 75.5681],
  Belagavi: [15.8497, 74.4977],
  Mysuru: [12.2958, 76.6394],
  Ballari: [15.1394, 76.9214],
  Kalaburagi: [17.3297, 76.8343],
  Vijayapura: [16.8302, 75.71],
  Davanagere: [14.4661, 75.9238],
  Udupi: [13.3409, 74.7421],
  Tumakuru: [13.3409, 77.1007],
  Raichur: [16.212, 77.3566],
  Bagalkote: [16.1691, 75.6966],
  Bidar: [17.9104, 77.5199],
  Mandya: [12.5218, 76.8951],
  Chikkaballapura: [13.4355, 77.7315],
  Yadgir: [16.7727, 77.1385],
  Koppal: [15.3508, 76.1549],
  Chitradurga: [14.2251, 76.398],
  "Uttara Kannada": [14.7937, 74.6937],
  Kolar: [13.1368, 78.1292],
  Gadag: [15.4166, 75.6281],
  Chikkamagaluru: [13.3161, 75.772],
  Hassan: [13.0033, 76.0998],
  Vijayanagara: [15.1433, 76.9214],
  Ramanagara: [12.7157, 77.2819],
  Haveri: [14.7939, 75.3996],
  Chamarajanagar: [11.9261, 76.9437],
  Kodagu: [12.3375, 75.8069],
};

function App() {
  const [districtSummary, setDistrictSummary] = useState({});
  const [crimeTypes, setCrimeTypes] = useState({});
  const [yearSummary, setYearSummary] = useState({});
  const [selectedCrimeType, setSelectedCrimeType] = useState("All");
  const [morningBrief, setMorningBrief] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/server/crime_sight_ai_function3/")
      .then(r => r.json())
      .then(data => {
        setDistrictSummary(data.districtSummary);
        setCrimeTypes(data.crimeTypes);
        setYearSummary(data.yearSummary);
        setMorningBrief(data.morningBrief);
      })
      .catch(err => console.error("FETCH ERROR:", err));
  }, []);

  const allCrimeTypes = ["All", ...new Set(
    Object.values(crimeTypes).flatMap(types => Object.keys(types))
  ).values()].sort();

  const validEntries = Object.entries(districtSummary)
    .filter(([district]) => district !== "d")
    .map(([district, count]) => {
      if (selectedCrimeType === "All") return [district, count];
      const filtered = crimeTypes[district]?.[selectedCrimeType] || 0;
      return [district, filtered];
    });

  const top5 = [...validEntries].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const totalCrimes = validEntries.reduce((sum, [, count]) => sum + count, 0);
  const mostDangerous = top5[0]?.[0] || "-";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100%", background: "#1a1a2e" }}>

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
        {/* Hotspot Alert Banner */}
        {top5[0] && top5[0][1] > 10000 && (
          <div style={{
            background: "#e94560",
            color: "white",
            padding: "10px 24px",
            fontSize: "13px",
            fontWeight: "bold",
            textAlign: "center",
            flexShrink: 0,
            animation: "pulse 1.5s infinite",
          }}>
            🚨 HOTSPOT ALERT — {top5[0][0]} has crossed {top5[0][1].toLocaleString()} crimes. Immediate attention required.
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "24px" }}>🚨</span>
          <div>
            <div style={{ color: "white", fontWeight: "bold", fontSize: "18px" }}>CrimeSight AI</div>
            <div style={{ color: "#aaa", fontSize: "11px" }}>Karnataka State Police — Crime Intelligence Dashboard</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "30px", alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#e94560", fontWeight: "bold", fontSize: "18px" }}>{totalCrimes.toLocaleString()}</div>
            <div style={{ color: "#aaa", fontSize: "11px" }}>Total Crimes</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#e94560", fontWeight: "bold", fontSize: "18px" }}>{validEntries.length}</div>
            <div style={{ color: "#aaa", fontSize: "11px" }}>Districts</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#e94560", fontWeight: "bold", fontSize: "14px" }}>{mostDangerous}</div>
            <div style={{ color: "#aaa", fontSize: "11px" }}>Highest Crime District</div>
          </div>
          <button
            onClick={() => navigate("/case-tracker")}
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
            📋 Case Tracker
          </button>
          <button
            onClick={() => navigate("/suspect-network")}
            style={{
              background: "#0f3460",
              color: "white",
              border: "1px solid #e94560",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            🕸️ Suspect Network
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Sidebar */}
        <div style={{
          width: "260px",
          background: "#1a1a2e",
          color: "white",
          padding: "20px",
          zIndex: 1000,
          overflowY: "auto",
          flexShrink: 0,
        }}>

          {/* AI Morning Brief */}
          {morningBrief && (
            <div style={{ marginBottom: "20px", background: "#16213e", border: "1px solid #e94560", borderRadius: "6px", padding: "14px" }}>
              <div style={{ color: "#e94560", fontWeight: "bold", fontSize: "12px", marginBottom: "10px", letterSpacing: "1px" }}>🤖 AI MORNING BRIEF</div>
              {morningBrief.split("\n").filter(l => l.trim()).map((line, i) => (
                <div key={i} style={{ fontSize: "11px", color: "#ddd", lineHeight: "1.6", marginBottom: "6px" }}>{line}</div>
              ))}
            </div>
          )}

          {/* Filter */}
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ color: "#e94560", marginBottom: "8px" }}>🔍 Filter by Crime Type</h4>
            <select
              value={selectedCrimeType}
              onChange={e => setSelectedCrimeType(e.target.value)}
              style={{
                width: "100%",
                background: "#16213e",
                color: "white",
                border: "1px solid #e94560",
                padding: "8px",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              {allCrimeTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Top 5 */}
          <h4 style={{ color: "#e94560", marginBottom: "12px" }}>⚠️ Top 5 High Crime Districts</h4>
          {top5.map(([district, count], index) => (
            <div key={district} style={{
              background: "#16213e",
              borderLeft: "4px solid #e94560",
              padding: "10px 12px",
              marginBottom: "10px",
              borderRadius: "4px",
            }}>
              <div style={{ fontSize: "12px", color: "#aaa" }}>#{index + 1}</div>
              <div style={{ fontWeight: "bold", fontSize: "14px" }}>{district}</div>
              <div style={{ color: "#e94560", fontSize: "13px" }}>{count.toLocaleString()} crimes</div>
            </div>
          ))}

          {/* Legend */}
          <div style={{ marginTop: "30px", fontSize: "12px", color: "#aaa", lineHeight: "2" }}>
            <div>🔴 High Risk: &gt;5000</div>
            <div>🟠 Medium Risk: 2000–5000</div>
            <div>🟢 Low Risk: &lt;2000</div>
          </div>

          {/* Year Chart */}
          <div style={{ marginTop: "30px" }}>
            <h4 style={{ color: "#e94560", marginBottom: "12px" }}>📅 Crimes by Year</h4>
            {Object.entries(yearSummary).sort().map(([year, count]) => {
              const max = Math.max(...Object.values(yearSummary));
              const pct = (count / max) * 100;
              return (
                <div key={year} style={{ marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#aaa", marginBottom: "3px" }}>
                    <span>{year}</span>
                    <span>{count.toLocaleString()}</span>
                  </div>
                  <div style={{ background: "#0f3460", borderRadius: "3px", height: "8px" }}>
                    <div style={{
                      background: "#e94560",
                      width: `${pct}%`,
                      height: "8px",
                      borderRadius: "3px"
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Map */}
        <div style={{ flex: 1 }}>
          <MapContainer
            center={[15.3173, 75.7139]}
            zoom={7}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {validEntries.map(([district, count]) => {
              const coords = districtCoords[district];
              if (!coords) return null;

              const color =
                count > 5000 ? "red" : count > 2000 ? "orange" : "green";

              const icon = new L.DivIcon({
                className: "",
                html: `<div style="
                  background-color: ${color};
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  border: 2px solid white;
                  box-shadow: 0 0 6px rgba(0,0,0,0.5);
                "></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              });

              const topCrimes = crimeTypes[district]
                ? Object.entries(crimeTypes[district])
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                : [];

              return (
                <Marker key={district} position={coords} icon={icon} eventHandlers={{ click: () => navigate(`/district/${encodeURIComponent(district)}`) }}>
                  <Popup>
                    <div style={{ minWidth: "180px" }}>
                      <h3 style={{ margin: "0 0 6px 0" }}>{district}</h3>
                      <p style={{ margin: "4px 0" }}>
                        <strong>Total Crimes:</strong> {count.toLocaleString()}
                      </p>
                      <p style={{ margin: "4px 0" }}>
                        <strong>Risk Level:</strong>{" "}
                        {color === "red" ? "🔴 High" : color === "orange" ? "🟠 Medium" : "🟢 Low"}
                      </p>
                      {topCrimes.length > 0 && (
                        <>
                          <p style={{ margin: "8px 0 4px 0" }}><strong>Top Crime Types:</strong></p>
                          <ul style={{ margin: 0, paddingLeft: "16px" }}>
                            {topCrimes.map(([type, c]) => (
                              <li key={type} style={{ fontSize: "12px" }}>
                                {type}: <strong>{c}</strong>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default App;