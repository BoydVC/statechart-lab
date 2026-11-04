---- MODULE Ingest ----
EXTENDS Integers

CONSTANT Tokenized

VARIABLES rows, changes, attempt, phase, threw

vars == <<rows, changes, attempt, phase, threw>>

Init ==
  /\ rows = 0
  /\ changes = 0
  /\ attempt = 0
  /\ phase = "ready"
  /\ threw = FALSE

Commit ==
  /\ phase = "ready"
  /\ attempt < 3
  /\ rows' = IF Tokenized THEN rows + 1 ELSE 1
  /\ changes' = IF Tokenized THEN changes + 1 ELSE 1
  /\ attempt' = attempt + 1
  /\ phase' = "callback"
  /\ UNCHANGED threw

CallbackThrows ==
  /\ phase = "callback"
  /\ threw = FALSE
  /\ threw' = TRUE
  /\ phase' = "ready"
  /\ UNCHANGED <<rows, changes, attempt>>

CallbackOk ==
  /\ phase = "callback"
  /\ phase' = "done"
  /\ UNCHANGED <<rows, changes, attempt, threw>>

GiveUp ==
  /\ phase = "ready"
  /\ attempt >= 3
  /\ phase' = "done"
  /\ UNCHANGED <<rows, changes, attempt, threw>>

Done ==
  /\ phase = "done"
  /\ UNCHANGED vars

Next == Commit \/ CallbackThrows \/ CallbackOk \/ GiveUp \/ Done

Spec == Init /\ [][Next]_vars

AtMostOneRow == rows <= 1

NoExtraChange == changes <= 1

====
