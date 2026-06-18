/**
 * Cloudflare R2 Image Loader
 * 
 * Provides image optimization via Cloudflare's edge network.
 * R2 has zero egress fees, making it ideal for image hosting.
 */

interface ImageOptions {
  width?: number;
  quality?: number;
  format?: "auto" | "webp" | "avif" | "png" | "jpeg";
}

/**
 * Generate optimized image URL via Cloudflare Image Resizing
 */
export function getOptimizedImageUrl(
  src: string,
  options: ImageOptions = {}
): string {
  const { width = 800, quality = 85, format = "auto" } = options;

  // If it's already an R2/Cloudflare Images URL, use Cloudflare Image Resizing
  try {
    const resizeUrl = new URL(src);
    const host = resizeUrl.hostname.toLowerCase();
    const isR2Host = host === "r2.dev" || host.endsWith(".r2.dev");
    const isCloudflareImagesHost =
      host === "cloudflareimages.com" || host.endsWith(".cloudflareimages.com");

    if (isR2Host || isCloudflareImagesHost) {
      resizeUrl.searchParams.set("width", width.toString());
      resizeUrl.searchParams.set("quality", quality.toString());
      if (format !== "auto") {
        resizeUrl.searchParams.set("format", format);
      }
      return resizeUrl.toString();
    }
  } catch {
    // Non-absolute/invalid URL; treat as local image path.
  }

  // For local images, serve from public directory
  return src;
}
