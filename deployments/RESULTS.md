# ProofOfShip on-chain e2e results (GenLayer Studionet)

Contract: [`0x85B483C43FF276901eeCD1D7975a549d07C1cc02`](https://explorer-studio.genlayer.com/address/0x85B483C43FF276901eeCD1D7975a549d07C1cc02) · chain 61999 · generated 2026-10-21T01:45:53.329Z by `node scripts/results.mjs`.

Every write below was submitted with genlayer-js, then polled until the transaction reached FINALIZED. Failed attempts (validator errors, retried by the script) are listed honestly.

Files named *-attempt1 are kept as an honest record of first runs that did not pass: uncompleted-attempt1 used a 60 s review window that expired while validators were still judging (the contract correctly refused the late judge); changed-attempt1 was judged while the raw.githubusercontent CDN still served the old page to validators, so no change was observable. Both were rerun as uncompleted and changed-b.

| Scenario | Txs | All FINALIZED | Checks passed |
|---|---|---|---|
| [reject](#reject) | 4 | yes | 4/4 |
| [shipped](#shipped) | 9 | yes | 12/12 |
| [partial](#partial) | 7 | yes | 10/10 |
| [missed](#missed) | 7 | yes | 6/6 |
| [overturn](#overturn) | 8 | yes | 11/11 |
| [inconclusive](#inconclusive) | 8 | yes | 10/10 |
| [uncompleted](#uncompleted) | 9 | yes | 7/7 |
| [overlap](#overlap) | 8 | yes | 11/11 |
| [concurrent](#concurrent) | 8 | yes | 8/8 |
| [changed-b](#changed-b) | 4 | yes | 9/9 |
| [uncompleted-attempt1](#uncompleted-attempt1) | 8 | NO | 3/4 ⚠ |
| [changed-attempt1](#changed-attempt1) | 8 | yes | 7/9 ⚠ |

## reject

2026-10-21T01:14:19.930Z → 2026-10-21T01:17:31.251Z

| Step | Actor | Result | Final | Tx |
|---|---|---|---|---|
| claim_points (builder) | builder | ACCEPTED/SUCCESS | FINALIZED | [0x9510aa05…893d69](https://explorer-studio.genlayer.com/transactions/0x9510aa05440acc0a79c88b828ca2ecebd5154fe84f3b49cf9cf17aed17893d69) |
| claim_points (backer) | backer | ACCEPTED/SUCCESS | FINALIZED | [0x30d3f8a8…949809](https://explorer-studio.genlayer.com/transactions/0x30d3f8a88f81c1d9152b080d84ca3d4fcc6b127a05a2eee665aeb99e9f949809) |
| create_commitment with vague criteria | builder | ACCEPTED/SUCCESS | FINALIZED | [0xb3618e8d…98edb0](https://explorer-studio.genlayer.com/transactions/0xb3618e8d8961fb55b66e98bb2106b5f7c84a0ef5abc6fe9750d6f26dd498edb0) |
| submit_proof on a rejected commitment reverts | builder | ACCEPTED/ERROR | FINALIZED | [0xa367f6fe…e4f99b](https://explorer-studio.genlayer.com/transactions/0xa367f6fe618ab8638d14c08e60582c84a5a42057149df6d6d34e976713e4f99b) |

| Check | Pass | Detail |
|---|---|---|
| AI screen REJECTED the commitment | PASS | `{"status":"REJECTED","reason":"Vague deliverable and subjective criteria"}` |
| no stake taken | PASS | `{"before":1000,"after":1000}` |
| no reputation entry for a rejected commitment | PASS | `` |
| points conserved: balances + escrow + pool == minted | PASS | `{"balances":18700,"conserved":true,"escrow":300,"minted":19000,"pool":0}` |

## shipped

2026-10-21T01:14:21.859Z → 2026-10-21T01:27:52.384Z

| Step | Actor | Result | Final | Tx |
|---|---|---|---|---|
| claim_points (builder) | builder | ACCEPTED/SUCCESS | FINALIZED | [0x6b52bafe…bb92bb](https://explorer-studio.genlayer.com/transactions/0x6b52bafea782408f5c3a42957a26665459431a1f539d85526248b72983bb92bb) |
| claim_points (backer) | backer | ACCEPTED/SUCCESS | FINALIZED | [0x3f99c1a5…38d120](https://explorer-studio.genlayer.com/transactions/0x3f99c1a54843c32ec2629604d7a952f525adbf432fd4b25e526906402c38d120) |
| create_commitment: Ship tally CLI v1.0 (pinned release) | builder | ACCEPTED/SUCCESS | FINALIZED | [0x1d2c9fe0…031300](https://explorer-studio.genlayer.com/transactions/0x1d2c9fe074941c72e4a65584d2b067890c17e56d2675bc7e46e564643e031300) |
| back 200 points | backer | ACCEPTED/SUCCESS | FINALIZED | [0x8ad5f07e…e608f7](https://explorer-studio.genlayer.com/transactions/0x8ad5f07e6b8f101e6c50fb248ba2ad0fa91f35ec4f9ddf245470f88a2fe608f7) |
| submit_proof | builder | ACCEPTED/SUCCESS | FINALIZED | [0xe0f9302c…fff96c](https://explorer-studio.genlayer.com/transactions/0xe0f9302ccc95d4526ba11cbbebda0a4c20dd55bd77445cbc24ad42e1f9fff96c) |
| judge (attempt 1) | builder | ACCEPTED/SUCCESS | FINALIZED | [0x02ab21c0…45c4d6](https://explorer-studio.genlayer.com/transactions/0x02ab21c02f47bb82b222c4428eef9e0935f3a4ee75784d4dca541ec1f845c4d6) |
| builder cannot challenge own SHIPPED verdict | builder | ACCEPTED/ERROR | FINALIZED | [0xf327d3f2…448f4a](https://explorer-studio.genlayer.com/transactions/0xf327d3f2110b6b13c857f833a23512a2c4bfd01ee009829d0023e1eab4448f4a) |
| backer challenges (no new source) | backer | ACCEPTED/SUCCESS | FINALIZED | [0x1ad9d82c…0f508b](https://explorer-studio.genlayer.com/transactions/0x1ad9d82c2714c7847789dfc9ee3b675e826ed4e07655084896ff9960a20f508b) |
| rule_challenge (attempt 1) | builder | ACCEPTED/SUCCESS | FINALIZED | [0x4d6c3430…907dad](https://explorer-studio.genlayer.com/transactions/0x4d6c3430be4a6f6174d69d6852f002bd0c9f5969b3f374825c67b5ed5e907dad) |

| Check | Pass | Detail |
|---|---|---|
| receipt returns the commitment id | PASS | `{"id":1}` |
| commitment 1 belongs to builder | PASS | `{"status":"OPEN","reject":""}` |
| proof snapshotted (sha256 + full stored text + truncation flag) | PASS | `[{"url":"8dab/docs/evidence/ship/release-notes.md","sha256":"ae3e7ba4efd1","immutable":true},{"url":"618e9398dab/docs/evidence/ship/readme.md","sha256":"c2659c0` |
| judge succeeded | PASS | `` |
| structured per-criterion findings stored (one per locked criterion, MET carries a verbatim quote) | PASS | `[["MET","The tally export command writes a CSV file named t"],["MET","The new --json flag prints the export as JSON on s"],["MET","Install: run npm install -g t` |
| expected scenario: SHIPPED | PASS | `"SHIPPED"` |
| pinned raw URLs flagged immutable | PASS | `` |
| rule_challenge succeeded | PASS | `` |
| expected scenario: challenge UPHELD, bond FORFEITED to the pool | PASS | `{"result":"UPHELD","bond":"FORFEITED","verdict":"SHIPPED"}` |
| SHIPPED payout: builder +200 bounty (stake back), backer -200 -100 bond | PASS | `{"dA":200,"dB":-300}` |
| reputation: shipped 1, streak 1, ship rate 100% | PASS | `{"best_streak":1,"commitments":1,"inconclusive":0,"judged":1,"missed":0,"not_shipped":0,"partial":0,"score":102,"ship_rate_bps":10000,"shipped":1,"streak":1}` |
| points conserved: balances + escrow + pool == minted | PASS | `{"balances":20920,"conserved":true,"escrow":980,"minted":22000,"pool":100}` |

## partial

2026-10-21T01:14:23.882Z → 2026-10-21T01:24:59.863Z

| Step | Actor | Result | Final | Tx |
|---|---|---|---|---|
| claim_points (builder) | builder | ACCEPTED/SUCCESS | FINALIZED | [0x9a45431f…d71727](https://explorer-studio.genlayer.com/transactions/0x9a45431f1db67ac85a9677d525ce094ab66a7bd6537b5c00888c6e94a9d71727) |
| claim_points (backer) | backer | ACCEPTED/SUCCESS | FINALIZED | [0xeeb3a389…bf41ec](https://explorer-studio.genlayer.com/transactions/0xeeb3a3896aa893652387a27b644c21bec7dc2fd8d350fe1e7ffb093628bf41ec) |
| create_commitment: Ship tally CLI v1.0 | builder | ACCEPTED/SUCCESS | FINALIZED | [0x8d95577f…77cae3](https://explorer-studio.genlayer.com/transactions/0x8d95577f14f1467b55c423c0f14b6c7bdc4241e7066f1511b18e31bfb277cae3) |
| back 200 points | backer | ACCEPTED/SUCCESS | FINALIZED | [0xad0aa85b…7b4fa1](https://explorer-studio.genlayer.com/transactions/0xad0aa85b14d47ce9321010a834dc176e7f50e8df09b27c168bb3dfab847b4fa1) |
| submit_proof | builder | ACCEPTED/SUCCESS | FINALIZED | [0x57827b38…991cab](https://explorer-studio.genlayer.com/transactions/0x57827b38ce784a90bfea9aaffc395c5a53bea93df5a65ab715e1c96e0b991cab) |
| judge (attempt 1) | builder | ACCEPTED/SUCCESS | FINALIZED | [0x42ffe1db…489ffb](https://explorer-studio.genlayer.com/transactions/0x42ffe1db58f2052e6ba39114d442a708da7dc914cca462633ad08301f9489ffb) |
| finalize after the challenge window (anyone) | backer | ACCEPTED/SUCCESS | FINALIZED | [0xee4b4d79…312347](https://explorer-studio.genlayer.com/transactions/0xee4b4d79542f44b94dca21eab0e30a5d39c50dea57ba471f419c2d3af4312347) |

| Check | Pass | Detail |
|---|---|---|
| receipt returns the commitment id | PASS | `{"id":2}` |
| commitment 2 belongs to builder | PASS | `{"status":"OPEN","reject":""}` |
| proof snapshotted (sha256 + full stored text + truncation flag) | PASS | `[{"url":"/main/docs/evidence/partial/changelog.md","sha256":"33cd2e7ae2a4","immutable":false}]` |
| judge succeeded | PASS | `` |
| structured per-criterion findings stored (one per locked criterion, MET carries a verbatim quote) | PASS | `[["MET","Shipped: the tally export command writes a CSV fil"],["NOT_MET","Not shipped: the --json flag was postponed to vers"],["MET","Shipped: the README docum` |
| expected scenario: PARTIAL | PASS | `"PARTIAL"` |
| FINAL with the first verdict | PASS | `{"verdict":"PARTIAL","settlement":"builder received stake 100 + half the backings 100"}` |
| PARTIAL payout: builder stake back + half the backing (+100), backer -100 | PASS | `{"dA":100,"dB":-100}` |
| reputation updated: partial 1, streak 0, ship rate 50% | PASS | `{"best_streak":0,"commitments":1,"inconclusive":0,"judged":1,"missed":0,"not_shipped":0,"partial":1,"score":50,"ship_rate_bps":5000,"shipped":0,"streak":0}` |
| points conserved: balances + escrow + pool == minted | PASS | `{"balances":20220,"conserved":true,"escrow":1780,"minted":22000,"pool":0}` |

## missed

2026-10-21T01:14:25.874Z → 2026-10-21T01:24:59.832Z

| Step | Actor | Result | Final | Tx |
|---|---|---|---|---|
| claim_points (builder) | builder | ACCEPTED/SUCCESS | FINALIZED | [0xb16da11b…4ee04d](https://explorer-studio.genlayer.com/transactions/0xb16da11b372d879bef902ac83a07902ce05d18b90881db075063cb519d4ee04d) |
| claim_points (backer) | backer | ACCEPTED/SUCCESS | FINALIZED | [0xd4acd8d5…8a0fb2](https://explorer-studio.genlayer.com/transactions/0xd4acd8d5ef40d84f5c28e81f024f9a83087d4ce5aa74fab5584696137a8a0fb2) |
| create_commitment: Ship tally CLI v1.0 (will miss) | builder | ACCEPTED/SUCCESS | FINALIZED | [0x79c706e3…9e183f](https://explorer-studio.genlayer.com/transactions/0x79c706e33cdc1af683f6644e99c18566b9d71cb7b353d0f62d151f4f679e183f) |
| back 150 points | backer | ACCEPTED/SUCCESS | FINALIZED | [0x462a5c29…f61e04](https://explorer-studio.genlayer.com/transactions/0x462a5c29c10a600d4ab3fc0f81c90fcaeff0753cba8671d5b34a6d8854f61e04) |
| finalize before the deadline reverts | backer | ACCEPTED/ERROR | FINALIZED | [0x945461e8…378159](https://explorer-studio.genlayer.com/transactions/0x945461e881c2cbdcafac73c7ab777d38dc46700499e9e974be6128eaaf378159) |
| submit_proof after the deadline reverts | builder | ACCEPTED/ERROR | FINALIZED | [0x90c55133…0d4c0d](https://explorer-studio.genlayer.com/transactions/0x90c551339906eb4a0e9cafd131c569c756007c3c3be0a043ecbc42fde50d4c0d) |
| finalize (anyone): no proof = NOT_SHIPPED | backer | ACCEPTED/SUCCESS | FINALIZED | [0x88157e39…69f255](https://explorer-studio.genlayer.com/transactions/0x88157e39cb8a324a2e64910199a3f9d5985de4aa8d22ef05c5dfb3181469f255) |

| Check | Pass | Detail |
|---|---|---|
| receipt returns the commitment id | PASS | `{"id":3}` |
| commitment 3 belongs to builder | PASS | `{"status":"OPEN","reject":""}` |
| NOT_SHIPPED automatically (MISSED_DEADLINE) | PASS | `{"verdict":"NOT_SHIPPED","outcome":"MISSED_DEADLINE","settlement":"stake 100: 100 to backers, 0 to the pool"}` |
| stake goes to the backer: builder -100, backer +100 | PASS | `{"dA":-100,"dB":100}` |
| reputation: not_shipped 1, missed 1, ship rate 0 | PASS | `{"best_streak":0,"commitments":1,"inconclusive":0,"judged":1,"missed":1,"not_shipped":1,"partial":0,"score":0,"ship_rate_bps":0,"shipped":0,"streak":0}` |
| points conserved: balances + escrow + pool == minted | PASS | `{"balances":20220,"conserved":true,"escrow":1780,"minted":22000,"pool":0}` |

## overturn

2026-10-21T01:14:27.933Z → 2026-10-21T01:26:10.851Z

| Step | Actor | Result | Final | Tx |
|---|---|---|---|---|
| claim_points (builder) | builder | ACCEPTED/SUCCESS | FINALIZED | [0xa211a1b3…9e3800](https://explorer-studio.genlayer.com/transactions/0xa211a1b369649ac926c6e2531f667e5b9e3c16e81cc439f94dfdde265a9e3800) |
| claim_points (backer) | backer | ACCEPTED/SUCCESS | FINALIZED | [0x54bd0365…39ab4d](https://explorer-studio.genlayer.com/transactions/0x54bd036599d5b28ae37329109f680c3c84582f4379c66b4a7d29a8aaf139ab4d) |
| create_commitment: Ship tally CLI v1.0 (overturn) | builder | ACCEPTED/SUCCESS | FINALIZED | [0xffd904e4…8d4400](https://explorer-studio.genlayer.com/transactions/0xffd904e4cacd6bbe299a87abf612260303e965695fcf1ad297bdc643078d4400) |
| back 200 points | backer | ACCEPTED/SUCCESS | FINALIZED | [0xe2dc2ee1…9c35f6](https://explorer-studio.genlayer.com/transactions/0xe2dc2ee10269867e87362d3591e189bc5ce69035308d66c57100f4e68c9c35f6) |
| submit_proof | builder | ACCEPTED/SUCCESS | FINALIZED | [0xe8b67b69…bb6246](https://explorer-studio.genlayer.com/transactions/0xe8b67b691ccc1d80bebc19f43bc173ac8bc84f686ff962ec4097b8f7e5bb6246) |
| judge (attempt 1) | builder | ACCEPTED/SUCCESS | FINALIZED | [0xaca90035…beefb7](https://explorer-studio.genlayer.com/transactions/0xaca90035d14364484e9278c35b4725234aac4bac35565d335496f8bd2abeefb7) |
| backer challenges with overturn/maintainer-notice.md#correction | backer | ACCEPTED/SUCCESS | FINALIZED | [0x94065adb…bcf37e](https://explorer-studio.genlayer.com/transactions/0x94065adb6607b7223b2e822397de3b101bbdd25d31b0c22b54cf80724bbcf37e) |
| rule_challenge (attempt 1) | builder | ACCEPTED/SUCCESS | FINALIZED | [0xf5df1909…dcd3f1](https://explorer-studio.genlayer.com/transactions/0xf5df1909e85ac5bdda2b3c6c1810e3137f51f1ca5c617bf70374bdf31ddcd3f1) |

| Check | Pass | Detail |
|---|---|---|
| receipt returns the commitment id | PASS | `{"id":4}` |
| commitment 4 belongs to builder | PASS | `{"status":"OPEN","reject":""}` |
| proof snapshotted (sha256 + full stored text + truncation flag) | PASS | `[{"url":"n/docs/evidence/overturn/announcement.md","sha256":"ae56f0864e46","immutable":false}]` |
| judge succeeded | PASS | `` |
| structured per-criterion findings stored (one per locked criterion, MET carries a verbatim quote) | PASS | `[["MET","The tally export command writes a CSV file to the "],["MET","The --json flag prints the export as JSON on stand"],["MET","The README documents installa` |
| challenge source stored canonically (fragment stripped) | PASS | `"https://raw.githubusercontent.com/DikaCream/ProofOfShip/main/docs/evidence/overturn/maintainer-notice.md"` |
| rule_challenge succeeded | PASS | `` |
| both rounds recorded, challenge source reached round two | PASS | `["INITIAL:SHIPPED","CHALLENGE:PARTIAL"]` |
| expected scenario: OVERTURNED, bond RETURNED | PASS | `{"first":"SHIPPED","final":"PARTIAL","result":"OVERTURNED"}` |
| criterion 1 (JSON flag) NOT_MET in round two | PASS | `{"criterion":1,"fact":"Source 1, labeled as an official maintainer notice, contradicts the blog post and confirms the JSON flag was not included in version 1.0.` |
| points conserved: balances + escrow + pool == minted | PASS | `{"balances":20220,"conserved":true,"escrow":1780,"minted":22000,"pool":0}` |

## inconclusive

2026-10-21T01:14:29.889Z → 2026-10-21T01:27:07.162Z

| Step | Actor | Result | Final | Tx |
|---|---|---|---|---|
| claim_points (builder) | builder | ACCEPTED/SUCCESS | FINALIZED | [0xe0b9777b…ef5de8](https://explorer-studio.genlayer.com/transactions/0xe0b9777b8e6edee79ba35d874d6f0ef5b0cdad3a9db6d2ad9dff060cddef5de8) |
| claim_points (backer) | backer | ACCEPTED/SUCCESS | FINALIZED | [0x9da5dee6…8e0c43](https://explorer-studio.genlayer.com/transactions/0x9da5dee6198e2b20faee8c0b5e97ca756a797f23326b3ab753c5fdedad8e0c43) |
| create_commitment: Ship tally CLI v1.0 (inconclusive) | builder | ACCEPTED/SUCCESS | FINALIZED | [0x7944c20b…09e3c8](https://explorer-studio.genlayer.com/transactions/0x7944c20b9a50acd3aa1c95ec53e83a2201d9c4efe79b6928ba4813e3dc09e3c8) |
| back 200 points | backer | ACCEPTED/SUCCESS | FINALIZED | [0xa35ea8a8…2691a6](https://explorer-studio.genlayer.com/transactions/0xa35ea8a88cdebd365e2fd9e2184bfda29ccc399cd21ae8c6413976c78a2691a6) |
| submit_proof | builder | ACCEPTED/SUCCESS | FINALIZED | [0x9ae59a77…34fe73](https://explorer-studio.genlayer.com/transactions/0x9ae59a776a361d7973c2622b6e41e8e85bfcf0c0fdc5b73f7e7f4e574134fe73) |
| judge (attempt 1) | builder | ACCEPTED/SUCCESS | FINALIZED | [0x230db6ea…c8145d](https://explorer-studio.genlayer.com/transactions/0x230db6eae9975e71b0d5d9e8079e43ffff2cd53cd27f5d7a4c74494d3ec8145d) |
| backer challenges with inconclusive/dispute-note.md | backer | ACCEPTED/SUCCESS | FINALIZED | [0xe4cb5660…4f9833](https://explorer-studio.genlayer.com/transactions/0xe4cb5660ce0564268f6b0569594cae18f9e4e61179bb92bfa38ea8ede04f9833) |
| rule_challenge (attempt 1) | builder | ACCEPTED/SUCCESS | FINALIZED | [0x5727ddfe…f41bf6](https://explorer-studio.genlayer.com/transactions/0x5727ddfe5f775215f3789ace583203fb47a80403c4dd6a641b7b7dd055f41bf6) |

| Check | Pass | Detail |
|---|---|---|
| receipt returns the commitment id | PASS | `{"id":5}` |
| commitment 5 belongs to builder | PASS | `{"status":"OPEN","reject":""}` |
| proof snapshotted (sha256 + full stored text + truncation flag) | PASS | `[{"url":"n/docs/evidence/overturn/announcement.md","sha256":"ae56f0864e46","immutable":false}]` |
| judge succeeded | PASS | `` |
| structured per-criterion findings stored (one per locked criterion, MET carries a verbatim quote) | PASS | `[["MET","The tally export command writes a CSV file to the "],["MET","The --json flag prints the export as JSON on stand"],["MET","The README documents installa` |
| challenge source stored canonically (fragment stripped) | PASS | `"https://raw.githubusercontent.com/DikaCream/ProofOfShip/main/docs/evidence/inconclusive/dispute-note.md"` |
| rule_challenge succeeded | PASS | `` |
| both rounds recorded, challenge source reached round two | PASS | `["INITIAL:SHIPPED","CHALLENGE:INCONCLUSIVE"]` |
| expected scenario: challenge INCONCLUSIVE, first verdict stands, bond RETURNED | PASS | `{"first":"SHIPPED","final":"SHIPPED","result":"INCONCLUSIVE","round2":["MET","UNCLEAR","MET"]}` |
| points conserved: balances + escrow + pool == minted | PASS | `{"balances":20620,"conserved":true,"escrow":1380,"minted":22000,"pool":0}` |

## uncompleted

2026-10-21T01:31:25.864Z → 2026-10-21T01:39:22.574Z

| Step | Actor | Result | Final | Tx |
|---|---|---|---|---|
| claim_points (builder) | builder | ACCEPTED/SUCCESS | FINALIZED | [0x78e58350…087cd0](https://explorer-studio.genlayer.com/transactions/0x78e583507ed77e441b28f46eb33065dfc8927591f1fac35c5913d8a07c087cd0) |
| claim_points (backer) | backer | ACCEPTED/SUCCESS | FINALIZED | [0x55bfd0a0…e3bb37](https://explorer-studio.genlayer.com/transactions/0x55bfd0a01448f87ed7a41501affcc882bf78d9aa2a043d8f0b5747e68be3bb37) |
| create_commitment: Ship tally CLI v1.0 (uncompleted challenge) | builder | ACCEPTED/SUCCESS | FINALIZED | [0x67332f66…bbba2f](https://explorer-studio.genlayer.com/transactions/0x67332f6652ec29ebd65339b63b407b70037885b776448159af34da45dbbbba2f) |
| back 200 points | backer | ACCEPTED/SUCCESS | FINALIZED | [0x9d4bb729…200036](https://explorer-studio.genlayer.com/transactions/0x9d4bb72966df7b61c8448f44daf39bf886e73dffe1400e77a09a1e4c6e200036) |
| submit_proof | builder | ACCEPTED/SUCCESS | FINALIZED | [0x26e6a087…dd7ff1](https://explorer-studio.genlayer.com/transactions/0x26e6a087b5bba8e0a2faef676e8785f213c6d4a4ffe920258c433807eedd7ff1) |
| judge (attempt 1) | builder | ACCEPTED/SUCCESS | FINALIZED | [0xd21ba7b7…be9481](https://explorer-studio.genlayer.com/transactions/0xd21ba7b79f7dc40db6d3c19508791e88f470d50ed47b0d10a168341e3fbe9481) |
| backer challenges, then nobody runs rule_challenge | backer | ACCEPTED/SUCCESS | FINALIZED | [0xe0a15bb3…b14309](https://explorer-studio.genlayer.com/transactions/0xe0a15bb3f6b75ab929e9e0a5fdd078a309cf53564458b7cdae91590bb1b14309) |
| rule_challenge after the deadline reverts | builder | ACCEPTED/ERROR | FINALIZED | [0x41de22a6…db209b](https://explorer-studio.genlayer.com/transactions/0x41de22a68193ca9099e52dbbdfe279dd4c876c5a995c4d6c3d0153614cdb209b) |
| finalize (anyone applies the finality rules) | builder | ACCEPTED/SUCCESS | FINALIZED | [0x9c33839a…dcc445](https://explorer-studio.genlayer.com/transactions/0x9c33839aa2512dfeba3cc5a3152ea3c874b1da2511b334ada62ebf89bbdcc445) |

| Check | Pass | Detail |
|---|---|---|
| receipt returns the commitment id | PASS | `{"id":14}` |
| commitment 14 belongs to builder | PASS | `{"status":"OPEN","reject":""}` |
| proof snapshotted (sha256 + full stored text + truncation flag) | PASS | `[{"url":"OfShip/main/docs/evidence/ship/readme.md","sha256":"c2659c0fa112","immutable":false},{"url":"/main/docs/evidence/partial/changelog.md","sha256":"33cd2e` |
| judge succeeded | PASS | `` |
| structured per-criterion findings stored (one per locked criterion, MET carries a verbatim quote) | PASS | `[["MET","Shipped: the tally export command writes a CSV fil"],["NOT_MET","Not shipped: the --json flag was postponed to vers"],["MET","Install: run npm install ` |
| first verdict stands, challenge UNRESOLVED, bond FORFEITED | PASS | `{"first":"PARTIAL","final":"PARTIAL","result":"UNRESOLVED","bond":"FORFEITED"}` |
| points conserved: balances + escrow + pool == minted | PASS | `{"balances":22820,"conserved":true,"escrow":780,"minted":24000,"pool":400}` |

## overlap

2026-10-21T01:14:33.898Z → 2026-10-21T01:27:58.022Z

| Step | Actor | Result | Final | Tx |
|---|---|---|---|---|
| claim_points (builder) | builder | ACCEPTED/SUCCESS | FINALIZED | [0x8ff368a8…1bd9a0](https://explorer-studio.genlayer.com/transactions/0x8ff368a8a6382d4fecd39f77315e5875aea235a95be0f83258f60356ec1bd9a0) |
| claim_points (backer) | backer | ACCEPTED/SUCCESS | FINALIZED | [0xcfa54049…054a73](https://explorer-studio.genlayer.com/transactions/0xcfa540491271286b89c0bf6258db87b62f689c59e8b2224524e5d48248054a73) |
| create_commitment: Ship tally CLI v1.0 (overlap) | builder | ACCEPTED/SUCCESS | FINALIZED | [0x736837e0…c0463c](https://explorer-studio.genlayer.com/transactions/0x736837e0959b0ae4e033640d4ed79ef81b19f513ebb5dfb3ab820d95a3c0463c) |
| back 200 points | backer | ACCEPTED/SUCCESS | FINALIZED | [0xa8301ddc…a1a8ab](https://explorer-studio.genlayer.com/transactions/0xa8301ddc83b3250b703e95946a3057817ee40132e183d7e4928acb70cfa1a8ab) |
| submit_proof | builder | ACCEPTED/SUCCESS | FINALIZED | [0xed1aec95…766262](https://explorer-studio.genlayer.com/transactions/0xed1aec95ae5109c53e31400f4a72559bcab8965e13bc4c8522bcf5b493766262) |
| judge (attempt 1) | builder | ACCEPTED/SUCCESS | FINALIZED | [0x42adc9bf…540ab4](https://explorer-studio.genlayer.com/transactions/0x42adc9bf017bc4e547ece75619be1aa5d663588ec7041d8725a731ca34540ab4) |
| challenge adds .../report-final#frag (path overlaps .../report) | backer | ACCEPTED/SUCCESS | FINALIZED | [0x0e88983a…699abf](https://explorer-studio.genlayer.com/transactions/0x0e88983a7050abfe2e920390fe6bbcbe8afe9359248cbe3e78d831bdab699abf) |
| rule_challenge (attempt 1) | builder | ACCEPTED/SUCCESS | FINALIZED | [0xcb58af7b…c35021](https://explorer-studio.genlayer.com/transactions/0xcb58af7b9976d2f755704e43d5e8d4752c772c365221a9c3a353a2cd46c35021) |

| Check | Pass | Detail |
|---|---|---|
| receipt returns the commitment id | PASS | `{"id":7}` |
| commitment 7 belongs to builder | PASS | `{"status":"OPEN","reject":""}` |
| proof snapshotted (sha256 + full stored text + truncation flag) | PASS | `[{"url":"OfShip/main/docs/evidence/overlap/report","sha256":"4e7102577de5","immutable":false}]` |
| judge succeeded | PASS | `` |
| structured per-criterion findings stored (one per locked criterion, MET carries a verbatim quote) | PASS | `[["MET","The tally export command writes a CSV file named t"],["MET","The --json flag prints the export as JSON on stand"],["MET","The README documents installa` |
| overlapping path stored as its own source, fragment stripped | PASS | `"https://raw.githubusercontent.com/DikaCream/ProofOfShip/main/docs/evidence/overlap/report-final"` |
| two distinct snapshots (report, report-final) | PASS | `[["BUILDER PROOF","overlap/report"],["CHALLENGER SOURCE","p/report-final"]]` |
| rule_challenge succeeded | PASS | `` |
| round two sources contain report AND report-final | PASS | `["https://raw.githubusercontent.com/DikaCream/ProofOfShip/main/docs/evidence/overlap/report","https://raw.githubusercontent.com/DikaCream/ProofOfShip/main/docs/` |
| FINAL | PASS | `` |
| points conserved: balances + escrow + pool == minted | PASS | `{"balances":21220,"conserved":true,"escrow":580,"minted":22000,"pool":200}` |

## concurrent

2026-10-21T01:14:35.918Z → 2026-10-21T01:23:51.637Z

| Step | Actor | Result | Final | Tx |
|---|---|---|---|---|
| claim_points (builder) | builder | ACCEPTED/SUCCESS | FINALIZED | [0x18556a62…41f3c9](https://explorer-studio.genlayer.com/transactions/0x18556a6285b801d68a88b96846a9ba7c03f54ebd2bd3125307187db44a41f3c9) |
| claim_points (backer) | backer | ACCEPTED/SUCCESS | FINALIZED | [0x6ced62b7…aba222](https://explorer-studio.genlayer.com/transactions/0x6ced62b78528589bdd6045b55b9d8503b777993988999b37cbebebc980aba222) |
| claim_points (C) | C | ACCEPTED/SUCCESS | FINALIZED | [0x676a295d…b0e3d3](https://explorer-studio.genlayer.com/transactions/0x676a295da4f8d7eb2ffbb4b26872038cedd22b48296593f209a4881a5eb0e3d3) |
| claim_points (D) | D | ACCEPTED/SUCCESS | FINALIZED | [0x2976d042…e540a4](https://explorer-studio.genlayer.com/transactions/0x2976d0425697e564b80f9825d945e7388a71c39b6f4b1f6b112f658a2ce540a4) |
| concurrent create (builder) | builder | ACCEPTED/SUCCESS | FINALIZED | [0xf28183f8…73951a](https://explorer-studio.genlayer.com/transactions/0xf28183f868e4d79332ac6ea4cceb0fce00fb839cd185012073bdf6572573951a) |
| concurrent create (D) | D | ACCEPTED/SUCCESS | FINALIZED | [0xc45f3868…b41cd9](https://explorer-studio.genlayer.com/transactions/0xc45f3868bf9291c1bbd2297fc6b817a86c4ee312cda67f2725e91cb0eab41cd9) |
| concurrent create (backer) | backer | ACCEPTED/SUCCESS | FINALIZED | [0x0a84fce9…7ce214](https://explorer-studio.genlayer.com/transactions/0x0a84fce99957f6f0eae0fe3067f18c027582e58681356903156dd7a0807ce214) |
| concurrent create (C) | C | ACCEPTED/SUCCESS | FINALIZED | [0x47c61777…8160d8](https://explorer-studio.genlayer.com/transactions/0x47c61777fc7684161e9fe060b6a51818f0d75e1fbe6287e2dfde2624e28160d8) |

| Check | Pass | Detail |
|---|---|---|
| every creation returned an id from its own receipt | PASS | `[9,11,12,10]` |
| ids are distinct | PASS | `[9,11,12,10]` |
| ids are fresh (>= count before the burst) | PASS | `{"before":8,"ids":[9,11,12,10]}` |
| builder: id 9 is its own commitment and its newest | PASS | `{"id":9}` |
| backer: id 11 is its own commitment and its newest | PASS | `{"id":11}` |
| C: id 12 is its own commitment and its newest | PASS | `{"id":12}` |
| D: id 10 is its own commitment and its newest | PASS | `{"id":10}` |
| points conserved: balances + escrow + pool == minted | PASS | `{"balances":19670,"conserved":true,"escrow":2330,"minted":22000,"pool":0}` |

## changed-b

2026-10-21T01:31:10.658Z → 2026-10-21T01:39:10.184Z

| Step | Actor | Result | Final | Tx |
|---|---|---|---|---|
| create_commitment: Ship tally CLI v1.0 (page swap test) | builder | ACCEPTED/SUCCESS | FINALIZED | [0x24ff5b18…e7ce78](https://explorer-studio.genlayer.com/transactions/0x24ff5b1852c0a2f5dddf9cd79e7328aa0b8397e3bb5eca881a734ff4bfe7ce78) |
| back 100 points | backer | ACCEPTED/SUCCESS | FINALIZED | [0x090159d6…8440e5](https://explorer-studio.genlayer.com/transactions/0x090159d6f12accce2e72aa7370c2799b1aa82cf78798af0ac15b0eb7f28440e5) |
| submit_proof (version 1 page) | builder | ACCEPTED/SUCCESS | FINALIZED | [0x2a3fca52…eb77d4](https://explorer-studio.genlayer.com/transactions/0x2a3fca5234abdb5b0a945aae1f3a4546bb9a45c16ee2aa9fbeec6054cceb77d4) |
| judge (attempt 1) | builder | ACCEPTED/SUCCESS | FINALIZED | [0x61303ab0…8c7426](https://explorer-studio.genlayer.com/transactions/0x61303ab0a3eaf218f987b840e0799385ee31e455809339c916f5bbcb078c7426) |

| Check | Pass | Detail |
|---|---|---|
| receipt returns the commitment id | PASS | `{"id":13}` |
| commitment 13 belongs to builder | PASS | `{"status":"OPEN","reject":""}` |
| snapshot holds version 1 text | PASS | `{"sha256":"35241c028d28df11d30ae12fcae399f7b1cf2fc7d3d5cf772a33f3a173a083b4"}` |
| live page now differs from the snapshot (version 2 is live) | PASS | `"# tally-cli 1.0.0 status page (version 2)\n\nThis file is a stable test fixture fo"` |
| judge succeeded | PASS | `` |
| verdict flagged evidence_changed and lists the URL | PASS | `{"flagged":true,"changed":["https://raw.githubusercontent.com/DikaCream/ProofOfShip/main/docs/evidence/changed/proof-b.md"]}` |
| swapped page did not win: JSON criterion not MET (stored v1 says postponed) | PASS | `{"verdict":"PARTIAL","findings":[["MET","Shipped: the tally export command writes a CSV file named ta"],["NOT_MET","Not shipped: the --json flag was postponed a` |
| no quote comes from the version-2 text | PASS | `` |
| points conserved: balances + escrow + pool == minted | PASS | `{"balances":22520,"conserved":true,"escrow":1180,"minted":24000,"pool":300}` |

## uncompleted-attempt1

2026-10-21T01:14:31.884Z → (unfinished)

| Step | Actor | Result | Final | Tx |
|---|---|---|---|---|
| claim_points (builder) | builder | ACCEPTED/SUCCESS | - | [0x029972ab…9f6b35](https://explorer-studio.genlayer.com/transactions/0x029972ab39c166c73cc69429db4cf38df9e83ace1238c2609096f144519f6b35) |
| claim_points (backer) | backer | ACCEPTED/SUCCESS | - | [0xcaeb4739…1e6caa](https://explorer-studio.genlayer.com/transactions/0xcaeb4739bd64beecac432cf24570fd2aea8002dbbcaacc5389775934291e6caa) |
| create_commitment: Ship tally CLI v1.0 (uncompleted challenge) | builder | ACCEPTED/SUCCESS | - | [0xe41c790e…3cef1d](https://explorer-studio.genlayer.com/transactions/0xe41c790ef0877cd606548e1b00a5586defe247630ef00cc32e796f9a113cef1d) |
| back 200 points | backer | ACCEPTED/SUCCESS | - | [0x9eb1d802…63e150](https://explorer-studio.genlayer.com/transactions/0x9eb1d80203c0c2eb545547cfba6ae6b63fbc0dea3a0bab5da33c9cfd9863e150) |
| submit_proof | builder | ACCEPTED/SUCCESS | - | [0x7aa4ee9d…2349f3](https://explorer-studio.genlayer.com/transactions/0x7aa4ee9d3262410cb84ba10bb465d8e4f3925099e789931983b075e4fc2349f3) |
| judge (attempt 1) | builder | ACCEPTED/ERROR | - | [0xe5e5ba47…de1ef7](https://explorer-studio.genlayer.com/transactions/0xe5e5ba477e6070dadd371e0a1271ec3be7e3063376956bdc6dba03f830de1ef7) |
| judge (attempt 2) | builder | ACCEPTED/ERROR | - | [0xe277154e…b2460b](https://explorer-studio.genlayer.com/transactions/0xe277154e4978f305512cee26b922960a3ce9511a706d16f2ba1e4bbfceb2460b) |
| judge (attempt 3) | builder | ACCEPTED/ERROR | - | [0xdb7fc2c3…e1ab96](https://explorer-studio.genlayer.com/transactions/0xdb7fc2c317c37e30929f18174d5fa521856ec5b9c31a2f00ff9f68c13de1ab96) |

| Check | Pass | Detail |
|---|---|---|
| receipt returns the commitment id | PASS | `{"id":6}` |
| commitment 6 belongs to builder | PASS | `{"status":"OPEN","reject":""}` |
| proof snapshotted (sha256 + full stored text + truncation flag) | PASS | `[{"url":"OfShip/main/docs/evidence/ship/readme.md","sha256":"c2659c0fa112","immutable":false},{"url":"/main/docs/evidence/partial/changelog.md","sha256":"33cd2e` |
| judge succeeded | FAIL | `` |

## changed-attempt1

2026-10-21T01:15:15.982Z → 2026-10-21T01:30:37.938Z

| Step | Actor | Result | Final | Tx |
|---|---|---|---|---|
| claim_points (builder) | builder | ACCEPTED/SUCCESS | FINALIZED | [0xc7adedcb…0b87ab](https://explorer-studio.genlayer.com/transactions/0xc7adedcbf3b29876e7a74034f281bdbd4cef3228441d6a7ac86d21f7820b87ab) |
| claim_points (backer) | backer | ACCEPTED/SUCCESS | FINALIZED | [0x894c732b…3aba6d](https://explorer-studio.genlayer.com/transactions/0x894c732bdc0d1907acff27c40f272a2cc01d1fc0a1ad32234e58a26eca3aba6d) |
| create_commitment: Ship tally CLI v1.0 (page swap test) | builder | ACCEPTED/SUCCESS | FINALIZED | [0x3c5de47d…d6d5be](https://explorer-studio.genlayer.com/transactions/0x3c5de47d6f1870cc136f2636b4c68cb7cf1d46bcdad243054bbc785611d6d5be) |
| back 100 points | backer | ACCEPTED/SUCCESS | FINALIZED | [0xd4db32ea…0d0ff0](https://explorer-studio.genlayer.com/transactions/0xd4db32eac04d909763f19a8793824684d5e14d0b74790ec1fbcb8cdd320d0ff0) |
| submit_proof (version 1 page) | builder | ACCEPTED/SUCCESS | FINALIZED | [0x0b287dbe…b815d5](https://explorer-studio.genlayer.com/transactions/0x0b287dbe8255e84ea39cde932a0415c0488372b571efae61dbbdda6d92b815d5) |
| judge (attempt 1) | builder | ACCEPTED/ERROR | FINALIZED | [0x913db1d6…0b830a](https://explorer-studio.genlayer.com/transactions/0x913db1d62cf0420e36544c96e3d4daadfbcd89c35a2ce46d93ce60b7740b830a) |
| judge (attempt 2) | builder | ACCEPTED/ERROR | FINALIZED | [0xf5947b91…1c54d2](https://explorer-studio.genlayer.com/transactions/0xf5947b91f36a82a6f5fd4dbafc4aebdd922e85427a85612d8399e7ba6e1c54d2) |
| judge (attempt 3) | builder | ACCEPTED/ERROR | FINALIZED | [0x5ed6027d…c88018](https://explorer-studio.genlayer.com/transactions/0x5ed6027d7246026ccf8d69be35713887552fc515dcf21c3d0628b96155c88018) |

| Check | Pass | Detail |
|---|---|---|
| receipt returns the commitment id | PASS | `{"id":8}` |
| commitment 8 belongs to builder | PASS | `{"status":"OPEN","reject":""}` |
| snapshot holds version 1 text | PASS | `{"sha256":"35241c028d28df11d30ae12fcae399f7b1cf2fc7d3d5cf772a33f3a173a083b4"}` |
| live page now differs from the snapshot (version 2 is live) | PASS | `"# tally-cli 1.0.0 status page (version 2)\n\nThis file is a stable test fixture fo"` |
| judge succeeded | FAIL | `` |
| verdict flagged evidence_changed and lists the URL | FAIL | `{"flagged":false,"changed":[]}` |
| swapped page did not win: JSON criterion not MET (stored v1 says postponed) | PASS | `{"verdict":"PARTIAL","findings":[["MET","Shipped: the tally export command writes a CSV file named ta"],["NOT_MET","Not shipped: the --json flag was postponed a` |
| no quote comes from the version-2 text | PASS | `` |
| points conserved: balances + escrow + pool == minted | PASS | `{"balances":21220,"conserved":true,"escrow":580,"minted":22000,"pool":200}` |
