export const title = "One household session";

export const state = (v) => {
  if (v.sending) return "Sending";
  if (v.phase === "reauth") return "Sign-in required";
  if (v.lease === "stale") return "Lease stale";
  return "Session fresh";
};

export const step = (action) => {
  if (action === "Done" || action === "KeepAlive") return null;
  if (action === "Age") return "the lease goes stale";
  if (action === "Reauth") return "sign in again";
  if (action === "Resume") return "resume the session";
  if (action === "BeginSend") return "send a message";
  if (action === "EndSend") return "the send finishes";
  return null;
};

export const group = (v) => {
  if (v.phase === "reauth" || v.lease === "stale") return "Blocked";
  return "Ready";
};

export const colors = { Blocked: "orange", Ready: "teal" };
