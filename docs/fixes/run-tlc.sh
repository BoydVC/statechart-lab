#!/usr/bin/env bash
# Re-run every original (expect violation) and fixed (expect clean) model.
# Usage: TLA2TOOLS=/path/to/tla2tools.jar docs/fixes/run-tlc.sh  (from repo root)
set -u
JAR=${TLA2TOOLS:-tla2tools.jar}
ROOT=$(pwd); WORK=$(mktemp -d)
[ -n "${LOGDIR:-}" ] && mkdir -p "$LOGDIR"
# bug | orig dir | orig module | invariant/property | orig cfg extra | fixed module | fixed cfg
cat > "$WORK/rows" <<'R'
oauth-expired-use|school-pulse|OAuth|INVARIANT NotExpiredUse||OAuthFixExpiredUse|OAuthFixExpiredUse
oauth-stale-write|school-pulse|OAuth|INVARIANT NoStaleClobber||OAuthFixStaleWrite|OAuthFixStaleWrite
ingest-clock-retry|school-pulse|Ingest|INVARIANT AtMostOneRow|CONSTANT Tokenized = TRUE|IngestFixed|IngestFixClockRetry
ingest-clock-change|school-pulse|Ingest|INVARIANT NoExtraChange|CONSTANT Tokenized = TRUE|IngestFixed|IngestFixClockChange
sse-reconnect-gap|school-pulse|Sse|INVARIANT LiveMeansCaughtUp||SseFixed|SseFixed
sse-silent-stream|school-pulse|Silence|INVARIANT SilentStreamReconnects||SilenceFixed|SilenceFixed
sse-silent-stream (liveness)|fixed|SilenceLive|PROPERTY SilentLeadsToLive||SilenceFixed|SilenceFixed
queue-stale-posted|post-queue|Queue|INVARIANT RevokeSticks||QueueFixed|QueueFixed
pq-posted-skips-cue|post-queue|Status|INVARIANT ScheduledBeforePosted||StatusFixPostedSkipsCue|StatusFixPostedSkipsCue
pq-skip-after-post|post-queue|Status|INVARIANT SkipOnlyBeforePost||StatusFixSkipAfterPost|StatusFixSkipAfterPost
combined: oauth|fixed|OAuthFixed|-||OAuthFixed|OAuthFixed
combined: status|fixed|StatusFixed|-||StatusFixed|StatusFixed
R
tlc() { # dir module cfg -> "verdict|distinct|generated|depth"
  local out; out=$(cd "$1" && java -XX:+UseParallelGC -cp "$JAR" tlc2.TLC -deadlock -workers 1 -metadir "$WORK/meta$RANDOM" -config "$3.cfg" "$2" 2>&1)
  local v=ERROR
  grep -q "No error has been found" <<<"$out" && v=PASS
  grep -q "violated" <<<"$out" && v="FAIL ($(grep -o 'Invariant [A-Za-z]* is violated\|Temporal properties were violated' <<<"$out" | head -1))"
  local s; s=$(grep -o '[0-9]* states generated, [0-9]* distinct states found' <<<"$out" | tail -1)
  local d; d=$(grep -o 'depth of the complete state graph search is [0-9]*' <<<"$out" | grep -o '[0-9]*$')
  echo "$v|$(awk '{print $1}' <<<"$s")|$(awk '{print $4}' <<<"$s")|${d:-n/a}"
  [ -n "${LOGDIR:-}" ] && echo "$out" | grep -v '^Running\|^Starting\|^Finished in\|at 20[0-9][0-9]-\|^Parsing\|^Semantic\|^Linting\|^Checking\|seed\|^TLC2\|metadir\|fingerprint\|^The coverage' > "$LOGDIR/$4.log"
}
echo "| Bug | Original model | Original result | Gen / distinct states | Fixed model | Fixed result | Gen / distinct states | Depth |"
echo "| --- | --- | --- | --- | --- | --- | --- | --- |"
while IFS='|' read -r bug dir mod chk extra fmod fcfg; do
  if [ "$chk" != "-" ]; then
    od="$WORK/o-$RANDOM"; mkdir -p "$od"; cp "$ROOT/models/$dir/$mod.tla" "$od/"
    printf 'SPECIFICATION %s\n%s\n%s\n' "$( [ "$mod" = SilenceLive ] && echo FairSpec || echo Spec)" "$extra" "$chk" > "$od/check.cfg"
    IFS='|' read -r ov og odist _ <<<"$(tlc "$od" "$mod" check "orig-${bug//[^a-z-]/_}")"
  else ov="(n/a)"; og="-"; odist="-"; fi
  fd="$WORK/f-$RANDOM"; mkdir -p "$fd"; cp "$ROOT/models/fixed/$fmod.tla" "$fd/"; cp "$ROOT/models/fixed/$fcfg.cfg" "$fd/"
  IFS='|' read -r fv fg fdist fdep <<<"$(tlc "$fd" "$fmod" "$fcfg" "fixed-${bug//[^a-z-]/_}")"
  echo "| $bug | $dir/$mod | $ov | $og / $odist | fixed/$fmod ($fcfg.cfg) | $fv | $fg / $fdist | $fdep |"
done < "$WORK/rows"
