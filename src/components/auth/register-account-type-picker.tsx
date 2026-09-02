import Link from "next/link";
import { cn } from "@/lib/utils";

type AccountTypeOption = {
  href?: string;
  active?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
};

export function RegisterAccountTypePicker({
  options,
  className,
}: {
  options: AccountTypeOption[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-3 rounded-2xl bg-white p-3 shadow-sm sm:grid-cols-3",
        className,
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const inner = (
          <>
            <div
              className={cn(
                "mb-2 flex items-center gap-2",
                option.active ? "text-primary" : undefined,
              )}
            >
              <Icon className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm font-semibold">{option.label}</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
              {option.description}
            </p>
          </>
        );

        if (option.active || !option.href) {
          return (
            <div
              key={option.label}
              className={cn(
                "rounded-xl p-4 text-slate-900",
                option.active
                  ? "border-2 border-primary bg-primary/10"
                  : "border border-slate-200 bg-white",
              )}
            >
              {inner}
            </div>
          );
        }

        return (
          <Link
            key={option.label}
            href={option.href}
            className="rounded-xl border border-slate-200 bg-white p-4 text-slate-900 transition hover:border-primary/50 hover:bg-slate-50"
          >
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
