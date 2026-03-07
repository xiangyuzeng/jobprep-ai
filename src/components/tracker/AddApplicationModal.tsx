"use client";

import { useState, useEffect, useRef } from "react";
import type { JobApplication, ApplicationStatus } from "@/types/tracker";
import { STATUSES, COLUMN_CONFIG } from "@/types/tracker";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<JobApplication>) => Promise<void>;
  onDelete?: (id: string) => void;
  editingApplication?: JobApplication | null;
}

export default function AddApplicationModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingApplication,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("saved");
  const [salaryRange, setSalaryRange] = useState("");
  const [notes, setNotes] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [appliedAt, setAppliedAt] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [offerDeadline, setOfferDeadline] = useState("");

  useEffect(() => {
    if (editingApplication) {
      setCompanyName(editingApplication.company_name);
      setJobTitle(editingApplication.job_title);
      setJobUrl(editingApplication.job_url || "");
      setStatus(editingApplication.status);
      setSalaryRange(editingApplication.salary_range || "");
      setNotes(editingApplication.notes || "");
      setContactName(editingApplication.contact_name || "");
      setContactEmail(editingApplication.contact_email || "");
      setAppliedAt(editingApplication.applied_at ? editingApplication.applied_at.split("T")[0] : "");
      setInterviewDate(editingApplication.interview_date ? editingApplication.interview_date.split("T")[0] : "");
      setOfferDeadline(editingApplication.offer_deadline ? editingApplication.offer_deadline.split("T")[0] : "");
    } else {
      setCompanyName("");
      setJobTitle("");
      setJobUrl("");
      setStatus("saved");
      setSalaryRange("");
      setNotes("");
      setContactName("");
      setContactEmail("");
      setAppliedAt("");
      setInterviewDate("");
      setOfferDeadline("");
    }
  }, [editingApplication, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !jobTitle.trim()) return;
    setSaving(true);
    try {
      await onSave({
        company_name: companyName.trim(),
        job_title: jobTitle.trim(),
        job_url: jobUrl.trim() || null,
        status,
        salary_range: salaryRange.trim() || null,
        notes: notes.trim() || null,
        contact_name: contactName.trim() || null,
        contact_email: contactEmail.trim() || null,
        applied_at: appliedAt || null,
        interview_date: interviewDate || null,
        offer_deadline: offerDeadline || null,
      } as Partial<JobApplication>);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:border-[var(--vermillion)] focus:ring-1 focus:ring-[var(--vermillion)]";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto mx-4"
        style={{ border: "1px solid var(--paper-dark)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-cinzel text-lg font-semibold text-gray-900">
            {editingApplication ? "Edit Application" : "Add Application"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Company Name *</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={inputClass}
                placeholder="e.g. Google"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Job Title *</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className={inputClass}
                placeholder="e.g. Software Engineer"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Job URL</label>
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                className={inputClass}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className={inputClass}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {COLUMN_CONFIG[s].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Salary Range</label>
            <input
              type="text"
              value={salaryRange}
              onChange={(e) => setSalaryRange(e.target.value)}
              className={inputClass}
              placeholder="e.g. $120k - $150k"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Contact Name</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className={inputClass}
                placeholder="Recruiter name"
              />
            </div>
            <div>
              <label className={labelClass}>Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className={inputClass}
                placeholder="recruiter@company.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Applied Date</label>
              <input
                type="date"
                value={appliedAt}
                onChange={(e) => setAppliedAt(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Interview Date</label>
              <input
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Offer Deadline</label>
              <input
                type="date"
                value={offerDeadline}
                onChange={(e) => setOfferDeadline(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
              rows={3}
              placeholder="Any notes about this application..."
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              {editingApplication && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Delete this application?")) {
                      onDelete(editingApplication.id);
                      onClose();
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !companyName.trim() || !jobTitle.trim()}
                className="px-4 py-2 text-sm font-medium text-white rounded-sm hover:bg-[var(--vermillion-dark)] disabled:opacity-50 transition-colors"
                style={{ background: "var(--vermillion)" }}
              >
                {saving ? "Saving..." : editingApplication ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
