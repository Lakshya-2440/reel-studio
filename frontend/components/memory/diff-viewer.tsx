import React from "react";

interface DiffSegment {
  type: "added" | "removed" | "unchanged";
  text: string;
}

interface InlineDiffProps {
  segments: DiffSegment[];
  className?: string;
}

export function InlineDiff({ segments, className = "" }: InlineDiffProps) {
  return (
    <div className={`font-mono text-xs leading-relaxed ${className}`}>
      {segments.map((seg, idx) => {
        if (seg.type === "removed") {
          return (
            <span
              key={idx}
              className="bg-destructive/15 text-destructive line-through px-1 py-0.5 rounded mx-0.5 font-medium border border-destructive/20 select-none"
              title="Removed in creator edit"
            >
              {seg.text}
            </span>
          );
        }
        if (seg.type === "added") {
          return (
            <span
              key={idx}
              className="bg-success/15 text-success font-semibold px-1 py-0.5 rounded mx-0.5 border border-success/30"
              title="Added by creator"
            >
              {seg.text}
            </span>
          );
        }
        return <span key={idx}>{seg.text}</span>;
      })}
    </div>
  );
}
