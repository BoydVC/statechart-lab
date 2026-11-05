---- MODULE SilenceLive ----
EXTENDS Integers

VARIABLES phase, sockets

vars == <<phase, sockets>>

Init ==
  /\ phase = "off"
  /\ sockets = 0

Open ==
  /\ phase = "off"
  /\ sockets = 0
  /\ phase' = "live"
  /\ sockets' = 1

Silence ==
  /\ phase = "live"
  /\ phase' = "silent"
  /\ UNCHANGED sockets

Error ==
  /\ phase = "live"
  /\ phase' = "down"
  /\ UNCHANGED sockets

Reconnect ==
  /\ phase = "down"
  /\ sockets = 1
  /\ phase' = "live"
  /\ UNCHANGED sockets

Park ==
  /\ phase = "silent"
  /\ UNCHANGED vars

Next == Open \/ Silence \/ Error \/ Reconnect \/ Park

Spec == Init /\ [][Next]_vars

FairSpec == Spec /\ WF_vars(Next)

\* Liveness form of the bug: a silent stream eventually comes back live.
SilentLeadsToLive == (phase = "silent") ~> (phase = "live")

SilentStreamReconnects == phase # "silent"
AtMostOneSocket == sockets <= 1

====
