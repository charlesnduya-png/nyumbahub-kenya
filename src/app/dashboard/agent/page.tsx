import { redirect } from "next/navigation";

/** Legacy agent home → professional admin workspace */
export default function AgentDashboardRedirect() {
  redirect("/dashboard/pro");
}
