import { Suspense } from "react";
import { InboxChat } from "@/components/messages/inbox-chat";

export default function ProInboxPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading inbox…</p>}>
      <InboxChat
        title="Inbox"
        subtitle="Chat with guests and buyers about your listings and BnB bookings."
        emptyHint="When a guest books your BnB or sends an enquiry, the conversation appears here."
      />
    </Suspense>
  );
}
