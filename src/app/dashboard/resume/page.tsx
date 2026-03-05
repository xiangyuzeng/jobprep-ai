"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function ResumeUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) validateAndSetFile(droppedFile);
  }, []);

  function validateAndSetFile(f: File) {
    const ext = f.name.toLowerCase().split(".").pop();
    if (ext !== "pdf" && ext !== "docx" && ext !== "doc") {
      setError("Please upload a PDF or DOCX file.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File size must be under 10MB.");
      return;
    }
    setError("");
    setFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const { resumeId } = await res.json();
      router.push(`/dashboard/resume/${resumeId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Upload Your Resume
      </h1>
      <p className="text-gray-500 mb-8">
        Upload your resume as PDF or DOCX. Our AI will parse and structure your
        experience so you can tailor it for any job.
      </p>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          dragActive
            ? "border-blue-400 bg-blue-50"
            : file
            ? "border-green-400 bg-green-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        {file ? (
          <div>
            <svg
              className="w-12 h-12 text-green-500 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="font-medium text-gray-900">{file.name}</p>
            <p className="text-sm text-gray-500 mt-1">
              {(file.size / 1024).toFixed(0)} KB
            </p>
            <button
              onClick={() => setFile(null)}
              className="text-sm text-red-600 hover:underline mt-2"
            >
              Remove
            </button>
          </div>
        ) : (
          <div>
            <svg
              className="w-12 h-12 text-gray-300 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-gray-600 mb-1">
              Drag and drop your resume here, or
            </p>
            <label className="text-blue-600 hover:underline cursor-pointer font-medium">
              browse files
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) validateAndSetFile(f);
                }}
              />
            </label>
            <p className="text-xs text-gray-400 mt-2">PDF or DOCX, up to 10MB</p>
          </div>
        )}
      </div>

      {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {uploading ? "Parsing resume..." : "Upload & Parse Resume"}
        </button>
      )}
    </div>
  );
}
