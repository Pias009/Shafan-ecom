import { redirect } from "next/navigation";

// Middleware has already sent visitors without a valid admin token to /ueadmin/login.
export default function AdminRoot() {
  redirect("/ueadmin/dashboard");
}
