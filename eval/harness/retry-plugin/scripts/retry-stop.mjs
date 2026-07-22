#!/usr/bin/env node
// Reality-Gap eval CONTROL ARM. Blocks every stop with a generic,
// information-free instruction. Deliberately: no acceptance check is run, no
// failure detail is revealed. The platform's consecutive-block cap bounds the
// session. Comparing this arm against Paranoid isolates what the
// developer-owned check's concrete feedback adds beyond forced persistence.
process.stderr.write(
  "The repository is not ready. Continue investigating and improving it " +
    "until you are confident it is ready to ship, then finish.\n",
);
process.exit(2);
