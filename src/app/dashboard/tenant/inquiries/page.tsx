import { redirect } from "next/navigation";

export default function TenantInquiriesRedirect() {
  redirect("/dashboard/tenant/messages");
}
