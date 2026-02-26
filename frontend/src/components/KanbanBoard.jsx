import React, { useState, useMemo } from "react";
import { TypeBadge, PriDot, Avatar } from "./WorkItemModal.jsx";
import { useConfig } from "../hooks/useConfig.js";
import {
  DndContext, DragOverlay, closestCorners, PointerSensor,
  useSensor, useSensors, useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ── Draggable Kanban Card ──────────────────────────────────── */
function KanbanCard({ item, overlay = false, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.task_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  const cardEl = (
    <div className={`kanban-card${overlay ? " kanban-card--overlay" : ""}`}>
      <div className="kanban-card-top">
        <TypeBadge type={item.work_item_type} />
        <span className="kanban-card-id">{item.task_id}</span>
        {!overlay && (
          <div className="kanban-card-actions">
            <button
              className="kc-action-btn"
              title="Edit"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onEdit && onEdit(item); }}
            >✏️</button>
            <button
              className="kc-action-btn kc-action-btn--danger"
              title="Delete"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete ${item.task_id}?`)) onDelete && onDelete(item.task_id);
              }}
            >🗑</button>
          </div>
        )}
      </div>
      <div className="kanban-card-title">{item.title || "(No title)"}</div>
      <div className="kanban-card-bottom">
        <div className="card-meta">
          <PriDot priority={item.priority || 3} />
          {item.story_points != null && (
            <span className="sp-badge">{item.story_points} pts</span>
          )}
        </div>
        {item.assigned_to ? (
          <div className="kanban-card-assignee">
            <Avatar name={item.assigned_to} />
            <span className="assignee-label">{item.assigned_to.split(" ")[0]}</span>
          </div>
        ) : (
          <span className="assignee-label" style={{ color: "#a19f9d" }}>Unassigned</span>
        )}
      </div>
    </div>
  );

  if (overlay) return cardEl;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {cardEl}
    </div>
  );
}

/* ── Droppable Column ───────────────────────────────────────── */
function KanbanColumn({ col, items, onNewItem, onEdit, onDelete, isOver }) {
  const { setNodeRef } = useDroppable({ id: col });
  const itemIds = items.map(i => i.task_id);

  return (
    <div className={`kanban-col col-${col} ${isOver ? "kanban-col--dragover" : ""}`}>
      <div className="kanban-col-header">
        <span>{col}</span>
        <span className="col-count">{items.length}</span>
      </div>
      <div ref={setNodeRef} className="kanban-col-body">
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {items.map(item => (
            <KanbanCard key={item.task_id} item={item} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </SortableContext>
        {items.length === 0 && (
          <div className="kanban-col-empty">Drop items here</div>
        )}
        <button className="kanban-add-card" onClick={() => onNewItem({ state: col })}>
          ＋ Add item
        </button>
      </div>
    </div>
  );
}

/* ── Main Board ─────────────────────────────────────────────── */
export default function KanbanBoard({ workItems, onStateChange, onNewItem, onEdit, onDelete }) {
  const config  = useConfig();
  const columns = config.work_item_states;

  const [activeItem, setActiveItem] = useState(null);
  const [overCol,    setOverCol]    = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const byState = useMemo(() => {
    return columns.reduce((acc, s) => {
      acc[s] = workItems.filter(w => (w.state || "New") === s);
      return acc;
    }, {});
  }, [workItems, columns]);

  const findColForItem = (taskId) =>
    columns.find(c => byState[c]?.some(i => i.task_id === taskId));

  const handleDragStart = ({ active }) => {
    const item = workItems.find(w => w.task_id === active.id);
    setActiveItem(item || null);
  };

  const handleDragOver = ({ over }) => {
    if (!over) { setOverCol(null); return; }
    const col = columns.includes(over.id)
      ? over.id
      : findColForItem(over.id);
    setOverCol(col || null);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveItem(null);
    setOverCol(null);
    if (!over) return;

    const srcCol = findColForItem(active.id);
    const dstCol = columns.includes(over.id) ? over.id : findColForItem(over.id);

    if (srcCol && dstCol && srcCol !== dstCol) {
      onStateChange(active.id, dstCol);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board">
        {columns.map(col => (
          <KanbanColumn
            key={col}
            col={col}
            items={byState[col] || []}
            onNewItem={onNewItem}
            onEdit={onEdit}
            onDelete={onDelete}
            isOver={overCol === col}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
        {activeItem ? <KanbanCard item={activeItem} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
