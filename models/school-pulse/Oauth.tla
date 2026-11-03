---- MODULE Oauth ----
\* Token lifecycle as school-pulse implements it.
\* readToken returns access_token and never reads expires_at.

VARIABLES phase, expired, hasToken

vars == <<phase, expired, hasToken>>

Init ==
  /\ phase = "none"
  /\ expired = FALSE
  /\ hasToken = FALSE

Exchange ==
  /\ phase = "none"
  /\ phase' = "fresh"
  /\ expired' = FALSE
  /\ hasToken' = TRUE

Age ==
  /\ phase = "fresh"
  /\ hasToken = TRUE
  /\ phase' = "expired"
  /\ expired' = TRUE
  /\ UNCHANGED hasToken

Sync ==
  /\ hasToken = TRUE
  /\ phase \in {"fresh", "expired"}
  /\ phase' = "syncing"
  /\ UNCHANGED <<expired, hasToken>>

Finish ==
  /\ phase = "syncing"
  /\ phase' = IF expired THEN "expired" ELSE "fresh"
  /\ UNCHANGED <<expired, hasToken>>

Reauth ==
  /\ phase \in {"none", "fresh", "expired"}
  /\ phase' = "reauth"
  /\ UNCHANGED <<expired, hasToken>>

Store ==
  /\ phase = "reauth"
  /\ phase' = "fresh"
  /\ expired' = FALSE
  /\ hasToken' = TRUE

Next ==
  \/ Exchange
  \/ Age
  \/ Sync
  \/ Finish
  \/ Reauth
  \/ Store

Spec == Init /\ [][Next]_vars

ExpiredTokenNotUsed == ~ (phase = "syncing" /\ expired = TRUE)
NoSyncWithoutToken == (phase = "syncing") => (hasToken = TRUE)

====
