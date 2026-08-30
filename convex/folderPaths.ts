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

/**
 * Tear down the folder a track or project owned.
 *
 * Notes belonging to the thing being deleted go with it — keeping them would
 * just move the clutter one level down. Anything else you happened to file in
 * that folder is moved to General rather than destroyed, and subfolders are
 * lifted out so nothing is lost by association.
 */
export async function removeOwnedFolder(
  ctx: MutationCtx,
  rootName: string,
  ownerName: string,
  ownsNote: (note: { topicId?: unknown; projectId?: unknown }) => boolean
) {
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
  const owned = children.find(
    (f) => f.name.trim().toLowerCase() === ownerName.trim().toLowerCase()
  );
  if (!owned) return;

  const notes = await ctx.db
    .query("notes")
    .withIndex("by_folder", (q) => q.eq("folderId", owned._id))
    .collect();

  for (const note of notes) {
    if (ownsNote(note)) await ctx.db.delete(note._id);
    else await ctx.db.patch(note._id, { folderId: undefined });
  }

  const nested = await ctx.db
    .query("folders")
    .withIndex("by_parent", (q) => q.eq("parentId", owned._id))
    .collect();
  for (const f of nested) await ctx.db.patch(f._id, { parentId: undefined });

  await ctx.db.delete(owned._id);

  // A root left holding nothing is noise, so it goes too.
  const remaining = await ctx.db
    .query("folders")
    .withIndex("by_parent", (q) => q.eq("parentId", root._id))
    .collect();
  const rootNotes = await ctx.db
    .query("notes")
    .withIndex("by_folder", (q) => q.eq("folderId", root._id))
    .collect();
  if (remaining.length === 0 && rootNotes.length === 0) {
    await ctx.db.delete(root._id);
  }
}
