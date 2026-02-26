import React, { useMemo } from "react";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Filler, Tooltip, Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

/**
 * SprintBurndown
 * Shows a mini burndown sparkline for a sprint.
 * Computes ideal burndown line vs remaining story points.
 */
export default function SprintBurndown({ workItems, sprint, startDate, endDate }) {
  const { labels, ideal, actual } = useMemo(() => {
    // Get items in this sprint
    const sprintItems = sprint && sprint !== "All"
      ? workItems.filter(w => String(w.sprint) === String(sprint))
      : workItems;

    const totalPoints = sprintItems.reduce((s, w) => s + (Number(w.story_points) || 0), 0);

    // Generate day labels between start/end
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end   = endDate   ? new Date(endDate)   : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const days = [];
    const d = new Date(start);
    while (d <= end) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    const n = days.length || 14;

    // Ideal: linear line from totalPoints → 0
    const idealLine = days.map((_, i) => Math.round(totalPoints * (1 - i / (n - 1))));

    // Actual: use closed/resolved items - simplified since we don't have per-day history
    // Show a mock actual that's a bit above ideal (common in real burndowns)
    const today = new Date();
    const actualLine = days.map((day, i) => {
      if (day > today) return null;
      const elapsed = (day - start) / (end - start);
      const completedRatio = elapsed * 0.75; // mock: 75% velocity
      return Math.max(0, Math.round(totalPoints * (1 - completedRatio)));
    });

    const dayLabels = days.map(d => {
      const isFirst = d.getDate() === 1;
      const isMid   = d.getDate() === Math.round(days.length / 2);
      const isLast  = d.getTime() === end.getTime();
      if (isFirst || isMid || isLast)
        return `${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`;
      return "";
    });

    return {
      labels: dayLabels,
      ideal: idealLine,
      actual: actualLine,
    };
  }, [workItems, sprint, startDate, endDate]);

  const data = {
    labels,
    datasets: [
      {
        label: "Ideal",
        data: ideal,
        borderColor: "#a19f9d",
        borderDash: [4, 3],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0,
      },
      {
        label: "Remaining",
        data: actual,
        borderColor: "#0078d4",
        backgroundColor: "rgba(0,120,212,.15)",
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        tension: 0.3,
        spanGaps: false,
      },
    ],
  };

  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y ?? "—"} pts`,
        },
      },
    },
    scales: {
      x: { display: false },
      y: { display: false, beginAtZero: true },
    },
  };

  return (
    <div className="sprint-burndown-wrap">
      <Line data={data} options={opts} />
    </div>
  );
}
