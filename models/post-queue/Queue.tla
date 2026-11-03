---- MODULE Queue ----
\* X Post Queue status machine. Posted from approved skips the cue.
\* Posted from draft is refused.

VARIABLES phase, approved, cued

vars == <<phase, approved, cued>>

Init ==
  /\ phase = "draft"
  /\ approved = FALSE
  /\ cued = FALSE

Approve ==
  /\ phase = "draft"
  /\ phase' = "approved"
  /\ approved' = TRUE
  /\ UNCHANGED cued

Cue ==
  /\ phase = "approved"
  /\ phase' = "cued"
  /\ cued' = TRUE
  /\ UNCHANGED approved

PostFromCued ==
  /\ phase = "cued"
  /\ phase' = "posted"
  /\ UNCHANGED <<approved, cued>>

PostFromApproved ==
  /\ phase = "approved"
  /\ phase' = "posted"
  /\ UNCHANGED <<approved, cued>>

Skip ==
  /\ phase \in {"draft", "approved", "cued"}
  /\ phase' = "skipped"
  /\ UNCHANGED <<approved, cued>>

Edit ==
  /\ phase \in {"approved", "cued", "posted", "skipped"}
  /\ phase' = "draft"
  /\ approved' = FALSE
  /\ cued' = FALSE

Hold ==
  /\ phase \in {"posted", "skipped"}
  /\ UNCHANGED vars

Next ==
  \/ Approve
  \/ Cue
  \/ PostFromCued
  \/ PostFromApproved
  \/ Skip
  \/ Edit
  \/ Hold

Spec == Init /\ [][Next]_vars

PostedRequiresApproval == (phase = "posted") => approved
ScheduledBeforePosted == (phase = "posted") => cued

====
