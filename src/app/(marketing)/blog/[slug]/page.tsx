import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { mockBlogPosts } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { generateBlogMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    if (post) return post;
  } catch {
    // fallback
  }

  return mockBlogPosts.find((p) => p.slug === slug) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: "Article not found | NyumbaHub Kenya" };
  }

  return generateBlogMetadata({
    title: post.title,
    excerpt: post.excerpt,
    slug: post.slug,
    coverImage: post.coverImage,
    category: post.category,
    publishedAt: post.publishedAt,
    authorName: post.author?.name,
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  const content: string =
    "content" in post && typeof post.content === "string"
      ? post.content
      : `# ${post.title}\n\n${post.excerpt ?? ""}\n\nThis article covers essential guidance for property buyers and sellers in Kenya. Connect your CMS or database to display full content.`;

  return (
    <article className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link href="/blog" className="text-sm text-primary hover:underline">
            ← Back to blog
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Badge variant="secondary" className="mb-4">
          {post.category}
        </Badge>
        <h1 className="text-4xl font-bold leading-tight">{post.title}</h1>
        <p className="mt-4 text-muted-foreground">
          By {post.author?.name ?? "NyumbaHub Editorial"}
          {post.publishedAt && ` · ${formatDate(post.publishedAt)}`}
        </p>

        {post.coverImage && (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-lg bg-muted">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert">
          {content.split("\n\n").map((paragraph, i) => (
            <p key={i} className="mb-4 text-muted-foreground leading-relaxed">
              {paragraph.replace(/^#\s/, "")}
            </p>
          ))}
        </div>

        {"tags" in post && post.tags?.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </main>
    </article>
  );
}
