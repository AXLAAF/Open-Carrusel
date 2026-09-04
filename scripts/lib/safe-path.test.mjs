import test from "node:test";
import assert from "node:assert/strict";
import path from "path";

function isPathInside(parent, child) {
  const rel = path.relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

function resolveInside(root, relativePath) {
  const resolved = path.resolve(root, relativePath);
  return isPathInside(root, resolved) ? resolved : null;
}

test("resolveInside blocks upload path traversal", () => {
  const uploads = path.resolve("/app/public/uploads");
  assert.equal(
    resolveInside(uploads, "photo.png"),
    path.join(uploads, "photo.png")
  );
  assert.equal(resolveInside(uploads, "../etc/passwd"), null);
  assert.equal(resolveInside(uploads, "../../etc/passwd"), null);
  assert.equal(resolveInside(uploads, "/etc/passwd"), null);
});

test("naive ../ resolve escapes the uploads root", () => {
  const uploads = path.resolve("/home/user/project/public/uploads");
  const escaped = path.resolve(uploads, "../../../etc/passwd");
  assert.equal(isPathInside(uploads, escaped), false);
  assert.equal(resolveInside(uploads, "../../../etc/passwd"), null);
});
