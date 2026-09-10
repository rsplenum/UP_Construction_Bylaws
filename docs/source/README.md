# Source text

`gazette-tmpr8.txt` is the flattened text of the UP Building Construction and Development
Byelaws 2025 (TMPR8, 4/9/25 version), extracted from the Word original supplied on
2026-09-10. Table cells are separated by `|` and rows by newlines, so the tables survive
the flattening well enough to read and grep.

It is checked in for one reason: **every figure in `src/domain` must be traceable to a
line in this file.** Without it, verification is a conversation rather than a check.

Look a rule up before changing it:

```bash
grep -n "Building Setbacks" docs/source/gazette-tmpr8.txt
sed -n '4426,4500p' docs/source/gazette-tmpr8.txt
```

When you verify a rule, record it in `docs/VERIFICATION-LOG.md`, set the rule's
`confidence` to `gazette` in `src/domain/rules/registry.ts`, and paste the clause into
its `quote`. A rule without a quote has not been checked.
