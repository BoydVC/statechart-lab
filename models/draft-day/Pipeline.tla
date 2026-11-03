---- MODULE Pipeline ----
EXTENDS Integers

VARIABLES phase, j1, j2, approved, merged

vars == <<phase, j1, j2, approved, merged>>

Init ==
  /\ phase = "idea"
  /\ j1 = 0
  /\ j2 = 0
  /\ approved = FALSE
  /\ merged = FALSE

Advance ==
  /\ \/ /\ phase = "idea" /\ phase' = "spec"
     \/ /\ phase = "spec" /\ phase' = "seats"
     \/ /\ phase = "seats" /\ phase' = "judge"
     \/ /\ phase = "judge" /\ phase' = "graft"
     \/ /\ phase = "graft" /\ phase' = "physical"
     \/ /\ phase = "physical" /\ phase' = "draft"
  /\ UNCHANGED <<j1, j2, approved, merged>>

Judge1 ==
  /\ phase = "judge"
  /\ j1 < 2
  /\ j1' = j1 + 1
  /\ UNCHANGED <<phase, j2, approved, merged>>

Judge2 ==
  /\ phase = "judge"
  /\ j2 < 2
  /\ j2' = j2 + 1
  /\ UNCHANGED <<phase, j1, approved, merged>>

Approve ==
  /\ phase = "draft"
  /\ approved = FALSE
  /\ approved' = TRUE
  /\ UNCHANGED <<phase, j1, j2, merged>>

Merge ==
  /\ phase = "draft"
  /\ approved
  /\ phase' = "merged"
  /\ merged' = TRUE
  /\ UNCHANGED <<j1, j2, approved>>

Hold ==
  UNCHANGED vars

Next ==
  \/ Advance
  \/ Judge1
  \/ Judge2
  \/ Approve
  \/ Merge
  \/ Hold

Spec == Init /\ [][Next]_vars

NoMergeWithoutApproval ==
  merged => approved

EachSeatOnce ==
  phase \in {"graft", "physical", "draft", "merged"} => (j1 = 1 /\ j2 = 1)

MergedMeansPhase ==
  merged => phase = "merged"

====
