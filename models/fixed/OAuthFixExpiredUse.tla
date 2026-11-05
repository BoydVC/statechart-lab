---- MODULE OAuthFixExpiredUse ----
EXTENDS Integers

Accounts == {"desk", "phone"}

VARIABLES fileAccount, filePhase, fileGen, pending, usedExpired, clobbered

vars == <<fileAccount, filePhase, fileGen, pending, usedExpired, clobbered>>

Init ==
  /\ fileAccount = "none"
  /\ filePhase = "empty"
  /\ fileGen = 0
  /\ pending = [a \in Accounts |-> -1]
  /\ usedExpired = FALSE
  /\ clobbered = FALSE

StartDesk ==
  /\ pending["desk"] = -1
  /\ fileGen < 2
  /\ pending' = [pending EXCEPT !["desk"] = fileGen]
  /\ UNCHANGED <<fileAccount, filePhase, fileGen, usedExpired, clobbered>>

StartPhone ==
  /\ pending["phone"] = -1
  /\ fileGen < 2
  /\ pending' = [pending EXCEPT !["phone"] = fileGen]
  /\ UNCHANGED <<fileAccount, filePhase, fileGen, usedExpired, clobbered>>

FinishDesk ==
  /\ pending["desk"] >= 0
  /\ fileGen < 2
  /\ fileAccount' = "desk"
  /\ filePhase' = "fresh"
  /\ fileGen' = fileGen + 1
  /\ pending' = [pending EXCEPT !["desk"] = -1]
  /\ clobbered' = (clobbered \/ (pending["desk"] # fileGen))
  /\ UNCHANGED usedExpired

FinishPhone ==
  /\ pending["phone"] >= 0
  /\ fileGen < 2
  /\ fileAccount' = "phone"
  /\ filePhase' = "fresh"
  /\ fileGen' = fileGen + 1
  /\ pending' = [pending EXCEPT !["phone"] = -1]
  /\ clobbered' = (clobbered \/ (pending["phone"] # fileGen))
  /\ UNCHANGED usedExpired

Tick ==
  /\ filePhase \in {"fresh", "expiring"}
  /\ filePhase' = IF filePhase = "fresh" THEN "expiring" ELSE "expired"
  /\ UNCHANGED <<fileAccount, fileGen, pending, usedExpired, clobbered>>

UseDesk ==
  /\ filePhase \in {"fresh", "expiring"}  \* FIX: expired or missing expires_at -> null, no use
  /\ usedExpired' = (usedExpired \/ (filePhase = "expired"))
  /\ UNCHANGED <<fileAccount, filePhase, fileGen, pending, clobbered>>

UsePhone ==
  /\ filePhase \in {"fresh", "expiring"}  \* FIX: expired or missing expires_at -> null, no use
  /\ usedExpired' = (usedExpired \/ (filePhase = "expired"))
  /\ UNCHANGED <<fileAccount, filePhase, fileGen, pending, clobbered>>

Done ==
  /\ \/ fileGen >= 2
     \/ filePhase = "expired"
  /\ UNCHANGED vars

Next ==
  \/ StartDesk \/ StartPhone
  \/ FinishDesk \/ FinishPhone
  \/ UseDesk \/ UsePhone
  \/ Tick
  \/ Done

Spec == Init /\ [][Next]_vars

TokenFileCoherent == (filePhase = "empty") <=> (fileAccount = "none")

NotExpiredUse == usedExpired = FALSE

NoStaleClobber == clobbered = FALSE

====
