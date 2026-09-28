import { useState } from "react";
import api from "../api/axios";

export default function DownloadPdfButton({
  endpoint,
  fileName = "UCMS_Document.pdf",
  label = "Download PDF",
  className = "",
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDownload = async () => {
    if (loading) return; // prevents double clicks
    setLoading(true);
    setError("");

    try {
      const res = await api.get(endpoint, { responseType: "blob" });

      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      let message = "Could not generate the PDF. Please try again.";
      // With responseType "blob", error bodies also arrive as a Blob
      try {
        const text = await err.response?.data?.text?.();
        if (text) message = JSON.parse(text).message || message;
      } catch (e) {
        /* keep default message */
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className={className}
      >
        {loading ? "Generating..." : label}
      </button>
      {error && <small className="text-rose-600">{error}</small>}
    </span>
  );
}