import React from "react";

function TabButton({ active, label, onClick }) {
  return (
    <button
      className={active ? "tab active" : "tab"}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

export default TabButton;
