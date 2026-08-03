import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function VerifyEmailPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <MailCheck className="h-7 w-7 text-primary" />
        </div>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          We sent a confirmation link to your inbox. Click the link to activate
          your NyumbaHub account and start browsing listings across Kenya.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-center text-sm text-muted-foreground">
        <p>
          Didn&apos;t receive the email? Check your spam folder or request a new
          link from your account settings once signed in.
        </p>
        <p>
          Email verification helps protect buyers and sellers from fraudulent
          listings.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button asChild className="w-full">
          <Link href="/login">Continue to sign in</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/">Browse properties</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
