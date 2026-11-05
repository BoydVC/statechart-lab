---- MODULE StatusFixed ----

VARIABLES phase, approved, cued, seenPosted

vars == <<phase, approved, cued, seenPosted>>

Init ==
  /\ phase = "draft"
  /\ approved = FALSE
  /\ cued = FALSE
  /\ seenPosted = FALSE

Approve ==
  /\ phase = "draft"
  /\ phase' = "approved"
  /\ approved' = TRUE
  /\ UNCHANGED <<cued, seenPosted>>

Cue ==
  /\ phase = "approved"
  /\ phase' = "cued"
  /\ cued' = TRUE
  /\ UNCHANGED <<approved, seenPosted>>

PostFromCued ==
  /\ phase = "cued"
  /\ phase' = "posted"
  /\ seenPosted' = TRUE
  /\ UNCHANGED <<approved, cued>>

PostFromApproved ==
  /\ phase = "approved"
  /\ phase' = "posted"
  /\ seenPosted' = TRUE
  /\ UNCHANGED <<approved, cued>>

Skip ==
  /\ phase \in {"draft", "approved", "cued"}  \* FIX: refuse skip after posted
  /\ seenPosted' = (seenPosted \/ (phase = "posted"))
  /\ phase' = "skipped"
  /\ UNCHANGED <<approved, cued>>

Edit ==
  /\ phase \in {"approved", "cued", "posted", "skipped"}
  /\ phase' = "draft"
  /\ approved' = FALSE
  /\ cued' = FALSE
  /\ seenPosted' = FALSE

Next == Approve \/ Cue \/ PostFromCued \/ Skip \/ Edit

Spec == Init /\ [][Next]_vars

PostedRequiresApproval == (phase = "posted") => approved
ScheduledBeforePosted == (phase = "posted") => cued
SkipOnlyBeforePost == ~(phase = "skipped" /\ seenPosted)

====
