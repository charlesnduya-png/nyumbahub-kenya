import Image from "next/image";
import Link from "next/link";
import { mockBlogPosts } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

async function getPosts() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 20,
    });

    if (posts.length > 0) return posts;
  } catch {
    // fallback
  }

  return mockBlogPosts;
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-primary">
            NyumbaHub Kenya
          </Link>
          <Link href="/properties" className="text-sm text-muted-foreground hover:text-foreground">
            Properties
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Property Insights & Guides</h1>
          <p className="mt-2 text-muted-foreground">
            Market updates, buying tips, and legal advice for Kenyan homebuyers and
            investors.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden transition-shadow hover:shadow-md">
              <Link href={`/blog/${post.slug}`}>
                {post.coverImage && (
                  <div className="relative aspect-[16/10] bg-muted">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-5">
                  <Badge variant="secondary" className="mb-2">
                    {post.category}
                  </Badge>
                  <h2 className="line-clamp-2 font-semibold">{post.title}</h2>
                  {post.excerpt && (
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {post.excerpt}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    {post.publishedAt
                      ? formatRelativeDate(post.publishedAt)
                      : "Draft"}{" "}
                    · {post.views.toLocaleString()} views
                  </p>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
