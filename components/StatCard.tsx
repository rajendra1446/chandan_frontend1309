import React from "react";
import { LucideIcon } from "lucide-react";
import clsx from "clsx";

interface StatCardProps {
  title?: string;
  label?: string;
  value: string | number;
  subtitle?: string;
  subtext?: string;
  icon: LucideIcon;
  variant?: "orange" | "blue" | "emerald" | "purple" | "slate" | "rose" | "amber";
  iconColor?: string;
  iconBg?: string;
}

const variantStyles = {
  orange: "bg-orange-50 text-orange-600 border-orange-200/60",
  blue: "bg-blue-50 text-blue-600 border-blue-200/60",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
  purple: "bg-purple-50 text-purple-600 border-purple-200/60",
  rose: "bg-rose-50 text-rose-600 border-rose-200/60",
  amber: "bg-amber-50 text-amber-600 border-amber-200/60",
  slate: "bg-slate-100 text-slate-700 border-slate-200"
};

export default function StatCard({
  title,
  label,
  value,
  subtitle,
  subtext,
  icon: Icon,
  variant = "orange",
  iconColor,
  iconBg
}: StatCardProps) {
  const displayTitle = title || label || "";
  const displaySubtitle = subtitle || subtext;
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-5 lg:p-6 shadow-xs flex flex-col justify-between transition-all hover:shadow-md hover:border-slate-300 font-sans">
      <div className="flex items-start justify-between gap-1.5">
        <span className="text-[10px] sm:text-xs font-bold tracking-wider text-slate-500 uppercase font-sans line-clamp-1">
          {displayTitle}
        </span>
        <div
          className={clsx(
            "p-1.5 sm:p-2.5 rounded-xl border shrink-0",
            iconBg && iconColor ? `${iconBg} ${iconColor} border-transparent` : variantStyles[variant]
          )}
        >
          <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
        </div>
      </div>

      <div className="mt-2 sm:mt-4">
        <div className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
          {value}
        </div>
        {displaySubtitle && (
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs font-medium text-slate-500 truncate font-sans">
            {displaySubtitle}
          </p>
        )}
      </div>
    </div>
  );
}
