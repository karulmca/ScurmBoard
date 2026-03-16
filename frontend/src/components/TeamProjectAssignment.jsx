import React, { useEffect, useState } from "react";
import { getTeams } from "../services/api.js";
import { getProjects } from "../services/api.js";
import "../styles/assignment.css";

function TeamProjectAssignment({ user, onComplete }) {
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  useEffect(() => {
    loadTeamsAndProjects();
  }, []);

  const loadTeamsAndProjects = async () => {
    try {
      const [teamsData, projectsData] = await Promise.all([
        getTeams(),
        getProjects(),
      ]);
      setTeams(teamsData);
      setProjects(projectsData);
    } catch (error) {
      console.error("Failed to load teams and projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTeam = (teamId) => {
    setSelectedTeams((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
  };

  const toggleProject = (projectId) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleComplete = async () => {
    if (selectedTeams.length === 0 || selectedProjects.length === 0) {
      alert("Please select at least one team and one project");
      return;
    }

    setAssignmentLoading(true);
    try {
      // TODO: Call API to assign user to selected teams and projects
      // For now, we'll just proceed to the main app
      await new Promise((resolve) => setTimeout(resolve, 500));
      onComplete();
    } catch (error) {
      console.error("Failed to assign teams and projects:", error);
      alert("Failed to complete assignment. Please try again.");
    } finally {
      setAssignmentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="assignment-container">
        <div className="assignment-card">
          <p>Loading teams and projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="assignment-container">
      <div className="assignment-card">
        <h1>Welcome, {user.name}!</h1>
        <p className="subtitle">Assign yourself to teams and projects to get started</p>

        <div className="assignment-section">
          <h2>Select Teams</h2>
          <div className="item-grid">
            {teams.length === 0 ? (
              <p className="empty-message">No teams available</p>
            ) : (
              teams.map((team) => (
                <div key={team.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`team-${team.id}`}
                    checked={selectedTeams.includes(team.id)}
                    onChange={() => toggleTeam(team.id)}
                  />
                  <label htmlFor={`team-${team.id}`}>{team.name}</label>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="assignment-section">
          <h2>Select Projects</h2>
          <div className="item-grid">
            {projects.length === 0 ? (
              <p className="empty-message">No projects available</p>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`project-${project.id}`}
                    checked={selectedProjects.includes(project.id)}
                    onChange={() => toggleProject(project.id)}
                  />
                  <label htmlFor={`project-${project.id}`}>{project.name}</label>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          className="assignment-button"
          onClick={handleComplete}
          disabled={assignmentLoading}
        >
          {assignmentLoading ? "Processing..." : "Get Started"}
        </button>
      </div>
    </div>
  );
}

export default TeamProjectAssignment;
