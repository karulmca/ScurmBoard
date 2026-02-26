"""
System-wide defaults for all configurable lists.
These are used when no org-level override exists.
"""

DEFAULTS: dict = {
    "work_item_types": ["Epic", "Feature", "User Story", "Task", "Bug"],

    "work_item_states": ["New", "Active", "Resolved", "Closed"],

    "priorities": [
        {"value": 1, "label": "1 – Critical", "color": "#cc293d"},
        {"value": 2, "label": "2 – High",     "color": "#ca5010"},
        {"value": 3, "label": "3 – Medium",   "color": "#d9a800"},
        {"value": 4, "label": "4 – Low",      "color": "#a19f9d"},
    ],

    "methodologies": ["Scrum", "Kanban", "SAFe", "XP", "Lean"],

    "sprint_states": ["planning", "active", "completed"],

    "project_states": ["active", "archived", "planning"],

    "criticality_levels": ["Critical", "High", "Medium", "Low"],

    "sub_states": ["In Progress", "Blocked", "In Review", "Testing", "Done"],

    "preset_colors": [
        "#0078d4", "#107c10", "#ca5010", "#8764b8",
        "#038387", "#d9a800", "#e3008c", "#605e5c",
    ],

    "preset_icons": ["📁", "🚀", "⚡", "🔥", "💡", "🎯", "🛠️", "🌐", "📱", "🏆"],

    "type_hierarchy": {
        "Epic":       None,
        "Feature":    "Epic",
        "User Story": "Feature",
        "Task":       "User Story",
        "Bug":        "User Story",
    },
}
