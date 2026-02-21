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
