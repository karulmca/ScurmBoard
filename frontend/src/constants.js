/**
 * constants.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all configurable lists / enum values used
 * throughout the frontend.
 *
 * These are the *fallback* defaults used when the API is unavailable or
 * before the config has loaded.  The authoritative values at runtime come
 * from GET /api/config (see hooks/useConfig.js).
 */

// ── Work item types (ordered from top of hierarchy to bottom) ───────────────
export const WORK_ITEM_TYPES = ["Epic", "Feature", "User Story", "Task", "Bug"];

// ── Work item lifecycle states ───────────────────────────────────────────────
export const WORK_ITEM_STATES = ["New", "Active", "Resolved", "Closed"];

// ── Priority levels (value = numeric rank, lower = more critical) ────────────
export const PRIORITIES = [
  { value: 1, label: "1 – Critical", color: "#cc293d" },
  { value: 2, label: "2 – High",     color: "#ca5010" },
  { value: 3, label: "3 – Medium",   color: "#d9a800" },
  { value: 4, label: "4 – Low",      color: "#a19f9d" },
];

// ── Project management methodologies ────────────────────────────────────────
export const METHODOLOGIES = ["Scrum", "Kanban", "SAFe", "XP", "Lean"];

// ── Sprint lifecycle states ──────────────────────────────────────────────────
export const SPRINT_STATES = ["planning", "active", "completed"];

// ── Project lifecycle states ─────────────────────────────────────────────────
export const PROJECT_STATES = ["active", "archived", "planning"];

// ── Criticality levels (used in risk / severity tagging) ────────────────────
export const CRITICALITY_LEVELS = ["Critical", "High", "Medium", "Low"];

// ── Sub-states for richer task tracking ─────────────────────────────────────
export const SUB_STATES = ["In Progress", "Blocked", "In Review", "Testing", "Done"];

// ── Preset accent colours (project / org branding) ──────────────────────────
export const PRESET_COLORS = [
  "#0078d4", "#107c10", "#ca5010", "#8764b8",
  "#038387", "#d9a800", "#e3008c", "#605e5c",
];

// ── Preset emoji icons (project cards) ──────────────────────────────────────
export const PRESET_ICONS = ["📁", "🚀", "⚡", "🔥", "💡", "🎯", "🛠️", "🌐", "📱", "🏆"];

// ── Type hierarchy (child → parent; null = top-level) ───────────────────────
export const TYPE_HIERARCHY = {
  Epic:          null,
  Feature:       "Epic",
  "User Story":  "Feature",
  Task:          "User Story",
  Bug:           "User Story",
};

// ── Convenience: map priority value → short label ───────────────────────────
export const PRIORITY_LABEL_MAP = Object.fromEntries(
  PRIORITIES.map((p) => [p.value, p.label.split("–")[1]?.trim() ?? p.label])
);

// ── Combined default config shape (mirrors backend DEFAULTS) ─────────────────
export const DEFAULT_CONFIG = {
  work_item_types:   WORK_ITEM_TYPES,
  work_item_states:  WORK_ITEM_STATES,
  priorities:        PRIORITIES,
  methodologies:     METHODOLOGIES,
  sprint_states:     SPRINT_STATES,
  project_states:    PROJECT_STATES,
  criticality_levels:CRITICALITY_LEVELS,
  sub_states:        SUB_STATES,
  preset_colors:     PRESET_COLORS,
  preset_icons:      PRESET_ICONS,
  type_hierarchy:    TYPE_HIERARCHY,
};
