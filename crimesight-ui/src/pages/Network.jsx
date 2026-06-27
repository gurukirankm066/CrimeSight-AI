import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { AppHeader } from "@/components/AppHeader";
import { api, type NetworkGraph, type NetworkNode } from "@/services/api";

export const Route = createFileRoute("/network")({
  head: () => ({
    meta: [
      { title: "Network Analysis — CrimeSight AI" },
      { name: "description", content: "Interactive criminal network graph linking suspects, FIRs, vehicles, locations and more." },
    ],
  }),
  component: NetworkPage,
});

const COLORS: Record<string, number> = {
  SUSPECT: 0xef4444,
  FIR: 0x3b82f6,
  VICTIM: 0x22c55e,
  VEHICLE: 0xf59e0b,
  MOBILE: 0xa855f7,
  LOCATION: 0xeab308,
  CCTV: 0x64748b,
  BANK: 0x0ea5e9,
};

const LEGEND = [
  { type: "SUSPECT", label: "Suspect" }, { type: "FIR", label: "FIR" },
  { type: "VICTIM", label: "Victim" }, { type: "VEHICLE", label: "Vehicle" },
  { type: "MOBILE", label: "Mobile" }, { type: "LOCATION", label: "Location" },
  { type: "CCTV", label: "CCTV" }, { type: "BANK", label: "Bank" },
];

function hex(c: number) {
  return "#" + c.toString(16).padStart(6, "0");
}

function NetworkPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [graph, setGraph] = useState<NetworkGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<NetworkNode | null>(null);

  useEffect(() => {
    api.getNetworkGraph().then((res) => {
      setGraph(res.data);
      setError(res.error);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !graph) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 2000);
    camera.position.z = 600;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const nodeMeshes: THREE.Mesh[] = [];
    const linkMeshes: { line: THREE.Line; from: string; to: string }[] = [];
    const particleSystems: { points: THREE.Points; from: THREE.Vector3; to: THREE.Vector3; offsets: number[] }[] = [];

    graph.nodes.forEach((node) => {
      const geometry = new THREE.SphereGeometry(node.size, 32, 32);
      const material = new THREE.MeshPhongMaterial({
        color: COLORS[node.type], emissive: COLORS[node.type],
        emissiveIntensity: 0.6, shininess: 100, transparent: true, opacity: 0.9,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...node.pos);
      mesh.userData = { ...node, baseSize: node.size };
      scene.add(mesh);
      nodeMeshes.push(mesh);

      const canvas = document.createElement("canvas");
      canvas.width = 64; canvas.height = 64;
      const ctx = canvas.getContext("2d")!;
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      const c = COLORS[node.type];
      grad.addColorStop(0, "rgba(255,255,255,0.8)");
      grad.addColorStop(0.2, `rgba(${(c >> 16) & 255}, ${(c >> 8) & 255}, ${c & 255}, 0.5)`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 64, 64);
      const tex = new THREE.CanvasTexture(canvas);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending }));
      sprite.scale.set(node.size * 4, node.size * 4, 1);
      mesh.add(sprite);
    });

    graph.links.forEach((link) => {
      const from = nodeMeshes.find((n) => (n.userData as NetworkNode).id === link.from);
      const to = nodeMeshes.find((n) => (n.userData as NetworkNode).id === link.to);
      if (!from || !to) return;
      const geo = new THREE.BufferGeometry().setFromPoints([from.position, to.position]);
      const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
      const line = new THREE.Line(geo, mat);
      scene.add(line);
      linkMeshes.push({ line, from: link.from, to: link.to });

      const pCount = 5;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(pCount * 3);
      pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
      const pMat = new THREE.PointsMaterial({ color: 0xffffff, size: 3, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
      const particles = new THREE.Points(pGeo, pMat);
      scene.add(particles);
      particleSystems.push({
        points: particles, from: from.position, to: to.position,
        offsets: Array.from({ length: pCount }, () => Math.random()),
      });
    });

    scene.add(new THREE.AmbientLight(0x404040, 1.5));
    const pl = new THREE.PointLight(0xffffff, 1.5);
    pl.position.set(200, 200, 500);
    scene.add(pl);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let selectedMesh: THREE.Mesh | null = null;

    const onMove = (e: MouseEvent) => {
      const r = container.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    };
    const onClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(nodeMeshes);
      if (hits.length > 0) {
        const clicked = hits[0].object as THREE.Mesh;
        selectedMesh = selectedMesh === clicked ? null : clicked;
      } else {
        selectedMesh = null;
      }
      setSelected(selectedMesh ? (selectedMesh.userData as NetworkNode) : null);
      updateState();
    };

    function updateState() {
      if (!selectedMesh) {
        nodeMeshes.forEach((m) => { (m.material as THREE.MeshPhongMaterial).opacity = 0.9; m.scale.set(1, 1, 1); });
        linkMeshes.forEach((l) => ((l.line.material as THREE.LineBasicMaterial).opacity = 0.15));
        return;
      }
      const id = (selectedMesh.userData as NetworkNode).id;
      const connected = new Set<string>([id]);
      graph!.links.forEach((l) => {
        if (l.from === id) connected.add(l.to);
        if (l.to === id) connected.add(l.from);
      });
      nodeMeshes.forEach((m) => {
        const mid = (m.userData as NetworkNode).id;
        const mat = m.material as THREE.MeshPhongMaterial;
        if (connected.has(mid)) {
          mat.opacity = 1;
          const s = m === selectedMesh ? 1.5 : 1.1;
          m.scale.set(s, s, s);
        } else {
          mat.opacity = 0.15;
          m.scale.set(0.85, 0.85, 0.85);
        }
      });
      linkMeshes.forEach((l) => {
        const rel = l.from === id || l.to === id;
        (l.line.material as THREE.LineBasicMaterial).opacity = rel ? 0.7 : 0.04;
      });
    }

    container.addEventListener("mousemove", onMove);
    container.addEventListener("click", onClick);

    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      const t = Date.now() * 0.001;
      nodeMeshes.forEach((m, i) => {
        m.position.y += Math.sin(t + i) * 0.05;
        m.position.x += Math.cos(t + i) * 0.05;
      });
      // Pulse the selected node
      if (selectedMesh) {
        const pulse = 1.5 + Math.sin(t * 4) * 0.18;
        selectedMesh.scale.set(pulse, pulse, pulse);
      }
      particleSystems.forEach((sys) => {
        const arr = (sys.points.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
        sys.offsets.forEach((o, i) => {
          sys.offsets[i] = (o + 0.005) % 1;
          const k = sys.offsets[i];
          arr[i * 3] = sys.from.x + (sys.to.x - sys.from.x) * k;
          arr[i * 3 + 1] = sys.from.y + (sys.to.y - sys.from.y) * k;
          arr[i * 3 + 2] = sys.from.z + (sys.to.z - sys.from.z) * k;
        });
        (sys.points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      });
      linkMeshes.forEach((lo) => {
        const from = nodeMeshes.find((n) => (n.userData as NetworkNode).id === lo.from);
        const to = nodeMeshes.find((n) => (n.userData as NetworkNode).id === lo.to);
        if (!from || !to) return;
        const pos = (lo.line.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
        pos[0] = from.position.x; pos[1] = from.position.y; pos[2] = from.position.z;
        pos[3] = to.position.x; pos[4] = to.position.y; pos[5] = to.position.z;
        (lo.line.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      });
      renderer.render(scene, camera);
    };
    tick();

    const onResize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      container.removeEventListener("mousemove", onMove);
      container.removeEventListener("click", onClick);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
    };
  }, [graph]);

  const selectedLinks = selected && graph ? graph.links.filter((l) => l.from === selected.id || l.to === selected.id) : [];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <AppHeader />
      <main className="flex-1 mt-16 relative bg-[#060e20]">
        <div ref={containerRef} className="absolute inset-0" />

        <div className="absolute top-4 left-6 z-20 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[22px]">hub</span>
          <div>
            <h2 className="text-[15px] font-semibold text-on-surface">Criminal Network Analysis</h2>
            <p className="text-[11px] text-on-surface-variant uppercase tracking-widest">
              {loading ? "Loading graph…" : `Root: ${graph?.root_label} · ${graph?.nodes.length} entities · ${graph?.links.length} links`}
              {error && <span className="ml-2 text-orange-400">offline</span>}
            </p>
          </div>
        </div>

        <div className="absolute top-4 right-6 z-20 glass-card rounded-xl p-4 w-56">
          <h4 className="text-[10px] font-bold text-outline uppercase tracking-widest mb-3">Entity Types</h4>
          <ul className="grid grid-cols-2 gap-2">
            {LEGEND.map((l) => (
              <li key={l.type} className="flex items-center gap-2 text-[11px] text-on-surface-variant">
                <span className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: hex(COLORS[l.type]), boxShadow: `0 0 8px ${hex(COLORS[l.type])}` }} />
                {l.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="absolute bottom-6 left-6 z-20 glass-card rounded-xl p-5 w-[340px] animate-entrance max-h-[80vh] overflow-y-auto">
          {selected ? (
            <>
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/5">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Selected Entity</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{ color: hex(COLORS[selected.type]), backgroundColor: hex(COLORS[selected.type]) + "22" }}>
                  {selected.type}
                </span>
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-1">{selected.name ?? selected.label}</h3>
              <p className="text-[11px] text-outline font-mono mb-4">ID: {selected.id}</p>

              {typeof selected.risk_score === "number" && (
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1.5">
                    <span className="text-outline">Risk Score</span>
                    <span className={selected.risk_score >= 70 ? "text-error" : selected.risk_score >= 40 ? "text-orange-400" : "text-green-400"}>
                      {selected.risk_score}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${selected.risk_score >= 70 ? "bg-error pulse-red" : selected.risk_score >= 40 ? "bg-orange-400" : "bg-green-400"}`}
                      style={{ width: `${selected.risk_score}%` }} />
                  </div>
                </div>
              )}

              <DetailList title="FIRs" icon="article" items={selected.firs} />
              <DetailList title="Known Associates" icon="group" items={selected.associates} />
              <DetailList title="Vehicles" icon="directions_car" items={selected.vehicles} />
              <DetailList title="Mobile Numbers" icon="call" items={selected.mobiles} mono />
              {selected.last_known_location && (
                <div className="mb-3">
                  <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[12px]">location_on</span>
                    Last Known Location
                  </p>
                  <p className="text-[12px] text-on-surface">{selected.last_known_location}</p>
                </div>
              )}

              <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-2 mt-4 pt-3 border-t border-white/5">
                Graph Connections ({selectedLinks.length})
              </p>
              <ul className="space-y-1.5 max-h-32 overflow-y-auto">
                {selectedLinks.map((l, i) => {
                  const otherId = l.from === selected.id ? l.to : l.from;
                  const other = graph!.nodes.find((n) => n.id === otherId);
                  if (!other) return null;
                  return (
                    <li key={i} className="flex items-center justify-between text-[12px] text-on-surface-variant">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hex(COLORS[other.type]) }} />
                        {other.label}
                      </span>
                      <span className="text-[10px] text-outline font-mono">w {l.weight}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-[18px]">touch_app</span>
                <h3 className="text-[13px] font-bold text-on-surface">Click any node</h3>
              </div>
              <p className="text-[12px] text-on-surface-variant leading-relaxed">
                Select a suspect, FIR, vehicle or other entity to view associates, FIRs, vehicles, mobiles, last known location and risk score.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function DetailList({ title, icon, items, mono = false }: { title: string; icon: string; items?: string[]; mono?: boolean }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-3">
      <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1 flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[12px]">{icon}</span>
        {title}
      </p>
      <ul className="space-y-0.5">
        {items.map((it) => (
          <li key={it} className={`text-[12px] text-on-surface ${mono ? "font-mono" : ""}`}>· {it}</li>
        ))}
      </ul>
    </div>
  );
}
