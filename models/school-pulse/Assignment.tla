---- MODULE Assignment ----
\* Domain rule from enforce.ts. A grade needs points. Missing work is not graded.

VARIABLES phase, points

vars == <<phase, points>>

Init ==
  /\ phase = "missing"
  /\ points = "none"

TurnIn ==
  /\ phase = "missing"
  /\ phase' = "turned_in"
  /\ UNCHANGED points

Attach ==
  /\ phase = "turned_in"
  /\ points = "none"
  /\ points' = "set"
  /\ UNCHANGED phase

Grade ==
  /\ phase = "turned_in"
  /\ points = "set"
  /\ phase' = "graded"
  /\ UNCHANGED points

Done ==
  /\ phase = "graded"
  /\ UNCHANGED vars

Next == TurnIn \/ Attach \/ Grade \/ Done

Spec == Init /\ [][Next]_vars

GradedHasPoints == (phase = "graded") => (points = "set")
MissingIsUngraded == (phase = "missing") => (points = "none")

====
