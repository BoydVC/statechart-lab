---- MODULE Pipeline ----
\* Draft Day as the public repo describes it. Merge is enabled only after approval.
\* Each seat can be scored once.

EXTENDS FiniteSets, Integers

CONSTANTS Seats

VARIABLES phase, approved, hits

vars == <<phase, approved, hits>>

Init ==
  /\ phase = "idea"
  /\ approved = FALSE
  /\ hits = [s \in Seats |-> 0]

ToSpec ==
  /\ phase = "idea"
  /\ phase' = "spec"
  /\ UNCHANGED <<approved, hits>>

ToSeats ==
  /\ phase = "spec"
  /\ phase' = "seats"
  /\ UNCHANGED <<approved, hits>>

ToJudge ==
  /\ phase = "seats"
  /\ phase' = "judge"
  /\ UNCHANGED <<approved, hits>>

Judge(s) ==
  /\ phase = "judge"
  /\ s \in Seats
  /\ hits[s] = 0
  /\ hits' = [hits EXCEPT ![s] = 1]
  /\ UNCHANGED <<phase, approved>>

ToGraft ==
  /\ phase = "judge"
  /\ \A s \in Seats : hits[s] = 1
  /\ phase' = "graft"
  /\ UNCHANGED <<approved, hits>>

ToPhysical ==
  /\ phase = "graft"
  /\ phase' = "physical"
  /\ UNCHANGED <<approved, hits>>

ToDraft ==
  /\ phase = "physical"
  /\ phase' = "draft"
  /\ UNCHANGED <<approved, hits>>

Approve ==
  /\ phase = "draft"
  /\ approved = FALSE
  /\ approved' = TRUE
  /\ UNCHANGED <<phase, hits>>

Merge ==
  /\ phase = "draft"
  /\ approved = TRUE
  /\ phase' = "merged"
  /\ UNCHANGED <<approved, hits>>

Done ==
  /\ phase = "merged"
  /\ UNCHANGED vars

Next ==
  \/ ToSpec
  \/ ToSeats
  \/ ToJudge
  \/ \E s \in Seats : Judge(s)
  \/ ToGraft
  \/ ToPhysical
  \/ ToDraft
  \/ Approve
  \/ Merge
  \/ Done

Spec == Init /\ [][Next]_vars

NoMergeWithoutApproval == (phase = "merged") => approved
AtMostOnce == \A s \in Seats : hits[s] <= 1
JudgedBeforeGraft ==
  phase \in {"graft", "physical", "draft", "merged"} => (\A s \in Seats : hits[s] = 1)

====
