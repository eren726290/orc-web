# Gates: upstream pen diagnostics

OWNS: plans/**

Scope: run all three previously ignored SolidCraft measurements at the pinned revision, interpret every result, and preserve both ORC worktrees.

- [x] G1: pinned source and compiler identities match the experiment
  CHECK: python3 /home/eren/.cache/orc-pen-diagnostics/20261025/verify.py identity
  EXPECT: IDENTITY_VERIFIED
  EVIDENCE: automatic-evidence=v1; definition-sha256=b96c7af671b5c387fe9b881d3e1d7036bb526ebf21be6cebe8ec70286201d8a9; exit=0; EXPECT=matched; output-sha256=1cbc86e531cdf4ae21fffe8024494d2096fff9f6e64847f46b6c353842f804cd; output-bytes=267; shell=/bin/sh; cwd=/home/eren/.cache/orc-pen-diagnostics/20261025; path=8ecd5a3d607e/18 entries

- [x] G2: all three named diagnostics execute individually and their outcomes are retained
  CHECK: python3 /home/eren/.cache/orc-pen-diagnostics/20261025/verify.py results
  EXPECT: RESULTS_RECORDED
  EVIDENCE: automatic-evidence=v1; definition-sha256=a8ddcba69996f5f000c3889618e472e64afe59892a2cd48f224ff00bcc5c4fb6; exit=0; EXPECT=matched; output-sha256=49876126f82662632e0460cde3df0162c0ae9e5dbd13ef86e22967a9931d28cf; output-bytes=362; shell=/bin/sh; cwd=/home/eren/.cache/orc-pen-diagnostics/20261025; path=8ecd5a3d607e/18 entries

- [x] G3: printed counters are interpreted against upstream source and limitations are reported
  EVIDENCE: Reviewed pinned construct_rounds_tests.rs:455-525, continuation_tests.rs:196-293, and decompose_tests.rs:1004-1075 against every retained measurement row and the enabled control. See pen-diagnostic-results.md sections 1-3. The report distinguishes 30/183 disabled-helper failures, zero unexplained continuation cases, and 73 unclassified direct-solve failures without equating the two datasets.

- [x] G4: both worktrees retain their original files and HEAD outside temporary plans
  CHECK: python3 /home/eren/.cache/orc-pen-diagnostics/20261025/scope.py check
  EXPECT: SCOPE_UNCHANGED
  EVIDENCE: automatic-evidence=v1; definition-sha256=b89fd2fe03f3e93f699a63895a88a58598b858e4794e28c287e1c2b431a44440; exit=0; EXPECT=matched; output-sha256=c4fa291a75a001cf48a51352d673a0c73bab027ef9c3f15bfd86cfb74ff38c83; output-bytes=79; shell=/bin/sh; cwd=/home/eren/.cache/orc-pen-diagnostics/20261025; path=8ecd5a3d607e/18 entries
