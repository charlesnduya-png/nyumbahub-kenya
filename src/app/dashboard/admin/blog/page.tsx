import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockBlogPosts } from "@/data/mock";

export default function AdminBlogPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Blog</h1>
          <p className="text-muted-foreground">Publish market insights and buyer guides.</p>
        </div>
        <Button>New article</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Articles</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Title</th>
                <th className="pb-3 pr-4 font-medium">Category</th>
                <th className="pb-3 pr-4 font-medium">Views</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockBlogPosts.map((post) => (
                <tr key={post.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium max-w-[240px]">{post.title}</td>
                  <td className="py-3 pr-4"><Badge variant="secondary">{post.category}</Badge></td>
                  <td className="py-3 pr-4">{post.views.toLocaleString()}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={post.published ? "default" : "outline"}>
                      {post.published ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/blog/${post.slug}`}>View</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
