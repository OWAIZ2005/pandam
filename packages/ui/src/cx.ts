/** Join truthy class-name fragments. Tiny local alternative to `clsx`. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
