---- MODULE OAuthFixStaleWrite ----
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

\* FIX: write only if the generation stamped at start is still current
FinishDesk ==
  /\ pending["desk"] >= 0
  /\ fileGen < 2
  /\ pending["desk"] = fileGen
  /\ fileAccount' = "desk"
  /\ filePhase' = "fresh"
  /\ fileGen' = fileGen + 1
  /\ pending' = [pending EXCEPT !["desk"] = -1]
  /\ clobbered' = (clobbered \/ (pending["desk"] # fileGen))
  /\ UNCHANGED usedExpired

\* FIX: a stale flow drops its token instead of writing it
AbandonDesk ==
  /\ pending["desk"] >= 0
  /\ pending["desk"] # fileGen
  /\ pending' = [pending EXCEPT !["desk"] = -1]
  /\ UNCHANGED <<fileAccount, filePhase, fileGen, usedExpired, clobbered>>

\* FIX: write only if the generation stamped at start is still current
FinishPhone ==
  /\ pending["phone"] >= 0
  /\ fileGen < 2
  /\ pending["phone"] = fileGen
  /\ fileAccount' = "phone"
  /\ filePhase' = "fresh"
  /\ fileGen' = fileGen + 1
  /\ pending' = [pending EXCEPT !["phone"] = -1]
  /\ clobbered' = (clobbered \/ (pending["phone"] # fileGen))
  /\ UNCHANGED usedExpired

\* FIX: a stale flow drops its token instead of writing it
AbandonPhone ==
  /\ pending["phone"] >= 0
  /\ pending["phone"] # fileGen
  /\ pending' = [pending EXCEPT !["phone"] = -1]
  /\ UNCHANGED <<fileAccount, filePhase, fileGen, usedExpired, clobbered>>

Tick ==
  /\ filePhase \in {"fresh", "expiring"}
  /\ filePhase' = IF filePhase = "fresh" THEN "expiring" ELSE "expired"
  /\ UNCHANGED <<fileAccount, fileGen, pending, usedExpired, clobbered>>

UseDesk ==
  /\ filePhase # "empty"
  /\ usedExpired' = (usedExpired \/ (filePhase = "expired"))
  /\ UNCHANGED <<fileAccount, filePhase, fileGen, pending, clobbered>>

UsePhone ==
  /\ filePhase # "empty"
  /\ usedExpired' = (usedExpired \/ (filePhase = "expired"))
  /\ UNCHANGED <<fileAccount, filePhase, fileGen, pending, clobbered>>

Done ==
  /\ \/ fileGen >= 2
     \/ filePhase = "expired"
  /\ UNCHANGED vars

Next ==
  \/ StartDesk \/ StartPhone
  \/ FinishDesk \/ FinishPhone
  \/ AbandonDesk \/ AbandonPhone
  \/ UseDesk \/ UsePhone
  \/ Tick
  \/ Done

Spec == Init /\ [][Next]_vars

TokenFileCoherent == (filePhase = "empty") <=> (fileAccount = "none")

NotExpiredUse == usedExpired = FALSE

NoStaleClobber == clobbered = FALSE

====
