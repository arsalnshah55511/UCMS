import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function NewComplaint() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", originalText: "" });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("title", form.title);
      payload.append("originalText", form.originalText);

      if (image) payload.append("image", image);

      const { data } = await api.post("/api/complain", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      navigate(`/complaints/${data.complaint._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit complaint");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: "#EEF0F3", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');

        .title-field {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1.5px solid #E2E5EA;
          padding: 10px 2px;
          color: #23262B;
          outline: none;
          font-size: 15px;
          transition: border-color 180ms ease;
        }
        .title-field::placeholder { color: #A8ADB6; }
        .title-field:focus { border-bottom-color: #0F2C59; }

        .ruled-page {
          background-color: #FFFFFF;
          background-image: repeating-linear-gradient(
            to bottom,
            transparent,
            transparent 27px,
            #EEF0F3 28px
          );
          line-height: 28px;
          padding-top: 6px;
          border: 1px solid #E5E7EB;
          resize: none;
          outline: none;
          color: #23262B;
        }
        .ruled-page:focus {
          border-color: #0F2C59;
        }
        .ruled-page::placeholder { color: #A8ADB6; }

        .evidence-input::file-selector-button {
          margin-right: 12px;
          padding: 8px 14px;
          border: 1.5px solid #0F2C59;
          border-radius: 2px;
          background: transparent;
          color: #0F2C59;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 150ms ease, color 150ms ease;
        }
        .evidence-input::file-selector-button:hover {
          background: #0F2C59;
          color: #FFFFFF;
        }
      `}</style>

      <div className="mx-auto max-w-3xl">
        <p className="mb-2 text-[13px] font-medium tracking-wide text-[#0F2C59]">
          New complaint
        </p>

        <h1
          className="mb-2 text-[32px] font-semibold leading-tight text-[#23262B]"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Tell us what happened
        </h1>

        <p className="mb-8 text-[#6B7280]">
          Write in your own words. Attach an image if available.
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-7 rounded-sm px-7 py-8"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            boxShadow: "0 1px 2px rgba(35,38,43,0.04), 0 12px 32px -12px rgba(35,38,43,0.14)",
          }}
        >
          {error && (
            <div
              className="rounded-sm px-4 py-3 text-sm"
              style={{ background: "#F3E4DE", border: "1px solid #E0B7A8", color: "#8A3A24" }}
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="mb-1.5 block text-[13px] font-medium text-[#5b5147]">
              Title
            </label>

            <input
              id="title"
              name="title"
              required
              maxLength={150}
              placeholder="e.g. No hot water in Hostel Block C"
              value={form.title}
              onChange={handleChange}
              className="title-field"
            />
          </div>

          <div>
            <label htmlFor="originalText" className="mb-1.5 block text-[13px] font-medium text-[#5b5147]">
              Describe the issue
            </label>

            <textarea
              id="originalText"
              name="originalText"
              required
              rows={8}
              maxLength={5000}
              placeholder="Give as much detail as possible..."
              value={form.originalText}
              onChange={handleChange}
              className="ruled-page w-full rounded-sm px-4"
            />

            <p className="mt-1 text-right text-xs text-[#9CA3AF]">
              {form.originalText.length}/5000
            </p>
          </div>

          <div>
            <label htmlFor="image" className="mb-1.5 block text-[13px] font-medium text-[#5b5147]">
              Photo evidence (optional)
            </label>

            <input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="evidence-input block w-full text-sm text-[#5b5147]"
            />

            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="mt-4 max-h-52 rounded-sm object-cover"
                style={{ border: "1px solid #E5E7EB" }}
              />
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-sm py-3 text-sm font-semibold text-white transition-colors duration-150"
            style={{ background: submitting ? "#8FA6C4" : "#0F2C59" }}
            onMouseEnter={(e) => {
              if (!submitting) e.currentTarget.style.background = "#0A1E3F";
            }}
            onMouseLeave={(e) => {
              if (!submitting) e.currentTarget.style.background = "#0F2C59";
            }}
          >
            {submitting ? "Submitting..." : "Submit complaint"}
          </button>
        </form>
      </div>
    </div>
  );
}