# Methods Arcade — AS Software Systems Development, Topic 3

An interactive revision arcade for the Topic 3 Methods booklet: 32 games in eight zones, one zone per booklet section.

Live: https://dgaj-g.github.io/alevel_SSD/methods/

| Zone | Booklet | Games |
|---|---|---|
| A · Why methods | section 2 | Squash the Copies · Advantages Sort · Label the Header · Follow the Calls |
| B · In and out | sections 3 and 4 | Argument or Parameter? · Header Builder · Predict the Output · Calls Become Values |
| C · How methods behave | sections 5 to 7 | Swap Trace · Make the Swap Work · Which Version Runs? · Will It Build? |
| D · The validated-input routine | section 8 | Build EnterNumber · Be the Examiner · Be the User |
| E · Exam Room | section 10 | the eight past-paper parts, each written first, then self-marked against the mark scheme |
| F · Practicals | section 11 | P1 Notice Board · P2 Quote Machine · P3 Swap and Twins · P4 Order Desk · Bug Clinic |
| G · Definitions | section 12 | Definition Match · Missing Words · Quick-Fire Cards |
| H · Final Challenge | everything | thirty questions, three stages, three lives |

## How it behaves

- Every answer is placed or chosen first, then checked. Options are shuffled each play.
- Every program output, crash and compiler error shown in the arcade is the real result from running it with `dotnet` (.NET 10), not hand-typed.
- Stars per game (90 / 70 / 50 %) and best scores are kept in the pupil's own browser (`localStorage`). Nothing is sent anywhere; there is no login.
- Sound is off until the pupil turns it on.
- Works on a phone (375 px) as well as a desktop.

## Files

- `index.html` — the page. `js/main.js` — the hub, the router (`#/play/<id>`) and the results card.
- `js/registry.js` — every zone and game, with the zone's key points.
- `js/data/<zone>.js` — the content. `js/games/<id>.js` — each game.
- `js/ui.js`, `js/kit.js`, `js/dnd.js`, `js/store.js` — shared parts (code blocks, the console, choices, drag and drop, saved stars).
- `fonts/` — self-hosted fonts (OFL). `js/icons.js` — Lucide icons (ISC). `vendor/` — canvas-confetti (ISC).

## Changing content

Edit the matching `js/data/*.js` file. Any question with `cs` (a program) and `expect` (its result) is checked by
the verify harness kept in `Claude Work/AS SSD Overhaul/AS Methods Arcade/verify/` (`python3 verify_all.py`),
which builds and runs every program and fails if a stated result is wrong.

To run it locally: `python3 -m http.server` in the repo root, then open http://localhost:8000/methods/
