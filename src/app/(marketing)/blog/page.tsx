import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPublishedBlogPosts } from "@/lib/blog";
import { buildPageMetadata } from "@/lib/seo";
import { formatRelativeDate } from "@/lib/utils";

export const metadata = buildPageMetadata({
  title: "Kenya Property Insights & Guides",
  description:
    "Market updates, buying tips, rental advice, and legal guides for Kenyan homebuyers, tenants, and investors on Your Home.",
  path: "/blog",
  keywords: [
    "Kenya property blog",
    "buying house Kenya tips",
    "Nairobi real estate news",
  ],
});

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts(20);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-primary">
            Your Home
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

        {posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No articles published yet. Check back soon for market insights and guides.
              </p>
              <Button asChild className="mt-4">
                <Link href="/properties">Browse properties</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
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
        )}
      </main>
    </div>
  );
}
