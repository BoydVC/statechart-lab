---- MODULE Oauth ----
EXTENDS Integers

VARIABLES phase, hasRefresh

vars == <<phase, hasRefresh>>

Init ==
  /\ phase = "none"
  /\ hasRefresh = FALSE

Exchange ==
  /\ phase = "none"
  /\ phase' = "fresh"
  /\ hasRefresh' \in BOOLEAN

Tick ==
  /\ phase = "fresh"
  /\ phase' = "expiring"
  /\ UNCHANGED hasRefresh

Expire ==
  /\ phase = "expiring"
  /\ phase' = "reauth"
  /\ UNCHANGED hasRefresh

Hold ==
  UNCHANGED vars

Next ==
  \/ Exchange
  \/ Tick
  \/ Expire
  \/ Hold

Spec == Init /\ [][Next]_vars

NoRefreshBeforeExchange ==
  phase = "none" => hasRefresh = FALSE

RefreshBeforeReauth ==
  phase = "reauth" => hasRefresh = FALSE

====
