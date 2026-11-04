---- MODULE Replay ----
EXTENDS Integers

VARIABLES phase, used

vars == <<phase, used>>

Init ==
  /\ phase = "live"
  /\ used = 0

Pitch ==
  /\ phase = "live"
  /\ phase' = "window"
  /\ UNCHANGED used

Challenge ==
  /\ phase = "window"
  /\ used = 0
  /\ phase' = "review"
  /\ used' = 1

Stand ==
  /\ phase = "review"
  /\ phase' = "stands"
  /\ UNCHANGED used

Overturn ==
  /\ phase = "review"
  /\ phase' = "overturned"
  /\ UNCHANGED used

Close ==
  /\ phase \in {"window", "stands", "overturned"}
  /\ phase' = "closed"
  /\ UNCHANGED used

Done ==
  /\ phase = "closed"
  /\ UNCHANGED vars

Next == Pitch \/ Challenge \/ Stand \/ Overturn \/ Close \/ Done

Spec == Init /\ [][Next]_vars

AtMostOneChallenge == used <= 1
ReviewNeedsChallenge == (phase = "review") => (used = 1)

====
