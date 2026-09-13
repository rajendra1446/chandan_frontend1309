import { redirect } from "next/navigation";

export default function CastBilletRedirect() {
  redirect("/dashboard/billets");
}
