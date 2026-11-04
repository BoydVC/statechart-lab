export const title = "Approve, then a late save";

export const state = (v) => {
  if (v.revoked && v.status === "posted") return "Posted after the edit cleared approval";
  if (v.loaded && v.snapStatus === "posted" && v.revoked) return "Edit cleared approval, stale save still open";
  if (v.loaded && v.snapStatus === "posted") return "Stale mark-posted is waiting to save";
  if (v.status === "posted") return "Posted";
  if (v.status === "cued") return "Cued";
  if (v.loaded && v.status === "approved") return "Approved, and a second request holds a copy";
  if (v.status === "approved") return "Approved";
  if (v.revoked) return "Edited back to draft";
  return "Draft";
};

export const step = (action) => {
  if (action === "Done" || action === "Discard") return null;
  if (action === "Approve") return "approve";
  if (action === "Edit") return "edit, which clears approval";
  if (action === "Cue") return "cue the intent link";
  if (action === "PostedFresh") return "mark posted";
  if (action === "Load") return "a second request reads the queue";
  if (action === "Arm") return "that request decides to mark posted";
  if (action === "CommitSnap") return "that request saves over the newer edit";
  return null;
};

export const group = (v) => {
  if (v.revoked && v.status === "posted") return "Broken";
  if (v.status === "posted" || v.status === "cued" || v.status === "approved") return "Approved";
  return "Open";
};

export const colors = { Broken: "pink", Approved: "teal", Open: "tan" };
