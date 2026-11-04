---- MODULE Session ----

VARIABLES lease, phase, owner, sawStale, didReauth, sending

vars == <<lease, phase, owner, sawStale, didReauth, sending>>

Init ==
  /\ lease = "fresh"
  /\ phase = "active"
  /\ owner = "home"
  /\ sawStale = FALSE
  /\ didReauth = FALSE
  /\ sending = FALSE

Age ==
  /\ ~sending
  /\ phase = "active"
  /\ lease = "fresh"
  /\ lease' = "stale"
  /\ sawStale' = TRUE
  /\ UNCHANGED <<phase, owner, didReauth, sending>>

Reauth ==
  /\ ~sending
  /\ lease = "stale"
  /\ phase' = "reauth"
  /\ lease' = "fresh"
  /\ didReauth' = TRUE
  /\ UNCHANGED <<owner, sawStale, sending>>

Resume ==
  /\ ~sending
  /\ phase = "reauth"
  /\ lease = "fresh"
  /\ didReauth = TRUE
  /\ phase' = "active"
  /\ UNCHANGED <<lease, owner, sawStale, didReauth, sending>>

KeepAlive ==
  /\ phase = "active"
  /\ lease = "fresh"
  /\ ~sending
  /\ UNCHANGED vars

BeginSend ==
  /\ phase = "active"
  /\ lease = "fresh"
  /\ owner = "home"
  /\ ~sending
  /\ sending' = TRUE
  /\ UNCHANGED <<lease, phase, owner, sawStale, didReauth>>

EndSend ==
  /\ sending
  /\ sending' = FALSE
  /\ UNCHANGED <<lease, phase, owner, sawStale, didReauth>>

Done ==
  /\ ~sending
  /\ sawStale = TRUE
  /\ phase = "active"
  /\ lease = "fresh"
  /\ UNCHANGED vars

Next == Age \/ Reauth \/ Resume \/ KeepAlive \/ BeginSend \/ EndSend \/ Done

Spec == Init /\ [][Next]_vars

NoSendOnStaleLease == ~(sending /\ lease = "stale")

StaleSessionMustReauth ==
  sawStale /\ phase = "active" /\ lease = "fresh" => didReauth

====
