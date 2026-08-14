import Image from "next/image";
import type { BlogPost } from "@/config/blog";
import { bodyStyleIcon } from "@/lib/vehicles/icons";
import { cn } from "@/lib/utils";

export const BLOG_COVER_WIDTH = 768;
export const BLOG_COVER_HEIGHT = 432;

export function BlogCover({
  post,
  className,
  sizes,
  width = BLOG_COVER_WIDTH,
  height = BLOG_COVER_HEIGHT,
  iconClassName = "h-14 w-14",
  priority = false,
}: {
  post: BlogPost;
  className?: string;
  sizes: string;
  width?: number;
  height?: number;
  iconClassName?: string;
  priority?: boolean;
}) {
  const image = post.featuredImageUrl;
  const Icon = bodyStyleIcon(post.icon || "Sedan");

  return (
    <div
      className={cn("relative overflow-hidden bg-photo-placeholder", className)}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {image ? (
        <Image
          src={image}
          alt={post.featuredImageAlt || post.title}
          width={width}
          height={height}
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Icon
            className={cn("text-slate-400/80", iconClassName)}
            strokeWidth={1.25}
          />
        </div>
      )}
    </div>
  );
}
