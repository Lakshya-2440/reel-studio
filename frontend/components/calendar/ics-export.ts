export interface CalendarEvent {
  id: string;
  title: string;
  platform: string;
  description: string;
  startTime: Date;
  durationMinutes: number;
}

export function generateIcs(events: CalendarEvent[]): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  const formatUtcDate = (date: Date) => {
    return (
      date.getUTCFullYear() +
      pad(date.getUTCMonth() + 1) +
      pad(date.getUTCDate()) +
      "T" +
      pad(date.getUTCHours()) +
      pad(date.getUTCMinutes()) +
      pad(date.getUTCSeconds()) +
      "Z"
    );
  };

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TheContentCompany Studio//Content Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:TheContentCompany Schedule (IST)",
    "X-WR-TIMEZONE:Asia/Kolkata",
  ];

  for (const ev of events) {
    const startStr = formatUtcDate(ev.startTime);
    const endTime = new Date(ev.startTime.getTime() + ev.durationMinutes * 60000);
    const endStr = formatUtcDate(endTime);

    lines.push(
      "BEGIN:VEVENT",
      `UID:${ev.id}@thecontentcompany.app`,
      `DTSTAMP:${formatUtcDate(new Date())}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:[${ev.platform.toUpperCase()}] ${ev.title.replace(/\n/g, " ")}`,
      `DESCRIPTION:${ev.description.replace(/\n/g, "\\n")}`,
      `CATEGORIES:${ev.platform.toUpperCase()},CONTENT`,
      "STATUS:CONFIRMED",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcsFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
