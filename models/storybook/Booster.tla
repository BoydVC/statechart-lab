---- MODULE Booster ----

VARIABLES phase, arms

vars == <<phase, arms>>

Init ==
  /\ phase = "pad"
  /\ arms = FALSE

Launch ==
  /\ phase = "pad"
  /\ phase' = "ascent"
  /\ UNCHANGED arms

Entry ==
  /\ phase = "ascent"
  /\ phase' = "entry"
  /\ UNCHANGED arms

Ready ==
  /\ phase = "entry"
  /\ phase' = "arms"
  /\ arms' = TRUE

SkipArms ==
  /\ phase = "entry"
  /\ phase' = "window"
  /\ arms' = FALSE

OpenWindow ==
  /\ phase = "arms"
  /\ phase' = "window"
  /\ UNCHANGED arms

Catch ==
  /\ phase = "window"
  /\ arms = TRUE
  /\ phase' = "caught"
  /\ UNCHANGED arms

Miss ==
  /\ phase = "window"
  /\ arms = FALSE
  /\ phase' = "missed"
  /\ UNCHANGED arms

Done ==
  /\ phase \in {"caught", "missed"}
  /\ UNCHANGED vars

Next == Launch \/ Entry \/ Ready \/ SkipArms \/ OpenWindow \/ Catch \/ Miss \/ Done

Spec == Init /\ [][Next]_vars

CatchNeedsArms == (phase = "caught") => arms
MissIsBare == (phase = "missed") => (arms = FALSE)

====
