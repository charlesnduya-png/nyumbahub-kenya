"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { compressImageFile } from "@/lib/compress-image";
import { slugify } from "@/lib/utils";
import { BLOG_CATEGORIES } from "@/lib/validations/blog";

interface BlogRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  category: string;
  tags: string[];
  published: boolean;
  publishedAt: string | null;
  views: number;
  updatedAt: string;
}

interface BlogFormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string;
  published: boolean;
}

const emptyForm = (): BlogFormState => ({
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  category: BLOG_CATEGORIES[0],
  tags: "",
  published: false,
});

function rowToForm(post: BlogRow): BlogFormState {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    content: post.content,
    coverImage: post.coverImage ?? "",
    category: post.category,
    tags: post.tags.join(", "),
    published: post.published,
  };
}

export function BlogManager({ initialPosts = [] }: { initialPosts?: BlogRow[] }) {
  const [posts, setPosts] = useState<BlogRow[]>(initialPosts);
  const [loading, setLoading] = useState(initialPosts.length === 0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BlogFormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const isEditing = editingId !== null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog");
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not load blog posts");
        setPosts([]);
        return;
      }
      setPosts(json.data ?? []);
    } catch {
      toast.error("Could not load blog posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialPosts.length === 0) {
      void load();
    }
  }, [initialPosts.length, load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setSlugTouched(false);
    setDialogOpen(true);
  };

  const openEdit = (post: BlogRow) => {
    setEditingId(post.id);
    setForm(rowToForm(post));
    setSlugTouched(true);
    setDialogOpen(true);
  };

  const updateField = <K extends keyof BlogFormState>(
    key: K,
    value: BlogFormState[K],
  ) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && !slugTouched) {
        next.slug = slugify(String(value));
      }
      return next;
    });
  };

  const payload = useMemo(() => {
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    return {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      excerpt: form.excerpt.trim() || null,
      content: form.content.trim(),
      coverImage: form.coverImage.trim() || null,
      category: form.category,
      tags,
      published: form.published,
    };
  }, [form]);

  const uploadCover = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be 8MB or smaller");
      return;
    }

    setUploadingCover(true);
    try {
      const compressed = await compressImageFile(file);
      const formData = new FormData();
      formData.append("file", compressed);
      formData.append("type", "blog");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      const url = (json.data?.url as string | undefined) ?? null;

      if (!res.ok || !json.success || !url) {
        toast.error(json.error ?? "Cover upload failed");
        return;
      }

      updateField("coverImage", url);
      toast.success("Cover image uploaded");
    } catch {
      toast.error("Cover upload failed");
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const save = async () => {
    if (payload.title.length < 3) {
      toast.error("Title is required");
      return;
    }
    if (payload.content.length < 20) {
      toast.error("Content must be at least 20 characters");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        isEditing ? `/api/admin/blog/${editingId}` : "/api/admin/blog",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json();

      if (!res.ok) {
        const err = json.error;
        if (typeof err === "object" && err !== null) {
          const first = Object.values(err).flat()[0];
          toast.error(typeof first === "string" ? first : "Could not save article");
        } else {
          toast.error(err ?? "Could not save article");
        }
        return;
      }

      toast.success(isEditing ? "Article updated" : "Article created");
      setDialogOpen(false);
      await load();
    } catch {
      toast.error("Could not save article");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this article? This cannot be undone.")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not delete article");
        return;
      }
      toast.success("Article deleted");
      await load();
    } catch {
      toast.error("Could not delete article");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Blog</h1>
          <p className="text-muted-foreground">
            Publish market insights and buyer guides for SEO traffic.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New article
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Articles</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading articles…
            </div>
          ) : (
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
                {posts.length === 0 ? (
                  <tr>
                    <td
                      className="py-8 text-center text-sm text-muted-foreground"
                      colSpan={5}
                    >
                      No blog posts yet. Create your first article to boost SEO.
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id} className="border-b last:border-0">
                      <td className="max-w-[240px] py-3 pr-4 font-medium">
                        {post.title}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="secondary">{post.category}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {post.views.toLocaleString("en-KE")}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={post.published ? "default" : "outline"}>
                          {post.published ? "Published" : "Draft"}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(post)}
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </Button>
                          {post.published ? (
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/blog/${post.slug}`} target="_blank">
                                View
                              </Link>
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={deletingId === post.id}
                            onClick={() => void remove(post.id)}
                          >
                            {deletingId === post.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit article" : "New article"}
            </DialogTitle>
            <DialogDescription>
              Write Kenya property guides to rank on Google. Use paragraphs
              separated by blank lines.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="blog-title">Title</Label>
              <Input
                id="blog-title"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="How to rent an apartment in Nairobi in 2026"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="blog-slug">URL slug</Label>
              <Input
                id="blog-slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  updateField("slug", slugify(e.target.value));
                }}
                placeholder="rent-apartment-nairobi-2026"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="blog-category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) => updateField("category", value)}
              >
                <SelectTrigger id="blog-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOG_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="blog-excerpt">Excerpt</Label>
              <Textarea
                id="blog-excerpt"
                value={form.excerpt}
                onChange={(e) => updateField("excerpt", e.target.value)}
                rows={2}
                placeholder="Short summary for search results and the blog listing page."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="blog-content">Content</Label>
              <Textarea
                id="blog-content"
                value={form.content}
                onChange={(e) => updateField("content", e.target.value)}
                rows={12}
                placeholder="Write your article here. Separate paragraphs with a blank line."
              />
            </div>

            <div className="space-y-2">
              <Label>Cover image (optional)</Label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadCover(file);
                }}
              />
              {form.coverImage ? (
                <div className="space-y-3">
                  <div className="relative aspect-[16/9] overflow-hidden rounded-lg border bg-muted">
                    {form.coverImage.startsWith("data:") ? (
                      // eslint-disable-next-line @next/next/no-img-element -- data URLs from local upload
                      <img
                        src={form.coverImage}
                        alt="Cover preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={form.coverImage}
                        alt="Cover preview"
                        fill
                        className="object-cover"
                        unoptimized={form.coverImage.startsWith("/api/media/")}
                      />
                    )}
                    {uploadingCover ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingCover}
                      onClick={() => coverInputRef.current?.click()}
                    >
                      <ImagePlus className="mr-2 h-4 w-4" />
                      Change image
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={uploadingCover}
                      onClick={() => updateField("coverImage", "")}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={uploadingCover}
                  onClick={() => coverInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 px-4 py-10 text-sm text-muted-foreground transition-colors hover:bg-muted/50 disabled:opacity-50"
                >
                  {uploadingCover ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  ) : (
                    <ImagePlus className="h-8 w-8" />
                  )}
                  <span className="font-medium text-foreground">
                    {uploadingCover ? "Uploading…" : "Upload cover image"}
                  </span>
                  <span>JPG, PNG, WebP or GIF · max 8MB</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="blog-tags">Tags (comma-separated)</Label>
              <Input
                id="blog-tags"
                value={form.tags}
                onChange={(e) => updateField("tags", e.target.value)}
                placeholder="Nairobi, rentals, Karen"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">Publish</p>
                <p className="text-sm text-muted-foreground">
                  Published posts appear on /blog and in the sitemap.
                </p>
              </div>
              <Switch
                checked={form.published}
                onCheckedChange={(checked) => updateField("published", checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving || uploadingCover}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : isEditing ? (
                "Save changes"
              ) : (
                "Create article"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
