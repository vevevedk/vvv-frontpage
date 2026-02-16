#!/usr/bin/env bash
# start-coders.sh — Launch two Claude Code agents in tmux using git worktrees
#
# Usage: ./scripts/start-coders.sh
#
# Creates git worktrees for isolated parallel work:
#   ../vvv-dk  (branch: veveve-dk-work)  — Danish marketing site agent
#   ../vvv-io  (branch: veveve-io-work)  — International SaaS platform agent
#
# Then launches a tmux session "vvv-coders" with one window per agent.

set -euo pipefail

command -v tmux >/dev/null 2>&1 || { echo "Error: tmux is not installed"; exit 1; }

SESSION="vvv-coders"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

DK_WORKTREE="$PROJECT_DIR/../vvv-dk"
IO_WORKTREE="$PROJECT_DIR/../vvv-io"
DK_BRANCH="veveve-dk-work"
IO_BRANCH="veveve-io-work"

# Write prompts to temp files to avoid quoting issues with send-keys
DK_PROMPT_FILE="$(mktemp)"
IO_PROMPT_FILE="$(mktemp)"
trap 'rm -f "$DK_PROMPT_FILE" "$IO_PROMPT_FILE"' EXIT

cat > "$DK_PROMPT_FILE" << 'EOF'
You are the veveve.dk coder agent. Your focus area is the Danish agency marketing site (veveve.dk).

Start by reading your work log at docs/worklogs/veveve-dk.md — it contains your roadmap, priorities, and notes from previous sessions. If the file doesn't exist, create it with the project's current state and priorities.

Also check:
- docs/archive/ for any relevant context
- Recent git log for what changed recently
- The Claude memory files for project conventions

Then pick up the highest-priority incomplete task from your work log and start working on it. When you finish a task, update the work log with what you did and what comes next.

Focus areas: Danish marketing pages, SEO, content, local business targeting, /kontakt /om-os /priser /ydelser routes.
Do NOT touch veveve.io-specific code (English frontpage, SaaS platform pages, international content).
EOF

cat > "$IO_PROMPT_FILE" << 'EOF'
You are the veveve.io coder agent. Your focus area is the international SaaS platform (veveve.io).

Start by reading your work log at docs/worklogs/veveve-io.md — it contains your roadmap, priorities, and notes from previous sessions. If the file doesn't exist, create it with the project's current state and priorities.

Also check:
- docs/archive/veveve_website_review.md for the staging site review
- docs/archive/BRAINSTORM_VEVEVE_IO.md for the project brainstorm
- Recent git log for what changed recently
- The Claude memory files for project conventions

Then pick up the highest-priority incomplete task from your work log and start working on it. When you finish a task, update the work log with what you did and what comes next.

Focus areas: English SaaS frontpage, placeholder text removal, case studies, pricing page, product messaging, international SEO.
Do NOT touch veveve.dk-specific code (Danish marketing pages, /kontakt /om-os /priser /ydelser routes).
EOF

# --- Set up git worktrees ---

setup_worktree() {
    local worktree="$1" branch="$2"

    # Create branch from main if it doesn't exist
    if ! git -C "$PROJECT_DIR" show-ref --verify --quiet "refs/heads/$branch"; then
        echo "Creating branch $branch from main..."
        git -C "$PROJECT_DIR" branch "$branch" main
    fi

    # Create worktree if it doesn't exist
    if [ ! -d "$worktree" ]; then
        echo "Creating worktree at $worktree ($branch)..."
        git -C "$PROJECT_DIR" worktree add "$worktree" "$branch"
    else
        echo "Worktree $worktree already exists, updating..."
        git -C "$worktree" checkout "$branch" 2>/dev/null || true
    fi
}

setup_worktree "$DK_WORKTREE" "$DK_BRANCH"
setup_worktree "$IO_WORKTREE" "$IO_BRANCH"

echo "Worktrees ready."

# --- Launch tmux session ---

# Kill existing session if it exists
tmux kill-session -t "$SESSION" 2>/dev/null || true

# Create session with first window for veveve.dk
tmux new-session -d -s "$SESSION" -n "veveve-dk" -c "$DK_WORKTREE"
tmux send-keys -t "$SESSION:veveve-dk" "claude --print-session-id -p \"\$(cat '$DK_PROMPT_FILE')\"" Enter

# Create second window for veveve.io
tmux new-window -t "$SESSION" -n "veveve-io" -c "$IO_WORKTREE"
tmux send-keys -t "$SESSION:veveve-io" "claude --print-session-id -p \"\$(cat '$IO_PROMPT_FILE')\"" Enter

# Attach to the session
tmux attach-session -t "$SESSION"
