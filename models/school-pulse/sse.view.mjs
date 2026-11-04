export const title = "Live pulse after a disconnect";

export const state = (v) => {
  if (v.pill === "on" && v.view === "stale") return "Pill says live, and a pulse was missed";
  if (v.link === "down" && v.view === "stale") return "Disconnected while a pulse was published";
  if (v.link === "up") return "Connected";
  return "Disconnected";
};

export const step = (action) => {
  if (action === "Done") return null;
  if (action === "Drop") return "the stream errors";
  if (action === "Publish") return "a pulse is published";
  if (action === "Connect") return "the stream reconnects";
  if (action === "Poll") return "the minute poll refreshes the page";
  return null;
};

export const group = (v) => {
  if (v.pill === "on" && v.view === "stale") return "Broken";
  if (v.view === "stale") return "Behind";
  return "Current";
};

export const colors = { Broken: "pink", Behind: "orange", Current: "teal" };
