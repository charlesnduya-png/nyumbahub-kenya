import { redirect } from "next/navigation";

export default function SellerLeadsRedirect() {
  redirect("/dashboard/pro/inquiries");
}
