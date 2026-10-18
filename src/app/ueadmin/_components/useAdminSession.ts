"use client";

// The session now comes from the server layout via context — no client fetch.
export { useAdminSession } from "./AdminSessionContext";
export type { AdminUser } from "./AdminSessionContext";
