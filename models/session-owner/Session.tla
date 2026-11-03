---- MODULE Session ----
EXTENDS Integers

VARIABLES owner, phase, age, lastSendAge

vars == <<owner, phase, age, lastSendAge>>

Init ==
  /\ owner = "none"
  /\ phase = "signed-out"
  /\ age = 0
  /\ lastSendAge = 0

Claim ==
  /\ owner = "none"
  /\ phase = "signed-out"
  /\ owner' = "holder"
  /\ phase' = "live"
  /\ age' = 0
  /\ UNCHANGED lastSendAge

KeepAlive ==
  /\ phase = "live"
  /\ age' = 0
  /\ UNCHANGED <<owner, phase, lastSendAge>>

Tick ==
  /\ phase = "live"
  /\ age < 3
  /\ age' = age + 1
  /\ UNCHANGED <<owner, phase, lastSendAge>>

GoStale ==
  /\ phase = "live"
  /\ age >= 2
  /\ phase' = "stale"
  /\ UNCHANGED <<owner, age, lastSendAge>>

Resume ==
  /\ phase = "stale"
  /\ owner = "holder"
  /\ age < 3
  /\ phase' = "live"
  /\ UNCHANGED <<owner, age, lastSendAge>>

NeedReauth ==
  /\ phase = "stale"
  /\ age >= 3
  /\ phase' = "reauth"
  /\ UNCHANGED <<owner, age, lastSendAge>>

FinishReauth ==
  /\ phase = "reauth"
  /\ owner' = "holder"
  /\ phase' = "live"
  /\ age' = 0
  /\ UNCHANGED lastSendAge

Send ==
  /\ phase = "live"
  /\ age < 2
  /\ lastSendAge' = age
  /\ UNCHANGED <<owner, phase, age>>

Hold ==
  UNCHANGED vars

Next ==
  \/ Claim
  \/ KeepAlive
  \/ Tick
  \/ GoStale
  \/ Resume
  \/ NeedReauth
  \/ FinishReauth
  \/ Send
  \/ Hold

Spec == Init /\ [][Next]_vars

SingleOwner ==
  owner \in {"none", "holder"}

FreshBeforeSend ==
  lastSendAge < 2

====
