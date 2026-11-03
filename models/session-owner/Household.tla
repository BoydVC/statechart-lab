---- MODULE Household ----
\* Generic household session. One owner. Keep-alive, resume, or re-auth.
\* Send is enabled only while freshness is fresh. No product repo and no names.

VARIABLES phase, freshness, mode

vars == <<phase, freshness, mode>>

Init ==
  /\ phase = "signed-out"
  /\ freshness = "stale"
  /\ mode = "idle"

Claim ==
  /\ phase = "signed-out"
  /\ phase' = "fresh"
  /\ freshness' = "fresh"
  /\ mode' = "idle"

Age ==
  /\ phase = "fresh"
  /\ mode = "idle"
  /\ phase' = "aging"
  /\ freshness' = "aging"
  /\ UNCHANGED mode

Keep ==
  /\ phase \in {"fresh", "aging"}
  /\ mode = "idle"
  /\ phase' = "fresh"
  /\ freshness' = "fresh"
  /\ UNCHANGED mode

Stale ==
  /\ phase = "aging"
  /\ mode = "idle"
  /\ phase' = "stale"
  /\ freshness' = "stale"
  /\ UNCHANGED mode

Send ==
  /\ phase = "fresh"
  /\ freshness = "fresh"
  /\ mode = "idle"
  /\ phase' = "messaging"
  /\ mode' = "messaging"
  /\ UNCHANGED freshness

Stop ==
  /\ phase = "messaging"
  /\ phase' = "fresh"
  /\ mode' = "idle"
  /\ UNCHANGED freshness

Reauth ==
  /\ phase = "stale"
  /\ mode = "idle"
  /\ phase' = "reauth"
  /\ UNCHANGED <<freshness, mode>>

FinishReauth ==
  /\ phase = "reauth"
  /\ phase' = "fresh"
  /\ freshness' = "fresh"
  /\ mode' = "idle"

Next ==
  \/ Claim
  \/ Age
  \/ Keep
  \/ Stale
  \/ Send
  \/ Stop
  \/ Reauth
  \/ FinishReauth

Spec == Init /\ [][Next]_vars

FreshBeforeSend == (phase = "messaging") => (freshness = "fresh")
SignedOutIsIdle == (phase = "signed-out") => (mode = "idle")

====
