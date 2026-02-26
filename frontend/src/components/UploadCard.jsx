import React, { useState } from "react";

function UploadCard({ onUpload }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setStatus(null);
    if (!file) { setError("Select a CSV, JSON, or Excel file."); return; }
    try {
      setStatus("Uploading…");
      await onUpload(file);
      setStatus("✅ Upload complete.");
      setFile(null);
      event.target.reset();
    } catch (err) {
      setError(err?.message || "Upload failed.");
      setStatus(null);
    }
  };

  return (
    <div className="report-card upload-zone">
      <h2>Import ADO Dump</h2>
      <p>Upload a CSV, JSON, or Excel export from Azure DevOps.</p>
      <form className="upload-form" onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".csv,.json,.xlsx,.xls"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
        <button type="submit" className="btn btn-primary">Upload</button>
      </form>
      {status && <p style={{ marginTop: 10, color: "#107c10", fontSize: 13 }}>{status}</p>}
      {error  && <p style={{ marginTop: 10, color: "#cc293d",  fontSize: 13 }}>{error}</p>}
    </div>
  );
}

export default UploadCard;

