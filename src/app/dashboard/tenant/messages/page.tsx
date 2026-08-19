import { Suspense } from "react";
import { InboxChat } from "@/components/messages/inbox-chat";

export default function TenantMessagesPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading messages…</p>}>
      <InboxChat
        title="Messages"
        subtitle="Chat with hosts and agents about your bookings and enquiries."
        emptyHint="After you book a BnB or contact a seller, your conversation appears here."
      />
    </Suspense>
  );
}
