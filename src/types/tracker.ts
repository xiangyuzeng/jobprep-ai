export type ApplicationStatus =
  | "saved"
  | "applied"
  | "interviewing"
  | "offered"
  | "rejected";

export const STATUSES: ApplicationStatus[] = [
  "saved",
  "applied",
  "interviewing",
  "offered",
  "rejected",
];

export const COLUMN_CONFIG: Record<
  ApplicationStatus,
  { label: string; color: string; bgLight: string; borderColor: string }
> = {
  saved: { label: "Saved", color: "#6b7280", bgLight: "#f3f4f6", borderColor: "#d1d5db" },
  applied: { label: "Applied", color: "#2563eb", bgLight: "#eff6ff", borderColor: "#93c5fd" },
  interviewing: { label: "Interviewing", color: "#c9a84c", bgLight: "#fef9ee", borderColor: "#e8d5a0" },
  offered: { label: "Offered", color: "#2d6a4f", bgLight: "#ecfdf5", borderColor: "#6ee7b7" },
  rejected: { label: "Rejected", color: "#9ca3af", bgLight: "#f9fafb", borderColor: "#e5e7eb" },
};

export interface JobApplication {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  job_url: string | null;
  job_description: string | null;
  status: ApplicationStatus;
  position_in_column: number;
  tailored_resume_id: string | null;
  board_id: string | null;
  resume_id: string | null;
  applied_at: string | null;
  interview_date: string | null;
  offer_deadline: string | null;
  salary_range: string | null;
  notes: string | null;
  contact_name: string | null;
  contact_email: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  tailored_resume?: {
    id: string;
    company_name: string | null;
    match_score: number | null;
  } | null;
  interview_board?: {
    id: string;
    company_name: string;
    role: string;
    round_type: string;
    status: string;
  } | null;
  resume?: {
    id: string;
    original_filename: string | null;
  } | null;
}
