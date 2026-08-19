"use client";

import { useState } from "react";
import Link from "next/link";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const REASONS = [
  { value: "FRAUD", label: "Fraud or scam" },
  { value: "HARASSMENT", label: "Harassment or abuse" },
  { value: "MISLEADING", label: "Misleading information" },
  { value: "UNRESPONSIVE", label: "Unresponsive or unprofessional" },
  { value: "OTHER", label: "Other" },
] as const;

interface ReportAgentDialogProps {
  agentId: string;
  agentName: string;
  isLoggedIn: boolean;
}

export function ReportAgentDialog({
  agentId,
  agentName,
  isLoggedIn,
}: ReportAgentDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!reason) {
      toast.error("Please select a reason");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details: details.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not submit report");
        return;
      }
      toast.success(json.message ?? "Report submitted");
      setOpen(false);
      setReason("");
      setDetails("");
    } catch {
      toast.error("Could not submit report");
    } finally {
      setBusy(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <Button variant="outline" className="w-full" asChild>
        <Link href={`/login?callbackUrl=${encodeURIComponent(`/agents/${agentId}`)}`}>
          <Flag className="mr-2 h-4 w-4" />
          Sign in to report agent
        </Link>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Flag className="mr-2 h-4 w-4" />
          Report agent
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {agentName}</DialogTitle>
          <DialogDescription>
            Tell us what went wrong. Our team reviews every report and may
            contact you for more details.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="report-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-details">Details (optional)</Label>
            <Textarea
              id="report-details"
              placeholder="Describe what happened…"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              maxLength={2000}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={busy || !reason} onClick={() => void submit()}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              "Submit report"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
