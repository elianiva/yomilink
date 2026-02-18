# ralph.sh
# Usage: ./ralph.sh <iterations>

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

# For each iteration, run Claude Code with the following prompt.
# This prompt is basic, we'll expand it later.
for ((i=1; i<=$1; i++)); do
  result=$(opencode run \
  --model "openrouter/minimax/minimax-m2.5" \
  --agent build \
"@prd.json @progress.md \
1. Decide which task to work on next \
This should be the one YOU decide has the highest priority - not necessarily the first in the list \
2. Check any feedback loops, such as types and tests \
3. Append your progress to the progress.md file \
4. Make a jj commit of that feature, use your jj skill to make a commit with description \
ONLY WORK ON A SINGLE FEATURE \
If, while implementing the feature, you notice that all work \
is complete, output <promise>COMPLETE</promise>")

  echo "$result"

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "PRD complete, exiting."
    exit 0
  fi
done

