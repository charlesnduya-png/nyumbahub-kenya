"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InvitePreview = {
  email: string;
  ownerName: string;
  rolesLabel: string;
  accountExists: boolean;
};

function JoinTeamForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const { data: session, status, update } = useSession();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InvitePreview | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!token) {
      setError("This invitation link is missing a token.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/team/join?token=${encodeURIComponent(token)}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error ?? "This invitation is invalid or has expired.");
        }
        if (!cancelled) setInvite(json.data as InvitePreview);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "This invitation is invalid.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function accept(payload: Record<string, string>) {
    setBusy(true);
    try {
      const res = await fetch("/api/team/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...payload }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401 && json.needsSignIn) {
        router.push(
          `/login?callbackUrl=${encodeURIComponent(`/team/join?token=${token}`)}`,
        );
        return;
      }
      if (!res.ok) {
        toast.error(json.error ?? "Unable to join the team");
        return;
      }

      if (json.data?.createdAccount) {
        const signedIn = await signIn("credentials", {
          email: invite?.email,
          password: payload.password,
          redirect: false,
        });
        if (!signedIn?.ok) {
          toast.success("Account created. Sign in to open the team dashboard.");
          router.push("/login");
          return;
        }
      } else {
        await update();
      }

      toast.success(`You joined ${invite?.ownerName ?? "the team"}`);
      window.location.replace("/dashboard/pro");
    } catch {
      toast.error("Unable to join the team");
    } finally {
      setBusy(false);
    }
  }

  if (loading || status === "loading") {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Checking invitation…</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error || !invite) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Invitation unavailable</CardTitle>
          <CardDescription>
            {error ?? "This invitation is invalid or has expired."}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/login">Sign in</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const signedInAsInvitee =
    session?.user?.email?.toLowerCase() === invite.email.toLowerCase();

  if (invite.accountExists) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Join {invite.ownerName}&apos;s team</CardTitle>
          <CardDescription>
            You were invited as {invite.email} with access to {invite.rolesLabel}.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-3">
          {signedInAsInvitee ? (
            <Button
              className="w-full"
              disabled={busy}
              onClick={() => void accept({})}
            >
              {busy ? "Joining…" : "Join team"}
            </Button>
          ) : (
            <Button asChild className="w-full">
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(`/team/join?token=${token}`)}`}
              >
                Sign in to join
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Join {invite.ownerName}&apos;s team</CardTitle>
        <CardDescription>
          Create your account for {invite.email}. Access: {invite.rolesLabel}.
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void accept({ name, phone, password, confirmPassword });
        }}
      >
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="join-name">Full name</Label>
            <Input
              id="join-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={busy}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="join-phone">Phone (optional)</Label>
            <Input
              id="join-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0712345678"
              disabled={busy}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="join-password">Password</Label>
            <Input
              id="join-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={busy}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="join-confirm">Confirm password</Label>
            <Input
              id="join-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={busy}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Creating account…" : "Create account and join"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function JoinTeamPage() {
  return (
    <Suspense fallback={<div className="py-8 text-center text-muted-foreground">Loading…</div>}>
      <JoinTeamForm />
    </Suspense>
  );
}
