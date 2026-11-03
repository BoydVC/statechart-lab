---- MODULE PostQueue ----
VARIABLES status, seenApproved, seenPosted

vars == <<status, seenApproved, seenPosted>>

Init ==
  /\ status = "draft"
  /\ seenApproved = FALSE
  /\ seenPosted = FALSE

Approve ==
  /\ status \in {"draft", "approved"}
  /\ status' = "approved"
  /\ seenApproved' = TRUE
  /\ UNCHANGED seenPosted

Cue ==
  /\ status \in {"approved", "cued"}
  /\ status' = "cued"
  /\ UNCHANGED <<seenApproved, seenPosted>>

Post ==
  /\ status \in {"approved", "cued", "posted"}
  /\ status' = "posted"
  /\ seenPosted' = TRUE
  /\ UNCHANGED seenApproved

Skip ==
  /\ status' = "skipped"
  /\ UNCHANGED <<seenApproved, seenPosted>>

Edit ==
  /\ status' = "draft"
  /\ seenApproved' = FALSE
  /\ seenPosted' = FALSE

Hold ==
  UNCHANGED vars

Next ==
  \/ Approve
  \/ Cue
  \/ Post
  \/ Skip
  \/ Edit
  \/ Hold

Spec == Init /\ [][Next]_vars

PostedRequiresApproval ==
  status = "posted" => seenApproved

SkipOnlyBeforePost ==
  status = "skipped" => seenPosted = FALSE

====
