"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Calendar, Tag, ArrowLeft, BookOpen } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  tags: string[];
  createdAt: string;
}

export default function BlogPostPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/blog/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setPost)
      .catch(() => router.push("/announcements"))
      .finally(() => setLoading(false));
  }, [slug, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-black/10 border-t-black animate-spin" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen relative z-0">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        {/* Back */}
        <Link
          href="/announcements"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-black/40 hover:text-black mb-10 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Announcements
        </Link>

        {/* Cover */}
        {post.coverImage && (
          <div className="relative aspect-[16/7] w-full rounded-[2rem] overflow-hidden mb-10 shadow-2xl shadow-black/10">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((t) => (
              <span key={t} className="flex items-center gap-1 glass-panel rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black/50">
                <Tag size={10} /> {t}
              </span>
            ))}
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-black text-black leading-tight mb-4">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="font-body text-xl text-black/60 leading-relaxed mb-4">{post.excerpt}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-black/40 font-bold">
            <Calendar size={14} />
            {new Date(post.createdAt).toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </div>
        </div>

        {/* Content */}
        <article
          className="prose prose-lg max-w-none font-body text-black/80 leading-relaxed
            prose-headings:font-display prose-headings:text-black
            prose-p:text-black/70 prose-p:leading-relaxed
            prose-strong:text-black prose-a:text-black prose-a:underline
            prose-img:rounded-2xl prose-img:shadow-lg"
          dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, "<br/>") }}
        />

        {/* Back button */}
        <div className="mt-16 pt-10 border-t border-black/5">
          <Link
            href="/announcements"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full glass-panel border border-black/10 text-xs font-black uppercase tracking-widest text-black hover:bg-black hover:text-white transition-all"
          >
            <BookOpen size={14} /> View All Posts
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
