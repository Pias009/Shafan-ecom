"use client";

import { redirect } from "next/navigation";
import { useParams } from "next/navigation";

export default function AnnouncementSlugPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';
  redirect(`/blog/${slug}`);
}