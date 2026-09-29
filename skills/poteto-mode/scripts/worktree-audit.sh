#!/usr/bin/env bash
# Read-only audit using local Git refs. Usage: worktree-audit.sh [repo-path] [base-ref]
set -u

repo="${1:-$(git rev-parse --show-toplevel 2>/dev/null)}"
[ -z "$repo" ] && { echo "not in a git repo; pass a repo path" >&2; exit 1; }
cd "$repo" || exit 1

git rev-parse --git-dir >/dev/null 2>&1 || { echo "not in a git repo" >&2; exit 1; }

base="${2:-}"
if [ -z "$base" ]; then
	default_ref=$(git symbolic-ref --quiet refs/remotes/origin/HEAD 2>/dev/null || true)
	default_branch=${default_ref#refs/remotes/origin/}
	for candidate in "refs/heads/$default_branch" "$default_ref" refs/heads/main refs/heads/master; do
		if [ -n "$candidate" ] && git rev-parse --verify --quiet "${candidate}^{commit}" >/dev/null; then
			base=$candidate
			break
		fi
	done
fi
base_head=""
if [ -n "$base" ]; then base_head=$(git rev-parse --verify --quiet "${base}^{commit}" 2>/dev/null || true); fi
printf 'Base: %s (local refs only)\n' "${base:-unknown; pass a base-ref}" >&2

now=$(date +%s)

printf "SIZE\tAGE\tIN_BASE\tDIRTY\tLAST_CHAT\tBUCKET\tWORKTREE\n"

main_wt=""
while IFS= read -r -d '' field; do
	case "$field" in 'worktree '*) wt=${field#worktree } ;; *) continue ;; esac
	if [ -z "$main_wt" ]; then main_wt=$wt; continue; fi

	size=$(du -sh "$wt" 2>/dev/null | awk '{print $1}')
	head=$(git -C "$wt" rev-parse --verify HEAD 2>/dev/null)
	head_ts=$(git -C "$wt" log -1 --format='%ct' HEAD 2>/dev/null || echo 0)
	age=$([ "$head_ts" -gt 0 ] 2>/dev/null && echo "$(( (now - head_ts) / 86400 ))d" || echo "?")

	in_base=unknown
	if [ -n "$head" ] && [ -n "$base_head" ]; then
		git merge-base --is-ancestor "$head" "$base_head" 2>/dev/null
		case $? in 0) in_base=YES ;; 1) in_base=no ;; esac
	fi

	if ! porcelain=$(git -C "$wt" status --porcelain --untracked-files=all 2>/dev/null); then dirty=unknown
	elif [ -z "$porcelain" ]; then dirty=clean
	elif printf '%s\n' "$porcelain" | grep -qv '^??'; then
		dirty="wip:$(printf '%s\n' "$porcelain" | grep -cv '^??')"
	else dirty="untracked:$(printf '%s\n' "$porcelain" | grep -c '^??')"; fi

	case "$dirty" in
		wip:*) bucket=hold-wip ;;
		untracked:*) bucket=hold-untracked ;;
		clean) if [ "$in_base" = YES ]; then bucket=verify-session; else bucket=review; fi ;;
		*) bucket=review ;;
	esac

	printf "%s\t%s\t%s\t%s\t%s\t%s\t%s\n" \
		"${size:-?}" "$age" "$in_base" "$dirty" unknown "$bucket" "$wt"
done < <(git worktree list --porcelain -z) | sort -t$'\t' -k1,1 -rh
