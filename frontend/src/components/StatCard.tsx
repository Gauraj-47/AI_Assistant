import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone: "green" | "lime" | "cream" | "amber";
}

export function StatCard({ label, value, note, icon: Icon, tone }: StatCardProps) {
  return (
    <article className="stat-card">
      <div className="stat-card-top">
        <span>{label}</span>
        <div className={`stat-icon stat-icon--${tone}`}><Icon size={19} strokeWidth={1.9} /></div>
      </div>
      <strong className="stat-value">{value}</strong>
      <div className="stat-note"><span><ArrowUpRight size={14} /></span>{note}</div>
    </article>
  );
}
