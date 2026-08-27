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
    <div className="max-w-3xl mx-auto px-6 py-10">

      <p className="text-sm uppercase tracking-widest text-gray-500 mb-2">
        New Complaint
      </p>

      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Tell us what happened
      </h1>

      <p className="text-gray-600 mb-8">
        Write in your own words. Attach an image if available.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-xl border p-6 space-y-6"
      >

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-600 px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
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
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>

          <label
            htmlFor="originalText"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Describe the Issue
          </label>

          <textarea
            id="originalText"
            name="originalText"
            required
            rows={7}
            maxLength={5000}
            placeholder="Give as much detail as possible..."
            value={form.originalText}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <p className="text-right text-xs text-gray-500 mt-1">
            {form.originalText.length}/5000
          </p>

        </div>

        <div>

          <label
            htmlFor="image"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Photo Evidence (Optional)
          </label>

          <input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-700
              file:mr-4
              file:py-2
              file:px-4
              file:border
              file:border-gray-300
              file:rounded-lg
              file:bg-gray-100
              file:text-gray-700
              file:cursor-pointer
              hover:file:bg-gray-200
              cursor-pointer"
          />

          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              className="mt-4 max-h-52 rounded-lg border object-cover"
            />
          )}

        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:bg-gray-400"
        >
          {submitting ? "Submitting..." : "Submit Complaint"}
        </button>

      </form>

    </div>
  );
}