Compose a prompt for a new session task to do the indicated work item.
Include all the context someone would need, both practical code files and cdocs.
The prompt should always include an instruction to read project_management/manifest.md.
The prompt should include only the cdocs relevant to the task — do not load all cdocs. Use the table below to decide which to include:

| Task involves... | Load these cdocs |
|-----------------|-----------------|
| Character sets / pool logic | `cdocs/character-pool.md` |
| Score, goal, upgrade config / table | `cdocs/game-state.md` |
| Upgrade purchase / key / auto-score logic | `cdocs/upgrades.md` |
| Typing input / game loop / completion mode | `cdocs/input.md` |
| UI / DOM layout / display rendering | `cdocs/display.md` |
| Save / load / serialization | `cdocs/persistence.md` |
| Code style / conventions | `standards/style.md` |
| Architecture / module boundaries | `standards/architecture.md` |

Where applicable, the prompt should indicate that project_management/standards/style.md should be followed when coding.
Where the task involves creating new files, adding imports, or changing module responsibilities, the prompt should indicate that project_management/standards/architecture.md should be read before planning.
If there are management decisions that need to be made before the prompt can be created, ask the user, don't decide yourself.
The prompt should indicate that the plan must be presented first, before code changes.
Every prompt that involves code changes should include the following linter/compiler compliance block verbatim:

> After any complete code change, run `npx biome check src/` and `npm run build`. Both must pass.
> When the linter or compiler flags an issue, fix the underlying problem — do not suppress or work around it. If the linter warns about a non-null assertion (`!`), add a type guard or early return that narrows the type naturally. Do not swap `!` for `?.` when the types don't support it, and do not add `// biome-ignore`. The goal is to understand *why* the tool is complaining and write code that satisfies the constraint cleanly.
The prompt should indicate the following workflow item in addition to the task definition:

- Run this checklist after the user has declared the task done (make it clear to run this after completion is externally confirmed, not when it thinks it's done.):

    1. **status.md** — remove the item from Open; add any newly discovered open items.
    2. **manifest.md** — add a row for every new file created; remove rows for deleted files.
    3. **context docs** — Read cdoc.md. Update appropriate context documents.
    4. **response to user** - Remind the user to make a git commit

Indicate the Claude model best suited for the task, not as part of the prompt.
The created prompt should be output to the user, not a markdown doc.
