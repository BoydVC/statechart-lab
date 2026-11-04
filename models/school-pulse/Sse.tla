---- MODULE Sse ----

VARIABLES link, pill, pending, view

vars == <<link, pill, pending, view>>

Init ==
  /\ link = "up"
  /\ pill = "on"
  /\ pending = FALSE
  /\ view = "current"

Drop ==
  /\ link = "up"
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

Connect ==
  /\ link = "down"
  /\ link' = "up"
  /\ pill' = "on"
  /\ UNCHANGED <<pending, view>>

Poll ==
  /\ view' = "current"
  /\ pending' = FALSE
  /\ UNCHANGED <<link, pill>>

Done ==
  /\ view = "current"
  /\ link = "up"
  /\ UNCHANGED vars

Next == Drop \/ Publish \/ Connect \/ Poll \/ Done

Spec == Init /\ [][Next]_vars

LiveMeansCaughtUp == pill = "on" => view = "current"

PillMatchesLink == (pill = "on") <=> (link = "up")

====
