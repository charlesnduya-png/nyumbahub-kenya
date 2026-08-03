import { redirect } from "next/navigation";

/** Legacy seller home → professional admin workspace */
export default function SellerDashboardRedirect() {
  redirect("/dashboard/pro");
}
