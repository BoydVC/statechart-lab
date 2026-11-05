---- MODULE SseFixed ----

VARIABLES link, pill, pending, view

vars == <<link, pill, pending, view>>

Init ==
  /\ link = "up"
  /\ pill = "on"
  /\ pending = FALSE
  /\ view = "current"

Drop ==
  /\ link \in {"up", "syncing"}
  /\ link' = "down"
  /\ pill' = "off"
  /\ UNCHANGED <<pending, view>>

Publish ==
  /\ IF link = "up"
     THEN /\ view' = "current"
          /\ pending' = FALSE
     ELSE /\ view' = "stale"
          /\ pending' = TRUE
  /\ UNCHANGED <<link, pill>>

\* FIX: onopen starts the startup refresh; pill stays off until it resolves
Connect ==
  /\ link = "down"
  /\ link' = "syncing"
  /\ pill' = "off"
  /\ UNCHANGED <<pending, view>>

\* FIX: the refresh resolved; the view is caught up, then the pill goes on
RefreshDone ==
  /\ link = "syncing"
  /\ link' = "up"
  /\ pill' = "on"
  /\ view' = "current"
  /\ pending' = FALSE

Poll ==
  /\ view' = "current"
  /\ pending' = FALSE
  /\ UNCHANGED <<link, pill>>

Done ==
  /\ view = "current"
  /\ link = "up"
  /\ UNCHANGED vars

Next == Drop \/ Publish \/ Connect \/ RefreshDone \/ Poll \/ Done

Spec == Init /\ [][Next]_vars

LiveMeansCaughtUp == pill = "on" => view = "current"

PillMatchesLink == (pill = "on") <=> (link = "up")

TypeOK == link \in {"up", "down", "syncing"}

====
