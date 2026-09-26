# harness/policies — the harness's own rules, as data

One JSON file per policy version, `v<n>.json`, matching `Policy` in `@3pt/core`. The `policies`
collection in Atlas is the source of truth at runtime; this directory is the git-native mirror
so a checkpoint (git tag + Atlas document) can be rolled back with one command.

`v0.json` is the seed (`seedPolicy()` in `harness/packages/core`). Every later file is written by
the improver (`@3pt/improver`) after a run, and the CLI mirrors it here (`3pt loop`, `3pt improve`),
or by `3pt rollback`. Never by hand, never by a stage. That rewrite is the Recursive Harnessing proof.
`3pt loop --git` also commits the file and tags `cp/<n>`. The next run starts from the highest version
here or in the store.
