"use client";

import Link from "next/link";
import type { JobApplication } from "@/types/tracker";

interface Props {
  application: JobApplication;
  onDragStart: (e: React.DragEvent, app: JobApplication) => void;
  onEdit: (app: JobApplication) => void;
  onDelete: (id: string) => void;
}

export default function TrackerCard({ application, onDragStart, onEdit, onDelete }: Props) {
  const relevantDate = application.interview_date
    ? { label: "Interview", value: application.interview_date }
    : application.offer_deadline
      ? { label: "Offer deadline", value: application.offer_deadline }
      : application.applied_at
        ? { label: "Applied", value: application.applied_at }
        : null;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, application)}
      onClick={() => onEdit(application)}
      className="relative bg-white rounded-sm p-3 border border-gray-200 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing group"
    >
      <p className="text-sm font-medium text-gray-900 truncate pr-5">
        {application.company_name}
      </p>
      <p className="text-xs text-gray-500 truncate mt-0.5">
        {application.job_title}
      </p>

      {/* Linked resource badges */}
      <div className="flex flex-wrap gap-1 mt-2">
        {application.tailored_resume && (
          <Link
            href={`/dashboard/resume/${application.resume_id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ background: "#fbe4df", color: "var(--vermillion)" }}
          >
            Resume
            {application.tailored_resume.match_score != null &&
              ` ${application.tailored_resume.match_score}%`}
          </Link>
        )}
        {application.interview_board && (
          <Link
            href={`/dashboard/interview/${application.interview_board.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ background: "#e8e4df", color: "var(--ink-dark)" }}
          >
            Board
          </Link>
        )}
      </div>

      {/* Salary range */}
      {application.salary_range && (
        <p className="text-[10px] text-gray-500 mt-2">{application.salary_range}</p>
      )}

      {/* Key date */}
      {relevantDate && (
        <p className="text-[10px] text-gray-400 mt-1">
          {relevantDate.label} {new Date(relevantDate.value).toLocaleDateString()}
        </p>
      )}

      {/* Notes preview */}
      {application.notes && (
        <p className="text-[10px] text-gray-400 mt-1 truncate">
          {application.notes.length > 50
            ? application.notes.slice(0, 50) + "..."
            : application.notes}
        </p>
      )}

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (confirm("Delete this application?")) onDelete(application.id);
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
        title="Delete"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
