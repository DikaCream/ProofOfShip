# Official maintainer notice for tally-cli 1.0.0 (supersedes the blog post)

This file is a stable test fixture for ProofOfShip.

Correction: the --json flag described in the launch blog post was removed before the release build and is NOT part of tally-cli 1.0.0.
Running tally export --json on the published 1.0.0 package prints "unknown flag: --json". JSON output is planned for a later version.
CSV export and the npm installation instructions in the README are unaffected and shipped as described.
