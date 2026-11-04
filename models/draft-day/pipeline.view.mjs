export const title = "Idea to draft, merge only after approval";

export const state = (v) => {
  if (v.merged) return "Merged";
  if (v.phase === "draft" && v.approval) return "Draft, approved";
  if (v.phase === "draft") return "Draft, waiting for approval";
  if (v.phase === "idea") return "Idea";
  if (v.phase === "spec") return "Spec";
  if (v.phase === "seated") return "Seats open";
  if (v.phase === "judged") return "Seats judged";
  if (v.phase === "grafted") return "Grafted";
  if (v.phase === "physical") return "Physical check";
  return v.phase;
};

export const step = (action) => {
  if (action === "Done") return null;
  if (action === "ToSpec") return "write the spec";
  if (action === "Seat") return "open the seats";
  if (action === "JudgeS1" || action === "JudgeS2") return "judge a seat";
  if (action === "FinishJudge") return "every seat has one judgment";
  if (action === "Graft") return "graft";
  if (action === "Physical") return "physical check";
  if (action === "OpenDraft") return "open the draft";
  if (action === "Approve") return "approve";
  if (action === "Merge") return "merge";
  return null;
};

export const group = (v) => {
  if (v.merged || v.approval) return "Approved";
  if (v.phase === "idea" || v.phase === "spec") return "Shaping";
  return "Building";
};

export const colors = { Approved: "teal", Shaping: "tan", Building: "blue" };
