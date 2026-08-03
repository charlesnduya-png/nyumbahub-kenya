import { redirect } from "next/navigation";

export default function SellerPropertiesRedirect() {
  redirect("/dashboard/pro/listings");
}
