"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { adminApi, type AdminBlogPost } from "@/lib/api/admin-client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const EMPTY_BODY = JSON.stringify(
  [{ type: "p", parts: ["Write the article here."] }],
  null,
  2
);
const EMPTY_FAQS = JSON.stringify(
  [{ question: "Question?", answer: "Answer." }],
  null,
  2
);

export function AdminBlogSection() {
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<AdminBlogPost> | null>(null);
  const [bodyText, setBodyText] = useState(EMPTY_BODY);
  const [faqText, setFaqText] = useState(EMPTY_FAQS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.blog({ page: 1 });
      setPosts(result.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing({
      title: "",
      slug: "",
      excerpt: "",
      category: "Buying Guides",
      author: "Avery Cole",
      authorRole: "Staff Writer",
      authorBio: "",
      featuredImageUrl: "",
      featuredImageAlt: "",
      metaTitle: "",
      metaDescription: "",
      published: false,
      featured: false,
    });
    setBodyText(EMPTY_BODY);
    setFaqText(EMPTY_FAQS);
    setError(null);
  }

  function openEdit(post: AdminBlogPost) {
    setEditing(post);
    setBodyText(JSON.stringify(post.body, null, 2));
    setFaqText(JSON.stringify(post.faqs, null, 2));
    setError(null);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      const body = JSON.parse(bodyText);
      const faqs = JSON.parse(faqText);
      const payload = {
        ...editing,
        body,
        faqs,
        slug: editing.slug || editing.title || "untitled",
        title: editing.title || "Untitled",
        excerpt: editing.excerpt || "",
        category: editing.category || "Buying Guides",
        author: editing.author || "Staff",
        metaTitle: (editing.metaTitle || editing.title || "Untitled").slice(0, 60),
        metaDescription: (editing.metaDescription || editing.excerpt || "").slice(0, 155),
      };
      if (editing.id) await adminApi.updateBlog(editing.id, payload);
      else await adminApi.createBlog(payload);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save post");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(post: AdminBlogPost, published: boolean) {
    await adminApi.updateBlog(post.id, { published });
    await load();
  }

  async function remove(post: AdminBlogPost) {
    if (!confirm(`Delete “${post.title}”?`)) return;
    await adminApi.deleteBlog(post.id);
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Blog</h2>
          <p className="text-sm text-muted-foreground">Create, edit, and publish buying guides.</p>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New post
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs text-muted-foreground">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Published</th>
                <th className="p-3">Featured</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b">
                  <td className="max-w-xs truncate p-3 font-medium">{post.title}</td>
                  <td className="p-3">{post.category}</td>
                  <td className="p-3">
                    <Switch
                      checked={post.published}
                      onCheckedChange={(checked) => void togglePublish(post, checked)}
                    />
                  </td>
                  <td className="p-3">{post.featured ? "Yes" : "No"}</td>
                  <td className="p-3">
                    <Button type="button" size="icon" variant="ghost" onClick={() => openEdit(post)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => void remove(post)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit post" : "New post"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold sm:col-span-2">
                Title
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={editing.title ?? ""}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </label>
              <label className="text-xs font-semibold">
                Slug
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={editing.slug ?? ""}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                />
              </label>
              <label className="text-xs font-semibold">
                Category
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={editing.category ?? ""}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                />
              </label>
              <label className="text-xs font-semibold sm:col-span-2">
                Excerpt
                <textarea
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={editing.excerpt ?? ""}
                  onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                />
              </label>
              <label className="text-xs font-semibold sm:col-span-2">
                Featured image URL
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={editing.featuredImageUrl ?? ""}
                  onChange={(e) => setEditing({ ...editing, featuredImageUrl: e.target.value })}
                />
              </label>
              <label className="text-xs font-semibold sm:col-span-2">
                Image alt
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={editing.featuredImageAlt ?? ""}
                  onChange={(e) => setEditing({ ...editing, featuredImageAlt: e.target.value })}
                />
              </label>
              <label className="text-xs font-semibold">
                Meta title
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={editing.metaTitle ?? ""}
                  onChange={(e) => setEditing({ ...editing, metaTitle: e.target.value })}
                />
              </label>
              <label className="text-xs font-semibold">
                Meta description
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={editing.metaDescription ?? ""}
                  onChange={(e) => setEditing({ ...editing, metaDescription: e.target.value })}
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <Switch
                  checked={Boolean(editing.published)}
                  onCheckedChange={(checked) => setEditing({ ...editing, published: checked })}
                />
                Published
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <Switch
                  checked={Boolean(editing.featured)}
                  onCheckedChange={(checked) => setEditing({ ...editing, featured: checked })}
                />
                Featured
              </label>
              <label className="text-xs font-semibold sm:col-span-2">
                Body JSON
                <textarea
                  className="mt-1 min-h-[140px] w-full rounded-md border px-3 py-2 font-mono text-xs"
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                />
              </label>
              <label className="text-xs font-semibold sm:col-span-2">
                FAQs JSON
                <textarea
                  className="mt-1 min-h-[100px] w-full rounded-md border px-3 py-2 font-mono text-xs"
                  value={faqText}
                  onChange={(e) => setFaqText(e.target.value)}
                />
              </label>
              {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
