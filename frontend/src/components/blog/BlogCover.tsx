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
  fill = false,
}: {
  post: BlogPost;
  className?: string;
  sizes: string;
  width?: number;
  height?: number;
  iconClassName?: string;
  priority?: boolean;
  /** Stretch to fill the parent's height instead of sizing from width/height —
   * for grid layouts (like a hero card) where a sibling column can be taller
   * than the image's own aspect ratio would produce, which otherwise leaves
   * blank space below the image. */
  fill?: boolean;
}) {
  const image = post.featuredImageUrl;
  const Icon = bodyStyleIcon(post.icon || "Sedan");

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-photo-placeholder",
        fill ? "h-full w-full" : "",
        className
      )}
      style={fill ? undefined : { aspectRatio: `${width} / ${height}` }}
    >
      {image ? (
        fill ? (
          <Image
            src={image}
            alt={post.featuredImageAlt || post.title}
            fill
            sizes={sizes}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            className="object-cover"
          />
        ) : (
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
        )
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
