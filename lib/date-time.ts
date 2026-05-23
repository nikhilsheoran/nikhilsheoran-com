// ---------------------------------------------------------------------------
// Top-bar clock formatting
// ---------------------------------------------------------------------------

const weekdayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

export function formatTopBarDate(date: Date): string {
  return `${weekdayFormatter.format(date)} ${monthFormatter.format(date)} ${date.getDate()}`;
}

export function formatTopBarTime(date: Date): string {
  return timeFormatter.format(date);
}

// ---------------------------------------------------------------------------
// Note date formatting (used by content.ts server-side and client components)
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Format a date for the note list card, e.g. "Today", "Yesterday", "06/03/26" */
export function formatDateLabel(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(2);
  return `${day}/${month}/${year}`;
}

/** Format a date for the editor header, e.g. "6 March 2026 at 10:00 AM" */
export function formatUpdatedAtLabel(date: Date): string {
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return `${day} ${month} ${year} at ${displayHours}:${minutes} ${ampm}`;
}

// ---------------------------------------------------------------------------
// Note group heading (used by content.ts and mock-desktop-data.ts)
// ---------------------------------------------------------------------------

/** Compute the group heading for a note based on its date, e.g. "Last 7 Days", "March", "2024" */
export function computeGroupHeading(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 7) return "Last 7 Days";
  if (diffDays <= 30) return "Previous 30 Days";

  const currentYear = now.getFullYear();
  const noteYear = date.getFullYear();

  if (noteYear === currentYear) {
    return MONTH_NAMES[date.getMonth()];
  }

  return noteYear.toString();
}
