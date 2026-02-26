import { COLORS } from './theme';

// ── Work item types ──────────────────────────────────────────────────────────
export const WORK_ITEM_TYPES = [
  { value: 'Epic',        label: 'Epic',        color: COLORS.typeEpic,    icon: '⬡' },
  { value: 'Feature',     label: 'Feature',     color: COLORS.typeFeature, icon: '★' },
  { value: 'User Story',  label: 'User Story',  color: COLORS.typeStory,   icon: '◎' },
  { value: 'Task',        label: 'Task',        color: COLORS.typeTask,    icon: '✓' },
  { value: 'Bug',         label: 'Bug',         color: COLORS.typeBug,     icon: '✕' },
];

// ── States ───────────────────────────────────────────────────────────────────
export const STATES = [
  { value: 'New',      label: 'New',      color: COLORS.stateNew      },
  { value: 'Active',   label: 'Active',   color: COLORS.stateActive   },
  { value: 'Resolved', label: 'Resolved', color: COLORS.stateResolved },
  { value: 'Closed',   label: 'Closed',   color: COLORS.stateClosed   },
];

// ── Priorities ───────────────────────────────────────────────────────────────
export const PRIORITIES = [
  { value: 1, label: 'Critical', color: COLORS.priCritical },
  { value: 2, label: 'High',     color: COLORS.priHigh     },
  { value: 3, label: 'Medium',   color: COLORS.priMedium   },
  { value: 4, label: 'Low',      color: COLORS.priLow      },
];

// ── Lookup helpers ───────────────────────────────────────────────────────────
export function getTypeInfo(value) {
  return WORK_ITEM_TYPES.find(t => t.value === value) || WORK_ITEM_TYPES[3]; // default Task
}

export function getStateInfo(value) {
  return STATES.find(s => s.value === value) || STATES[0];
}

export function getPriorityInfo(value) {
  const n = typeof value === 'string' ? parseInt(value, 10) : value;
  return PRIORITIES.find(p => p.value === n) || PRIORITIES[2];
}

// ── Kanban columns ────────────────────────────────────────────────────────────
export const KANBAN_COLUMNS = STATES.map(s => s.value);

// ── Type hierarchy (for backlog tree) ────────────────────────────────────────
export const TYPE_HIERARCHY = ['Epic', 'Feature', 'User Story', 'Task', 'Bug'];
