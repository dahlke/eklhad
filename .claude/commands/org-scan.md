# Org Content Scan

Scan this personal repo for content that belongs to an organization, not a personal project.
Run this before pushing, or any time org-specific tooling has been in use in this session.

## What counts as org-specific

- LangChain operational: secrets (`LANGSMITH_API_KEY`, `LANGCHAIN_API_KEY`), email `neil@langchain.dev`
- Work MCP servers in `.claude/` files: `gtm-agent`, `linear-server`, `hex`, `slack` (and their `mcp__*` tool permissions)
- Generic secrets: API keys, bearer tokens, passwords in any file
- `.claude/settings.json` or `.claude/settings.local.json` staged for commit

## What is intentionally fine

- Resume content mentioning LangChain as an employer (`web/frontend/conf/resume.json`, rendered HTML)
- `github` in `enabledMcpjsonServers` (personal repo tooling)

## Steps

1. Check `.claude/settings.local.json` for work MCP servers in `enabledMcpjsonServers` and `mcp__*` permissions that are not `github` or `notion-fetch` for personal use.

2. Run the pre-commit hook manually against the full working tree (not just staged):
   ```bash
   bash scripts/hooks/pre-commit
   ```

3. Search tracked files for org patterns:
   ```bash
   grep -rn "langchain\.dev\|LANGSMITH_API_KEY\|LANGCHAIN_API_KEY\|gtm-agent\|linear-server" \
     --include="*.json" --include="*.md" --include="*.sh" --include="*.py" \
     --exclude-dir=node_modules .
   ```

4. Confirm `.claude/settings.local.json` is gitignored:
   ```bash
   git check-ignore -v .claude/settings.local.json
   ```

5. Report: list any findings with file:line, or confirm the repo is clean.
