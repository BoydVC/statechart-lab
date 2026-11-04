export const title = "Inbox retry of one file";

export const state = (v) => {
  if (v.rows > 1) return "Two rows for one file";
  if (v.phase === "done") return "Import finished";
  if (v.phase === "callback") return "Row stored, callback running";
  if (v.rows === 0) return "File waiting";
  return "One row, retry pending";
};

export const step = (action) => {
  if (action === "Done" || action === "GiveUp") return null;
  if (action === "Commit") return "the watcher reads the file and imports it";
  if (action === "CallbackThrows") return "the publish callback throws";
  if (action === "CallbackOk") return "the publish callback returns";
  return null;
};

export const group = (v) => (v.rows > 1 ? "Broken" : v.rows === 0 ? "Waiting" : "Stored");

export const colors = { Broken: "pink", Waiting: "tan", Stored: "teal" };
