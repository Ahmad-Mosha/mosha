import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Notes created by another screen file themselves.
 *
 * A topic's write-up belongs under Learning / <track>, a project's under
 * Projects / <project>. Left in General they would be unfindable within a
 * month, so the folder is derived from where the note came from rather than
 * being something to remember.
 */
export const LEARNING_ROOT = "Learning";
export const PROJECTS_ROOT = "Projects";

/** Find or create each folder in the path, returning the deepest one. */
export async function ensureFolderPath(
  ctx: MutationCtx,
  path: string[]
): Promise<Id<"folders"> | undefined> {
  let parentId: Id<"folders"> | undefined = undefined;

  for (const rawName of path) {
    const name = rawName.trim();
    if (!name) continue;

    const siblings = await ctx.db
      .query("folders")
      .withIndex("by_parent", (q) => q.eq("parentId", parentId))
      .collect();

    // Case-insensitive so "operating systems" and "Operating Systems" do not
    // become two folders holding half the notes each.
    const found = siblings.find(
      (f) => f.name.trim().toLowerCase() === name.toLowerCase()
    );

    if (found) {
      parentId = found._id;
      continue;
    }

    const all = await ctx.db.query("folders").collect();
    parentId = await ctx.db.insert("folders", {
      name,
      icon: "folder",
      parentId,
      order: all.length,
      createdAt: new Date().toISOString(),
    });
  }

  return parentId;
}

/**
 * Keep a container folder's name in step with the thing it belongs to, so
 * renaming a track or project does not strand its notes under the old name.
 */
export async function renameChildFolder(
  ctx: MutationCtx,
  rootName: string,
  previousName: string,
  nextName: string
) {
  if (previousName.trim() === nextName.trim()) return;

  const roots = await ctx.db
    .query("folders")
    .withIndex("by_parent", (q) => q.eq("parentId", undefined))
    .collect();
  const root = roots.find(
    (f) => f.name.trim().toLowerCase() === rootName.toLowerCase()
  );
  if (!root) return;

  const children = await ctx.db
    .query("folders")
    .withIndex("by_parent", (q) => q.eq("parentId", root._id))
    .collect();
  const match = children.find(
    (f) => f.name.trim().toLowerCase() === previousName.trim().toLowerCase()
  );
  if (match) await ctx.db.patch(match._id, { name: nextName.trim() });
}
