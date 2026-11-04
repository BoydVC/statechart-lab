---- MODULE Queue ----
EXTENDS Integers

VARIABLES status, text, approvedText, version, revoked, loaded,
          snapStatus, snapText, snapApproved

vars == <<status, text, approvedText, version, revoked, loaded,
          snapStatus, snapText, snapApproved>>

Init ==
  /\ status = "draft"
  /\ text = "t1"
  /\ approvedText = ""
  /\ version = 0
  /\ revoked = FALSE
  /\ loaded = FALSE
  /\ snapStatus = "draft"
  /\ snapText = "t1"
  /\ snapApproved = ""

Approve ==
  /\ status \in {"draft", "approved"}
  /\ version < 4
  /\ status' = "approved"
  /\ approvedText' = text
  /\ version' = version + 1
  /\ revoked' = FALSE
  /\ UNCHANGED <<text, loaded, snapStatus, snapText, snapApproved>>

Edit ==
  /\ status = "approved"
  /\ text = "t1"
  /\ version < 4
  /\ text' = "t2"
  /\ status' = "draft"
  /\ approvedText' = ""
  /\ version' = version + 1
  /\ revoked' = TRUE
  /\ UNCHANGED <<loaded, snapStatus, snapText, snapApproved>>

Cue ==
  /\ ~loaded
  /\ status = "approved"
  /\ version < 4
  /\ status' = "cued"
  /\ version' = version + 1
  /\ UNCHANGED <<text, approvedText, revoked, loaded, snapStatus, snapText, snapApproved>>

PostedFresh ==
  /\ ~loaded
  /\ status \in {"approved", "cued", "posted"}
  /\ version < 4
  /\ status' = "posted"
  /\ version' = version + 1
  /\ UNCHANGED <<text, approvedText, revoked, loaded, snapStatus, snapText, snapApproved>>

Load ==
  /\ ~loaded
  /\ version < 4
  /\ loaded' = TRUE
  /\ snapStatus' = status
  /\ snapText' = text
  /\ snapApproved' = approvedText
  /\ UNCHANGED <<status, text, approvedText, version, revoked>>

Arm ==
  /\ loaded
  /\ snapStatus \in {"approved", "cued", "posted"}
  /\ snapStatus' = "posted"
  /\ UNCHANGED <<status, text, approvedText, version, revoked, loaded, snapText, snapApproved>>

CommitSnap ==
  /\ loaded
  /\ snapStatus = "posted"
  /\ version < 4
  /\ status' = "posted"
  /\ text' = snapText
  /\ approvedText' = snapApproved
  /\ version' = version + 1
  /\ loaded' = FALSE
  /\ UNCHANGED <<revoked, snapStatus, snapText, snapApproved>>

Discard ==
  /\ loaded
  /\ loaded' = FALSE
  /\ UNCHANGED <<status, text, approvedText, version, revoked, snapStatus, snapText, snapApproved>>

Done ==
  /\ \/ version >= 4
     \/ status = "posted"
     \/ (revoked /\ status = "draft" /\ ~loaded)
  /\ UNCHANGED vars

Next == Approve \/ Edit \/ Cue \/ PostedFresh \/ Load \/ Arm \/ CommitSnap \/ Discard \/ Done

Spec == Init /\ [][Next]_vars

RevokeSticks == revoked => status # "posted"

NeverPostedUnapproved == status = "posted" => approvedText # ""

====
