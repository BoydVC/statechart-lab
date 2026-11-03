---- MODULE Ingest ----
EXTENDS Integers
\* Upsert on (source, sourceId). A second copy of the same key does not add a row.

VARIABLES phase, rows

vars == <<phase, rows>>

Init ==
  /\ phase = "empty"
  /\ rows = 0

First ==
  /\ phase = "empty"
  /\ rows = 0
  /\ phase' = "stored"
  /\ rows' = 1

Again ==
  /\ phase = "stored"
  /\ rows = 1
  /\ phase' = "stored"
  /\ rows' = 1

Next == First \/ Again

Spec == Init /\ [][Next]_vars

OneRowPerKey == rows <= 1
RepeatStaysQuiet == (phase = "stored") => (rows = 1)

====
