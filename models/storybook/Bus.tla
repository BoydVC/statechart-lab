---- MODULE Bus ----

VARIABLES phase, boarded

vars == <<phase, boarded>>

Init ==
  /\ phase = "home"
  /\ boarded = FALSE

Walk ==
  /\ phase = "home"
  /\ phase' = "waiting"
  /\ UNCHANGED boarded

Board ==
  /\ phase = "waiting"
  /\ phase' = "boarded"
  /\ boarded' = TRUE

Ride ==
  /\ phase = "boarded"
  /\ phase' = "riding"
  /\ UNCHANGED boarded

Arrive ==
  /\ phase = "riding"
  /\ boarded = TRUE
  /\ phase' = "school"
  /\ UNCHANGED boarded

Done ==
  /\ phase = "school"
  /\ UNCHANGED vars

Next == Walk \/ Board \/ Ride \/ Arrive \/ Done

Spec == Init /\ [][Next]_vars

ArriveAfterBoarding == (phase = "school") => boarded
NoRideBeforeBoard == ~ (phase = "riding" /\ boarded = FALSE)

====
