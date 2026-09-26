# harness/checkpoints — retrospectives per checkpoint

One Markdown file per checkpoint, `cp-<iteration>.md`, mirroring the `checkpoints` document in
Atlas (sha, tag, policy version, metrics, retrospective). The improver (`@3pt/improver`) writes the
document; the CLI mirrors it here. Plan reads it. `3pt rollback cp/<n>` reads it to find the policy
version. `--git` commits it with the tag.
