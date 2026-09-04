import path from "path";

/** True when `child` is `parent` or a file/dir inside it. */
export function isPathInside(parent: string, child: string): boolean {
  const rel = path.relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

export function resolveInside(root: string, relativePath: string): string | null {
  const resolved = path.resolve(root, relativePath);
  return isPathInside(root, resolved) ? resolved : null;
}
