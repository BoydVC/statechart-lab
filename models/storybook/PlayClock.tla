---- MODULE PlayClock ----
EXTENDS Integers

VARIABLES phase, left, frozen

vars == <<phase, left, frozen>>

Init ==
  /\ phase = "ready"
  /\ left = 2
  /\ frozen = 0

Start ==
  /\ phase = "ready"
  /\ left > 0
  /\ phase' = "running"
  /\ UNCHANGED <<left, frozen>>

Tick ==
  /\ phase = "running"
  /\ left > 0
  /\ left' = left - 1
  /\ UNCHANGED <<phase, frozen>>

Timeout ==
  /\ phase = "running"
  /\ phase' = "timeout"
  /\ frozen' = left
  /\ UNCHANGED left

Resume ==
  /\ phase = "timeout"
  /\ phase' = "running"
  /\ UNCHANGED <<left, frozen>>

Expire ==
  /\ phase = "running"
  /\ left = 0
  /\ phase' = "expired"
  /\ UNCHANGED <<left, frozen>>

Snap ==
  /\ phase = "running"
  /\ left > 0
  /\ phase' = "snapped"
  /\ UNCHANGED <<left, frozen>>

Done ==
  /\ phase \in {"expired", "snapped"}
  /\ UNCHANGED vars

Next == Start \/ Tick \/ Timeout \/ Resume \/ Expire \/ Snap \/ Done

Spec == Init /\ [][Next]_vars

NoSnapAtZero == ~ (phase = "snapped" /\ left = 0)
TimeoutFreezes == (phase = "timeout") => (left = frozen)

====
