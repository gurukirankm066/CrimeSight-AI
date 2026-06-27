import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import CaseTracker from "./CaseTracker.jsx";
import SuspectNetwork from "./SuspectNetwork.jsx";
import Login from "./Login.jsx";
import DistrictDrilldown from "./DistrictDrilldown.jsx";
import "./index.css";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css";
import "leaflet-defaulticon-compatibility";

const isLoggedIn = true;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isLoggedIn ? <App /> : <Login />} />
        <Route path="/case-tracker" element={isLoggedIn ? <CaseTracker /> : <Login />} />
        <Route path="/suspect-network" element={isLoggedIn ? <SuspectNetwork /> : <Login />} />
        <Route path="/district/:name" element={<DistrictDrilldown />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);