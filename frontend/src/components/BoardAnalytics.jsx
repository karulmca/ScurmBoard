import React, { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Tooltip, Legend, Filler,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Tooltip, Legend, Filler
);

/* ── helpers ─────────────────────────────────────────────────────────── */
const STATES  = ["New", "Active", "Resolved", "Closed"];
const S_COLORS = {
  New:      { bg: "rgba(166,160,160,.55)", border: "#a6a0a0" },
  Active:   { bg: "rgba(0,120,212,.55)",   border: "#0078d4" },
  Resolved: { bg: "rgba(16,124,16,.55)",   border: "#107c10" },
  Closed:   { bg: "rgba(50,49,48,.45)",    border: "#323130" },
};

function sprintLabel(s) {
  if (!s) return "No Sprint";
  const m = String(s).match(/\d+/);
  return m ? `Sprint ${m[0]}` : String(s);
}

/* ── Full CFD Report ─────────────────────────────────────────────────── */
function CFDFullReport({ workItems, onClose }) {
  // group by sprint, stack by state
  const sprints = useMemo(() => {
    const map = {};
    workItems.forEach(w => {
      const sp = sprintLabel(w.sprint);
      if (!map[sp]) map[sp] = { New: 0, Active: 0, Resolved: 0, Closed: 0 };
      const st = w.state || "New";
      if (map[sp][st] !== undefined) map[sp][st]++;
    });
    // sort sprint keys naturally
    return Object.fromEntries(
      Object.entries(map).sort(([a], [b]) => {
        const na = parseInt(a.match(/\d+/)?.[0] ?? 0);
        const nb = parseInt(b.match(/\d+/)?.[0] ?? 0);
        return na - nb;
      })
    );
  }, [workItems]);

  const labels = Object.keys(sprints).length
    ? Object.keys(sprints)
    : ["Sprint 1", "Sprint 2", "Sprint 3"];

  const data = {
    labels,
    datasets: STATES.map(s => ({
      label: s,
      data: labels.map(l => sprints[l]?.[s] ?? 0),
      backgroundColor: S_COLORS[s].bg,
      borderColor: S_COLORS[s].border,
      borderWidth: 1,
      fill: true,
    })),
  };

  const opts = {
    responsive: true,
    plugins: { legend: { position: "top" } },
    scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
  };

  return (
    <div className="analytics-modal-overlay" onClick={onClose}>
      <div className="analytics-modal" onClick={e => e.stopPropagation()}>
        <div className="analytics-modal-header">
          <h3>Cumulative Flow Diagram</h3>
          <button className="analytics-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="analytics-modal-body">
          <Bar data={data} options={opts} />
        </div>
      </div>
    </div>
  );
}

/* ── Full Velocity Report ────────────────────────────────────────────── */
function VelocityFullReport({ workItems, onClose }) {
  const velocityData = useMemo(() => {
    const map = {};
    workItems.forEach(w => {
      const sp = sprintLabel(w.sprint);
      if (!map[sp]) map[sp] = { committed: 0, completed: 0 };
      const pts = Number(w.story_points) || 0;
      map[sp].committed += pts;
      if (w.state === "Closed" || w.state === "Resolved") map[sp].completed += pts;
    });
    return Object.fromEntries(
      Object.entries(map).sort(([a], [b]) => {
        const na = parseInt(a.match(/\d+/)?.[0] ?? 0);
        const nb = parseInt(b.match(/\d+/)?.[0] ?? 0);
        return na - nb;
      })
    );
  }, [workItems]);

  const labels = Object.keys(velocityData).length
    ? Object.keys(velocityData)
    : ["Sprint 1", "Sprint 2", "Sprint 3"];

  const data = {
    labels,
    datasets: [
      {
        label: "Committed",
        data: labels.map(l => velocityData[l]?.committed ?? 0),
        backgroundColor: "rgba(0,120,212,.6)",
        borderColor: "#0078d4",
        borderWidth: 1,
      },
      {
        label: "Completed",
        data: labels.map(l => velocityData[l]?.completed ?? 0),
        backgroundColor: "rgba(16,124,16,.6)",
        borderColor: "#107c10",
        borderWidth: 1,
      },
    ],
  };

  const opts = {
    responsive: true,
    plugins: { legend: { position: "top" } },
    scales: { y: { beginAtZero: true } },
  };

  return (
    <div className="analytics-modal-overlay" onClick={onClose}>
      <div className="analytics-modal" onClick={e => e.stopPropagation()}>
        <div className="analytics-modal-header">
          <h3>Velocity Chart</h3>
          <button className="analytics-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="analytics-modal-body">
          <Bar data={data} options={opts} />
        </div>
      </div>
    </div>
  );
}

/* ── Main Analytics Component ────────────────────────────────────────── */
export default function BoardAnalytics({ workItems }) {
  const [cfdOpen, setCfdOpen] = useState(false);
  const [velOpen, setVelOpen] = useState(false);

  const avgWip = useMemo(() => {
    // Average WIP = items in non-closed state
    return workItems.filter(w => w.state !== "Closed").length;
  }, [workItems]);

  const avgVelocity = useMemo(() => {
    // Average velocity = avg story points completed per sprint
    const map = {};
    workItems.forEach(w => {
      if (!w.sprint) return;
      const sp = sprintLabel(w.sprint);
      if (!map[sp]) map[sp] = 0;
      if (w.state === "Closed" || w.state === "Resolved") {
        map[sp] += Number(w.story_points) || 0;
      }
    });
    const vals = Object.values(map);
    if (!vals.length) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [workItems]);

  // Sprint trend for mini CFD line
  const trendData = useMemo(() => {
    const map = {};
    workItems.forEach(w => {
      const sp = sprintLabel(w.sprint);
      if (!map[sp]) map[sp] = 0;
      if (w.state !== "Closed") map[sp]++;
    });
    const sorted = Object.entries(map).sort(([a], [b]) => {
      const na = parseInt(a.match(/\d+/)?.[0] ?? 0);
      const nb = parseInt(b.match(/\d+/)?.[0] ?? 0);
      return na - nb;
    });
    return {
      labels: sorted.map(([k]) => k),
      data: sorted.map(([, v]) => v),
    };
  }, [workItems]);

  const miniCFD = {
    labels: trendData.labels.length ? trendData.labels : ["S1", "S2", "S3"],
    datasets: [{
      data: trendData.data.length ? trendData.data : [10, 15, 12],
      borderColor: "#0078d4",
      backgroundColor: "rgba(0,120,212,.1)",
      fill: true,
      tension: 0.4,
      pointRadius: 2,
    }],
  };

  const miniOpts = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { x: { display: false }, y: { display: false } },
  };

  // Velocity per sprint for mini bar
  const velMap = useMemo(() => {
    const map = {};
    workItems.forEach(w => {
      if (!w.sprint) return;
      const sp = sprintLabel(w.sprint);
      if (!map[sp]) map[sp] = 0;
      if (w.state === "Closed" || w.state === "Resolved") map[sp] += Number(w.story_points) || 0;
    });
    const sorted = Object.entries(map).sort(([a], [b]) => {
      const na = parseInt(a.match(/\d+/)?.[0] ?? 0);
      const nb = parseInt(b.match(/\d+/)?.[0] ?? 0);
      return na - nb;
    });
    return { labels: sorted.map(([k]) => k), data: sorted.map(([, v]) => v) };
  }, [workItems]);

  const miniVel = {
    labels: velMap.labels.length ? velMap.labels : ["S1", "S2", "S3"],
    datasets: [{
      data: velMap.data.length ? velMap.data : [12, 18, 15],
      backgroundColor: "rgba(0,120,212,.5)",
      borderColor: "#0078d4",
      borderWidth: 1,
    }],
  };

  const miniVelOpts = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { x: { display: false }, y: { display: false } },
  };

  return (
    <div className="analytics-page">
      <h2 className="analytics-title">Analytics</h2>

      <div className="analytics-cards">
        {/* ── CFD Card ── */}
        <div className="analytics-card">
          <div className="analytics-card-header">Cumulative Flow Diagram</div>
          <div className="analytics-card-chart">
            <Line data={miniCFD} options={miniOpts} height={80} />
          </div>
          <div className="analytics-card-stat-label">Average work in progress</div>
          <div className="analytics-card-stat">{avgWip}</div>
          <button className="analytics-view-btn" onClick={() => setCfdOpen(true)}>
            View full report <span className="analytics-arrow">›</span>
          </button>
        </div>

        {/* ── Velocity Card ── */}
        <div className="analytics-card">
          <div className="analytics-card-header">Velocity</div>
          <div className="analytics-card-chart">
            <Bar data={miniVel} options={miniVelOpts} height={80} />
          </div>
          <div className="analytics-card-stat-label">Average Velocity</div>
          <div className="analytics-card-stat">{avgVelocity}</div>
          <button className="analytics-view-btn" onClick={() => setVelOpen(true)}>
            View full report <span className="analytics-arrow">›</span>
          </button>
        </div>
      </div>

      {cfdOpen && <CFDFullReport workItems={workItems} onClose={() => setCfdOpen(false)} />}
      {velOpen && <VelocityFullReport workItems={workItems} onClose={() => setVelOpen(false)} />}
    </div>
  );
}
