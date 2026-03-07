"use client";

import { useState, useCallback } from "react";
import type { JobApplication, ApplicationStatus } from "@/types/tracker";
import { STATUSES, COLUMN_CONFIG } from "@/types/tracker";
import TrackerCard from "./TrackerCard";
import AddApplicationModal from "./AddApplicationModal";

interface DragState {
  applicationId: string;
  sourceStatus: ApplicationStatus;
}

interface Props {
  initialApplications: JobApplication[];
}

export default function TrackerBoard({ initialApplications }: Props) {
  const [applications, setApplications] = useState<JobApplication[]>(initialApplications);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<ApplicationStatus | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [addToStatus, setAddToStatus] = useState<ApplicationStatus>("saved");

  // Group and sort applications by status
  const columns: Record<ApplicationStatus, JobApplication[]> = {
    saved: [],
    applied: [],
    interviewing: [],
    offered: [],
    rejected: [],
  };
  applications.forEach((app) => {
    if (columns[app.status]) {
      columns[app.status].push(app);
    }
  });
  Object.values(columns).forEach((col) =>
    col.sort((a, b) => a.position_in_column - b.position_in_column)
  );

  // ── Drag-and-drop handlers ──

  const handleDragStart = useCallback(
    (e: React.DragEvent, app: JobApplication) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", app.id);
      setDragState({ applicationId: app.id, sourceStatus: app.status });
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, status: ApplicationStatus) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDropTarget(status);
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetStatus: ApplicationStatus) => {
      e.preventDefault();
      setDropTarget(null);

      if (!dragState) return;
      const { applicationId, sourceStatus } = dragState;
      setDragState(null);

      if (sourceStatus === targetStatus) return;

      // Optimistic: move card to bottom of target column
      const snapshot = applications;
      setApplications((prev) =>
        prev.map((app) => {
          if (app.id === applicationId) {
            const targetCards = prev.filter(
              (a) => a.status === targetStatus && a.id !== applicationId
            );
            return {
              ...app,
              status: targetStatus,
              position_in_column: targetCards.length,
            };
          }
          return app;
        })
      );

      try {
        const res = await fetch(`/api/tracker/${applicationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: targetStatus }),
        });
        if (!res.ok) {
          setApplications(snapshot);
        }
      } catch {
        setApplications(snapshot);
      }
    },
    [dragState, applications]
  );

  // ── CRUD handlers ──

  const handleSave = useCallback(
    async (data: Partial<JobApplication>) => {
      if (editingApp) {
        // Update
        const res = await fetch(`/api/tracker/${editingApp.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const { application } = await res.json();
          setApplications((prev) =>
            prev.map((app) => (app.id === editingApp.id ? { ...app, ...application } : app))
          );
        }
      } else {
        // Create
        const res = await fetch("/api/tracker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const { application } = await res.json();
          setApplications((prev) => [...prev, application]);
        }
      }
    },
    [editingApp]
  );

  const handleDelete = useCallback(async (id: string) => {
    const snapshot = applications;
    setApplications((prev) => prev.filter((app) => app.id !== id));

    try {
      const res = await fetch(`/api/tracker/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setApplications(snapshot);
      }
    } catch {
      setApplications(snapshot);
    }
  }, [applications]);

  function openAddModal(status: ApplicationStatus) {
    setEditingApp(null);
    setAddToStatus(status);
    setModalOpen(true);
  }

  function openEditModal(app: JobApplication) {
    setEditingApp(app);
    setAddToStatus(app.status);
    setModalOpen(true);
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 200px)" }}>
        {STATUSES.map((status) => {
          const config = COLUMN_CONFIG[status];
          const cards = columns[status];
          const isTarget = dropTarget === status;

          return (
            <div
              key={status}
              className="flex-1 min-w-[220px]"
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: config.color }}
                  />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--ink-dark)" }}
                  >
                    {config.label}
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                    {cards.length}
                  </span>
                </div>
                <button
                  onClick={() => openAddModal(status)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                  title={`Add to ${config.label}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              {/* Drop zone */}
              <div
                className="space-y-2 min-h-[200px] rounded-lg p-2 transition-all"
                style={{
                  background: isTarget ? config.bgLight : "transparent",
                  border: isTarget
                    ? `2px dashed ${config.borderColor}`
                    : "2px dashed transparent",
                }}
              >
                {cards.map((app) => (
                  <TrackerCard
                    key={app.id}
                    application={app}
                    onDragStart={handleDragStart}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                  />
                ))}

                {cards.length === 0 && !isTarget && (
                  <div className="text-center py-8">
                    <p className="text-xs text-gray-300">No applications</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AddApplicationModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingApp(null);
        }}
        onSave={async (data) => {
          if (!editingApp && !data.status) {
            data.status = addToStatus;
          }
          await handleSave(data);
        }}
        onDelete={handleDelete}
        editingApplication={editingApp}
      />
    </>
  );
}
