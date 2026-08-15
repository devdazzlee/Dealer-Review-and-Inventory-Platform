"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Eye,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Upload,
  ImageOff,
} from "lucide-react";
import { adminApi, type AdminBlogPost } from "@/lib/api/admin-client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ArticleBody } from "@/components/blog/ArticleBody";
import type { ArticleBlock, InlinePart } from "@/config/blog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Editable form of an ArticleBlock — every block collapses to one text field so the admin never touches JSON. */
type EditableBlock =
  | { id: string; type: "p"; text: string }
  | { id: string; type: "h2"; text: string }
  | { id: string; type: "h3"; text: string }
  | { id: string; type: "ul"; text: string }
  | { id: string; type: "quote"; text: string };

type EditableFaq = { id: string; question: string; answer: string };

const BLOCK_TYPE_LABELS: Record<EditableBlock["type"], string> = {
  p: "Paragraph",
  h2: "Heading",
  h3: "Subheading",
  ul: "Bullet list",
  quote: "Quote",
};

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `block-${idCounter}`;
}

/** [label](href) inline links round-trip through a plain textarea without JSON. */
function partsToText(parts: InlinePart[]): string {
  return parts
    .map((part) =>
      typeof part === "string" ? part : `[${part.link}](${part.href})`
    )
    .join("");
}

function textToParts(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(text))) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push({ link: match[1], href: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : [text];
}

function blockToEditable(block: ArticleBlock): EditableBlock | null {
  switch (block.type) {
    case "p":
      return { id: nextId(), type: "p", text: partsToText(block.parts) };
    case "h2":
      return { id: nextId(), type: "h2", text: block.text };
    case "h3":
      return { id: nextId(), type: "h3", text: block.text };
    case "ul":
      return { id: nextId(), type: "ul", text: block.items.join("\n") };
    case "quote":
      return { id: nextId(), type: "quote", text: block.text };
    case "faq":
      return null; // derived from the FAQ list below, not edited inline
  }
}

function editableToBlock(block: EditableBlock): ArticleBlock {
  switch (block.type) {
    case "p":
      return { type: "p", parts: textToParts(block.text) };
    case "h2":
      return { type: "h2", text: block.text };
    case "h3":
      return { type: "h3", text: block.text };
    case "ul":
      return {
        type: "ul",
        items: block.text
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };
    case "quote":
      return { type: "quote", text: block.text };
  }
}

function newBlock(type: EditableBlock["type"]): EditableBlock {
  return { id: nextId(), type, text: "" } as EditableBlock;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Shared row/card action buttons — same three actions in both the desktop table and the mobile card list. */
function PostActions({
  post,
  onEdit,
  onDelete,
}: {
  post: AdminBlogPost;
  onEdit: (post: AdminBlogPost) => void;
  onDelete: (post: AdminBlogPost) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        asChild
        disabled={!post.published}
        title={post.published ? "View live page" : "Publish to view live"}
      >
        {post.published ? (
          <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : (
          <span className="cursor-not-allowed opacity-40">
            <ExternalLink className="h-4 w-4" />
          </span>
        )}
      </Button>
      <Button type="button" size="icon" variant="ghost" onClick={() => onEdit(post)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button type="button" size="icon" variant="ghost" onClick={() => onDelete(post)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

const DEFAULT_BLOCKS: EditableBlock[] = [
  { id: nextId(), type: "p", text: "Write the article here." },
];
const DEFAULT_FAQS: EditableFaq[] = Array.from({ length: 5 }, (_, i) => ({
  id: nextId(),
  question: `Question ${i + 1}?`,
  answer: `Answer ${i + 1}.`,
}));

export function AdminBlogSection() {
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<AdminBlogPost> | null>(null);
  const [blocks, setBlocks] = useState<EditableBlock[]>(DEFAULT_BLOCKS);
  const [faqs, setFaqs] = useState<EditableFaq[]>(DEFAULT_FAQS);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminBlogPost | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.blog({ page });
      setPosts(result.data);
      setTotalPages(result.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }, [page]);

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
    setBlocks(DEFAULT_BLOCKS.map((b) => ({ ...b, id: nextId() })));
    setFaqs(DEFAULT_FAQS.map((f) => ({ ...f, id: nextId() })));
    setSlugTouched(false);
    setError(null);
  }

  function openEdit(post: AdminBlogPost) {
    setEditing(post);
    const rawBlocks = (post.body as ArticleBlock[]) ?? [];
    setBlocks(
      rawBlocks
        .map(blockToEditable)
        .filter((b): b is EditableBlock => b !== null)
    );
    const rawFaqs = (post.faqs as { question: string; answer: string }[]) ?? [];
    setFaqs(
      rawFaqs.map((f) => ({ id: nextId(), question: f.question, answer: f.answer }))
    );
    // Existing posts keep their slug fixed — editing the title must never
    // silently change a live URL.
    setSlugTouched(true);
    setError(null);
  }

  function setTitle(title: string) {
    setEditing((prev) => {
      if (!prev) return prev;
      const next = { ...prev, title };
      if (!slugTouched) next.slug = slugify(title);
      return next;
    });
  }

  function setSlug(slug: string) {
    setSlugTouched(true);
    setEditing((prev) => (prev ? { ...prev, slug } : prev));
  }

  function updateBlock(id: string, text: string) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, text } : b)));
  }

  function changeBlockType(id: string, type: EditableBlock["type"]) {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { id, type, text: b.text } as EditableBlock : b))
    );
  }

  function addBlock(type: EditableBlock["type"]) {
    setBlocks((prev) => [...prev, newBlock(type)]);
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  function moveBlock(id: string, direction: -1 | 1) {
    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addFaq() {
    setFaqs((prev) => [...prev, { id: nextId(), question: "", answer: "" }]);
  }

  function updateFaq(id: string, field: "question" | "answer", value: string) {
    setFaqs((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  }

  function removeFaq(id: string) {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleImageUpload(file: File) {
    setUploadingImage(true);
    setError(null);
    try {
      const { url } = await adminApi.uploadImage(file);
      setEditing((prev) => (prev ? { ...prev, featuredImageUrl: url } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  }

  function buildBody(): ArticleBlock[] {
    const content = blocks.map(editableToBlock);
    const faqItems = faqs
      .filter((f) => f.question.trim() && f.answer.trim())
      .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }));
    if (faqItems.length === 0) return content;
    return [
      ...content,
      { type: "faq", title: "Frequently Asked Questions", items: faqItems },
    ];
  }

  function buildFaqs() {
    return faqs
      .filter((f) => f.question.trim() && f.answer.trim())
      .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }));
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...editing,
        body: buildBody(),
        faqs: buildFaqs(),
        slug: editing.slug || slugify(editing.title || "") || "untitled",
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
    setTogglingId(post.id);
    try {
      await adminApi.updateBlog(post.id, { published });
      await load();
    } finally {
      setTogglingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteBlog(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } finally {
      setDeleting(false);
    }
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
        <>
          {/* Desktop / tablet: table */}
          <div className="hidden overflow-x-auto rounded-lg border bg-white sm:block">
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
                      <div className="flex h-6 items-center gap-2">
                        <Switch
                          checked={post.published}
                          disabled={togglingId === post.id}
                          onCheckedChange={(checked) => void togglePublish(post, checked)}
                        />
                        {togglingId === post.id && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </td>
                    <td className="p-3">{post.featured ? "Yes" : "No"}</td>
                    <td className="p-3">
                      <PostActions post={post} onEdit={openEdit} onDelete={setDeleteTarget} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="space-y-3 sm:hidden">
            {posts.map((post) => (
              <div key={post.id} className="rounded-lg border bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium leading-snug">{post.title}</p>
                  {post.featured && (
                    <span className="shrink-0 rounded-md bg-gold-light px-2 py-0.5 text-xs font-bold text-accent-text">
                      Featured
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{post.category}</p>
                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={post.published}
                      disabled={togglingId === post.id}
                      onCheckedChange={(checked) => void togglePublish(post, checked)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {post.published ? "Published" : "Draft"}
                    </span>
                    {togglingId === post.id && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <PostActions post={post} onEdit={openEdit} onDelete={setDeleteTarget} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            Page {page} of {totalPages}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              disabled={loading || page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              disabled={loading || page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit post" : "New post"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold sm:col-span-2">
                  Title
                  <input
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    value={editing.title ?? ""}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>
                <label className="text-xs font-semibold">
                  Slug
                  <input
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm font-mono"
                    value={editing.slug ?? ""}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="auto-generated-from-title"
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
                <label className="text-xs font-semibold">
                  Author
                  <input
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    value={editing.author ?? ""}
                    onChange={(e) => setEditing({ ...editing, author: e.target.value })}
                  />
                </label>
                <label className="text-xs font-semibold">
                  Author role
                  <input
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    value={editing.authorRole ?? ""}
                    onChange={(e) => setEditing({ ...editing, authorRole: e.target.value })}
                  />
                </label>
                <label className="text-xs font-semibold sm:col-span-2">
                  Author bio
                  <textarea
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    value={editing.authorBio ?? ""}
                    onChange={(e) => setEditing({ ...editing, authorBio: e.target.value })}
                  />
                </label>

                <div className="text-xs font-semibold sm:col-span-2">
                  Featured image
                  <div className="mt-1 flex flex-col items-start gap-3 rounded-md border p-3 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100">
                      {editing.featuredImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={editing.featuredImageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageOff className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleImageUpload(file);
                          e.target.value = "";
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={uploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploadingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        {editing.featuredImageUrl ? "Replace image" : "Upload image"}
                      </Button>
                      <input
                        className="w-full rounded-md border px-3 py-2 text-xs text-muted-foreground"
                        placeholder="Alt text (describe the image for accessibility)"
                        value={editing.featuredImageAlt ?? ""}
                        onChange={(e) =>
                          setEditing({ ...editing, featuredImageAlt: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

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
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold">Article content</span>
                  <Select
                    key={blocks.length}
                    onValueChange={(v) => addBlock(v as EditableBlock["type"])}
                  >
                    <SelectTrigger className="h-8 w-[160px] text-xs">
                      <SelectValue placeholder="Add block..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(BLOCK_TYPE_LABELS) as EditableBlock["type"][]).map((t) => (
                        <SelectItem key={t} value={t}>
                          {BLOCK_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  {blocks.length === 0 && (
                    <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                      No content yet — add a block above.
                    </p>
                  )}
                  {blocks.map((block, index) => (
                    <div key={block.id} className="rounded-md border p-2">
                      <div className="mb-1.5 flex items-center gap-2">
                        <Select
                          value={block.type}
                          onValueChange={(v) =>
                            changeBlockType(block.id, v as EditableBlock["type"])
                          }
                        >
                          <SelectTrigger className="h-7 w-[130px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(BLOCK_TYPE_LABELS) as EditableBlock["type"][]).map(
                              (t) => (
                                <SelectItem key={t} value={t}>
                                  {BLOCK_TYPE_LABELS[t]}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                        <div className="ml-auto flex items-center gap-0.5">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={index === 0}
                            onClick={() => moveBlock(block.id, -1)}
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={index === blocks.length - 1}
                            onClick={() => moveBlock(block.id, 1)}
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() => removeBlock(block.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <textarea
                        className="w-full rounded-md border px-2.5 py-1.5 text-sm"
                        rows={block.type === "ul" ? 3 : block.type.startsWith("h") ? 1 : 3}
                        placeholder={
                          block.type === "ul"
                            ? "One item per line"
                            : block.type === "p"
                              ? "Paragraph text. Use [link text](/dealers) for a link."
                              : "Text"
                        }
                        value={block.text}
                        onChange={(e) => updateBlock(block.id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold">FAQs (shown at the bottom of the article)</span>
                  <Button type="button" size="sm" variant="outline" onClick={addFaq}>
                    <Plus className="h-3.5 w-3.5" />
                    Add question
                  </Button>
                </div>
                <div className="space-y-2">
                  {faqs.map((faq) => (
                    <div key={faq.id} className="flex gap-2 rounded-md border p-2">
                      <div className="flex-1 space-y-1.5">
                        <input
                          className="w-full rounded-md border px-2.5 py-1.5 text-sm"
                          placeholder="Question"
                          value={faq.question}
                          onChange={(e) => updateFaq(faq.id, "question", e.target.value)}
                        />
                        <textarea
                          className="w-full rounded-md border px-2.5 py-1.5 text-sm"
                          rows={2}
                          placeholder="Answer"
                          value={faq.answer}
                          onChange={(e) => updateFaq(faq.id, "answer", e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0 text-destructive"
                        onClick={() => removeFaq(faq.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)}>
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          <article>
            <span className="inline-block rounded-md bg-secondary px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-primary">
              {editing?.category || "Category"}
            </span>
            <h1 className="mt-3 text-2xl font-extrabold leading-tight text-primary">
              {editing?.title || "Untitled"}
            </h1>
            <p className="mt-2 text-muted-foreground">{editing?.excerpt}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              By {editing?.author || "Staff"}
              {editing?.authorRole ? ` — ${editing.authorRole}` : ""}
            </p>
            <div className="mt-6">
              <ArticleBody blocks={blocks.map(editableToBlock)} />
            </div>
            {faqs.length > 0 && (
              <div className="mt-6">
                <ArticleBody blocks={[{ type: "faq", items: buildFaqs() }]} />
              </div>
            )}
          </article>
          <DialogFooter>
            {editing?.id && editing.published && editing.slug && (
              <Button type="button" variant="outline" asChild>
                <a href={`/blog/${editing.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  View live page
                </a>
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete post?"
        description={
          deleteTarget
            ? `Delete “${deleteTarget.title}”? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        confirming={deleting}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
