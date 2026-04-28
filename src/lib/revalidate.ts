import { revalidateTag } from 'next/cache';

/**
 * Next.js' `revalidateTag` typing has been unstable across Next versions.
 * Keep route handlers lint-clean without `@ts-ignore`.
 */
export function revalidateTagSafe(tag: string) {
  (revalidateTag as unknown as (tag: string) => void)(tag);
}

