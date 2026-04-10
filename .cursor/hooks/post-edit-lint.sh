#!/bin/bash
# Runs ESLint on the just-edited file and surfaces errors as agent context.
# Triggered by afterFileEdit for Write and StrReplace tool uses.

input=$(cat)

# Extract the file path from the tool input (supports both Write and StrReplace payloads)
file_path=$(echo "$input" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    path = (data.get('tool_input') or data.get('input') or {}).get('path', '')
    print(path)
except Exception:
    print('')
" 2>/dev/null)

# Only lint TypeScript/TSX files
if [[ -z "$file_path" ]] || [[ "$file_path" != *.ts && "$file_path" != *.tsx ]]; then
  exit 0
fi

# Resolve absolute path (hook cwd is project root)
if [[ "$file_path" != /* ]]; then
  file_path="$(pwd)/$file_path"
fi

# Check the file exists
if [[ ! -f "$file_path" ]]; then
  exit 0
fi

# Run ESLint — capture output, suppress exit code
lint_output=$(pnpm --silent eslint --max-warnings 0 "$file_path" 2>&1)
lint_exit=$?

if [[ $lint_exit -ne 0 ]] && [[ -n "$lint_output" ]]; then
  # Return lint errors as additional context so the agent sees and fixes them
  escaped=$(echo "$lint_output" | python3 -c "
import sys, json
print(json.dumps(sys.stdin.read()))
" 2>/dev/null)
  echo "{\"additional_context\": \"ESLint found issues in the edited file that must be fixed:\\n$lint_output\"}"
fi

exit 0
