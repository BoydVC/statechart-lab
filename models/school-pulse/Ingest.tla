---- MODULE Ingest ----
EXTENDS Integers

VARIABLES rowsA, rowsB, triesA, triesB

vars == <<rowsA, rowsB, triesA, triesB>>

Init ==
  /\ rowsA = 0
  /\ rowsB = 0
  /\ triesA = 0
  /\ triesB = 0

IngestA ==
  /\ triesA < 2
  /\ triesA' = triesA + 1
  /\ rowsA' = 1
  /\ UNCHANGED <<rowsB, triesB>>

IngestB ==
  /\ triesB < 2
  /\ triesB' = triesB + 1
  /\ rowsB' = 1
  /\ UNCHANGED <<rowsA, triesA>>

Hold ==
  UNCHANGED vars

Next ==
  \/ IngestA
  \/ IngestB
  \/ Hold

Spec == Init /\ [][Next]_vars

OneRowPerKey ==
  rowsA <= 1 /\ rowsB <= 1

NoRowWithoutDelivery ==
  (rowsA = 1 => triesA >= 1) /\ (rowsB = 1 => triesB >= 1)

====
