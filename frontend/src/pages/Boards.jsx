import React from "react";
import KanbanBoard from "../components/KanbanBoard.jsx";

export default function Boards({ workItems, onStateChange, onDelete, onNewItem, onEdit }) {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">📌 Boards</h1>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => onNewItem()}>+ New Item</button>
        </div>
      </div>
      <div className="page-body" style={{ display: "flex", flexDirection: "column" }}>
        <KanbanBoard
          workItems={workItems}
          onStateChange={onStateChange}
          onNewItem={onNewItem}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </>
  );
}
