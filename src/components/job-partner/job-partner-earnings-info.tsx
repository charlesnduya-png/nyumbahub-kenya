import { Clock3, RefreshCw, Wallet } from "lucide-react";
import {
  JOB_PARTNER_EARNINGS,
  jobPartnerCommissionPercent,
} from "@/lib/job-partner-copy";

export function JobPartnerEarningsInfo({ className }: { className?: string }) {
  const pct = jobPartnerCommissionPercent();

  return (
    <div className={className}>
      <p className="text-sm font-medium text-foreground">
        {JOB_PARTNER_EARNINGS.headline.replace("30%", `${pct}%`)}
      </p>
      <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
        <li className="flex gap-3">
          <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            <strong className="font-medium text-foreground">When you earn:</strong>{" "}
            {JOB_PARTNER_EARNINGS.when}
          </span>
        </li>
        <li className="flex gap-3">
          <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            <strong className="font-medium text-foreground">Every month:</strong>{" "}
            {JOB_PARTNER_EARNINGS.recurring}
          </span>
        </li>
        <li className="flex gap-3">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            <strong className="font-medium text-foreground">Who to refer:</strong>{" "}
            {JOB_PARTNER_EARNINGS.who}
          </span>
        </li>
      </ul>
    </div>
  );
}
