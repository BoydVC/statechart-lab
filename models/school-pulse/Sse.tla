---- MODULE Sse ----
VARIABLE link

vars == <<link>>

Init ==
  link = "down"

Connect ==
  /\ link = "down"
  /\ link' = "open"

Drop ==
  /\ link = "open"
  /\ link' = "closed"

Hold ==
  UNCHANGED link

Next ==
  \/ Connect
  \/ Drop
  \/ Hold

Spec == Init /\ [][Next]_vars

LinkKnown ==
  link \in {"down", "open", "closed"}

ReconnectScheduled ==
  link # "closed"

====
