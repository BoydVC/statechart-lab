---- MODULE Pipeline ----
EXTENDS Integers

Seats == {"s1", "s2"}

VARIABLES phase, approval, judged, merged

vars == <<phase, approval, judged, merged>>

Init ==
  /\ phase = "idea"
  /\ approval = FALSE
  /\ judged = [s \in Seats |-> 0]
  /\ merged = FALSE

ToSpec ==
  /\ phase = "idea"
  /\ phase' = "spec"
  /\ UNCHANGED <<approval, judged, merged>>

Seat ==
  /\ phase = "spec"
  /\ phase' = "seated"
  /\ UNCHANGED <<approval, judged, merged>>

JudgeS1 ==
  /\ phase = "seated"
  /\ judged["s1"] = 0
  /\ judged' = [judged EXCEPT !["s1"] = judged["s1"] + 1]
  /\ UNCHANGED <<phase, approval, merged>>

JudgeS2 ==
  /\ phase = "seated"
  /\ judged["s2"] = 0
  /\ judged' = [judged EXCEPT !["s2"] = judged["s2"] + 1]
  /\ UNCHANGED <<phase, approval, merged>>

FinishJudge ==
  /\ phase = "seated"
  /\ \A s \in Seats: judged[s] = 1
  /\ phase' = "judged"
  /\ UNCHANGED <<approval, judged, merged>>

Graft ==
  /\ phase = "judged"
  /\ phase' = "grafted"
  /\ UNCHANGED <<approval, judged, merged>>

Physical ==
  /\ phase = "grafted"
  /\ phase' = "physical"
  /\ UNCHANGED <<approval, judged, merged>>

OpenDraft ==
  /\ phase = "physical"
  /\ phase' = "draft"
  /\ UNCHANGED <<approval, judged, merged>>

Approve ==
  /\ phase = "draft"
  /\ approval' = TRUE
  /\ UNCHANGED <<phase, judged, merged>>

Merge ==
  /\ phase = "draft"
  /\ approval = TRUE
  /\ merged' = TRUE
  /\ phase' = "merged"
  /\ UNCHANGED <<approval, judged>>

Done ==
  /\ phase = "merged"
  /\ UNCHANGED vars

Next ==
  \/ ToSpec \/ Seat
  \/ JudgeS1 \/ JudgeS2 \/ FinishJudge
  \/ Graft \/ Physical \/ OpenDraft
  \/ Approve \/ Merge
  \/ Done

Spec == Init /\ [][Next]_vars

EachSeatJudgedOnce == \A s \in Seats: judged[s] <= 1

NoMergeWithoutApproval == merged => approval

====
