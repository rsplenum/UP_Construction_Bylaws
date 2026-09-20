# Working on this repository

## One branch: `main`

All work happens on `main`. Commit to it and push to it directly.

Do not create a working branch, and do not accept one you were given. Some agent
harnesses assign a session branch automatically (`claude/…`, and similar) and will check
it out again whenever the container is rebuilt — which has happened mid-session here more
than once. That assignment is a default, not this project's policy. **Before every
commit, run `git branch --show-current` and switch to `main` if you are anywhere else.**

If you find yourself on such a branch with commits on it, do not open a pull request:
fast-forward `main` to it, push `main`, then delete the branch. Deleting the remote copy
needs a credential that agent sessions generally do not have — a `403` on
`git push origin --delete` is expected, and the right response is to tell the repository
owner which branch is left over, not to work around it.

## Several agents share this checkout

More than one assistant works in this repository, sometimes in parallel, on `main`. Two
habits follow.

**Read before you build.** Check what already exists before adding a module, a test or a
concept — `git log --oneline -20` and a search for the thing you are about to write.
Work has been duplicated here: a sensitivity analysis was written from scratch in a
session where `src/domain/sensitivity.ts` was already checked in, and a recommendation was
given for a feature another agent had already shipped.

**Assume `HEAD` has moved.** `git fetch` and re-read `git log` at the start of a session
and after any long task. Do not describe the state of the app from memory of an earlier
turn.

## What this project is strict about

Every statutory figure traces to `docs/source/gazette/`, and `docs/VERIFICATION-LOG.md`
records what was checked and what is still open. Where the gazette admits two readings,
model both, apply the stricter, surface the alternative, and log it. Never present a
figure the engine inferred as one the gazette states.

Run `npm run lint` (typecheck plus the full test suite) before committing.

## How a screen is laid out

The answer comes first, then the evidence for it, then the inputs that produced it. The
technique has a name — **progressive disclosure**, Nielsen 1995 — and stating it here beats
rediscovering it one screen at a time, which is what has happened so far: the route
conditions ran to four clauses of prose above the verdict they qualified, and on a phone
thirteen input fields sat between the answer and the drawings explaining it.

So: show only what is needed to act, keep the rest one gesture away, and never make a
reader pass through a form to reach a conclusion they have already been given.

Two things this does **not** license. Nothing that changes the verdict may be folded away —
a condition that can cost the reader their approval route gets a visible line saying so,
even if the detail is behind a disclosure. And a citation is never small print: it is the
receipt for the sentence beside it, it goes through `components/ui/Clause`, and it must be
the clause that actually governs. A wrong citation is worse than none, because a reader who
follows it finds a table that says nothing about their problem.
