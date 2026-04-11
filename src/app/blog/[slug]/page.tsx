"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Tag, ArrowLeft, BookOpen } from "lucide-react";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";

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
  const params = useParams();
  const slug = params ? (params.slug as string) : "";
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];

  useEffect(() => {
    fetch(`/api/blog/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setPost(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-black/10 border-t-black animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <BookOpen size={48} className="text-black/20 mb-4" />
        <p className="text-black/40 font-bold">Post not found</p>
        <Link href="/blog" className="mt-4 text-sm font-bold text-black underline">
          Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <article className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-black/40 hover:text-black mb-8">
          <ArrowLeft size={16} /> Back to Blog
        </Link>

        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-black/40 bg-black/5 px-3 py-1 rounded-full">
              <Tag size={10} /> {tag}
            </span>
          ))}
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-black leading-tight mb-6">
          {post.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-black/40 font-bold mb-10 pb-10 border-b border-black/10">
          <Calendar size={14} />
          {new Date(post.createdAt).toLocaleDateString(currentLanguage.code === "ar" ? "ar-EG" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
        </div>

        {post.coverImage && (
          <div className="relative aspect-video mb-10 rounded-2xl overflow-hidden bg-black/5">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div 
          className="prose prose-lg max-w-none font-body text-black/80"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
    </article>
  );
}