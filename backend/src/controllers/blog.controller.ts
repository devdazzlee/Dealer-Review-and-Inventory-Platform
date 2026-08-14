import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { blogService } from "../services/blog.service";

export class BlogController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const q = req.validatedQuery ?? {};
    const result = await blogService.listPublic({
      page: q.page,
      pageSize: q.pageSize,
      category: q.category,
    });
    res.json(result);
  });

  featured = asyncHandler(async (_req: Request, res: Response) => {
    const post = await blogService.featured();
    res.json({ data: post });
  });

  categories = asyncHandler(async (_req: Request, res: Response) => {
    const data = await blogService.categories();
    res.json({ data });
  });

  recent = asyncHandler(async (req: Request, res: Response) => {
    const data = await blogService.recent(
      5,
      typeof req.query.exclude === "string" ? req.query.exclude : undefined
    );
    res.json({ data });
  });

  sitemap = asyncHandler(async (_req: Request, res: Response) => {
    const data = await blogService.sitemap();
    res.json({ data });
  });

  getBySlug = asyncHandler(async (req: Request, res: Response) => {
    const post = await blogService.getBySlug(req.validatedParams!.slug);
    const related = await blogService.related(post.slug, post.category, 3);
    res.json({ post, related });
  });

  subscribe = asyncHandler(async (req: Request, res: Response) => {
    const result = await blogService.subscribe(req.validatedBody!.email);
    res.json(result);
  });

  adminList = asyncHandler(async (req: Request, res: Response) => {
    const q = req.validatedQuery ?? {};
    const result = await blogService.adminList({
      page: q.page,
      pageSize: q.pageSize,
      category: q.category,
      published: q.published,
      search: q.search,
    });
    res.json(result);
  });

  adminGet = asyncHandler(async (req: Request, res: Response) => {
    const post = await blogService.getById(req.validatedParams!.id);
    res.json(post);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const post = await blogService.create(req.validatedBody!);
    res.status(201).json(post);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const post = await blogService.update(req.validatedParams!.id, req.validatedBody!);
    res.json(post);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    await blogService.delete(req.validatedParams!.id);
    res.json({ success: true });
  });
}

export const blogController = new BlogController();
