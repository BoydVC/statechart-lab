export const title = "Token file shared by two sign-ins";

const inflight = (v) => {
  const pending = v.pending;
  if (!pending || typeof pending !== "object") return 0;
  return Object.values(pending).filter((n) => n !== -1).length;
};

export const state = (v) => {
  if (v.usedExpired && v.clobbered) return "Expired token used after an older sign-in won";
  if (v.usedExpired) return "Sync used an expired token";
  if (v.clobbered) return "Older sign-in overwrote the newer token";
  if (v.filePhase === "empty" && inflight(v) >= 2) return "Two sign-ins in flight";
  if (v.filePhase === "empty" && inflight(v) === 1) return "One sign-in in flight";
  if (v.filePhase === "empty") return "No token file";
  if (v.filePhase === "fresh") return "Token is fresh";
  if (v.filePhase === "expiring") return "Token is expiring";
  return "Token is expired";
};

export const step = (action) => {
  if (action === "Done") return null;
  if (action.startsWith("Start")) return "a sign-in starts";
  if (action.startsWith("Finish")) return "the sign-in writes the token file";
  if (action.startsWith("Use")) return "sync reads the access token";
  if (action === "Tick") return "time passes";
  return null;
};

export const group = (v) => {
  if (v.usedExpired || v.clobbered) return "Broken";
  if (v.filePhase === "expired" || v.filePhase === "expiring") return "Aging";
  if (v.filePhase === "fresh") return "Ready";
  return "Empty";
};

export const colors = { Broken: "pink", Aging: "orange", Ready: "teal", Empty: "tan" };
