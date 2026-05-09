/**
 * Cloudflare R2 URL resolver.
 *
 * How it works:
 *   - Every VideoItem has two fields:
 *       video_url  — a working fallback URL (sample videos for dev, or old CDN URL)
 *       video_key  — the R2 object key  (e.g. 'saltabilidad/v1-squat-vertical.mp4')
 *   - When R2_PUBLIC_URL is set in .env, resolveVideoUrl uses the R2 key.
 *   - When R2_PUBLIC_URL is empty (dev without R2), it falls back to video_url.
 *
 * To activate R2 for a given environment:
 *   1. Create the Cloudflare R2 bucket and get the public URL.
 *   2. Add R2_PUBLIC_URL=https://videos.volleytip.app to .env.production
 *   3. Upload video files at the paths defined in video_key on each VideoItem.
 *   That's all — no code changes needed.
 *
 * Signed URLs (future):
 *   If you need private videos behind signed URLs, replace the body of
 *   resolveVideoUrl with a call to a Supabase Edge Function that generates
 *   a time-limited signed URL from R2. The calling code doesn't need to change.
 */

import { appConfig } from './config';

function base(): string {
  return appConfig.r2PublicUrl.replace(/\/$/, '');
}

function r2Configured(): boolean {
  return appConfig.r2PublicUrl.length > 0;
}

/** Build a full R2 URL from a relative key. */
export function r2Url(key: string): string {
  return `${base()}/${key.replace(/^\//, '')}`;
}

/**
 * Resolve the playback URL for a video.
 *
 * @param video_url  Working fallback URL (used in dev / when R2 not configured).
 * @param video_key  R2 object key (used in production when R2_PUBLIC_URL is set).
 */
export function resolveVideoUrl(
  video_url: string | null | undefined,
  video_key: string | null | undefined,
): string | null {
  if (r2Configured() && video_key) {
    return r2Url(video_key);
  }
  return video_url ?? null;
}

/**
 * Resolve the URL for a thumbnail image.
 * Same logic as resolveVideoUrl — R2 key when configured, fallback otherwise.
 */
export function resolveThumbnailUrl(
  thumbnail_url: string | null | undefined,
  thumbnail_key: string | null | undefined,
): string | null {
  if (r2Configured() && thumbnail_key) {
    return r2Url(thumbnail_key);
  }
  return thumbnail_url ?? null;
}
