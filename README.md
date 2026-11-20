# Has Legs website

The website for Has Legs, a creative extension studio. Nine pages and a working brief builder. Plain HTML, CSS and JavaScript, with nothing to install and nothing loaded from other websites.

Live at https://gowisp.github.io/has-legs/ (hidden from search engines while it is a draft).

## One page, one question

Each fact lives on one page only. If something needs saying twice, link to it.

| Page | The question it answers | What lives here and nowhere else |
| --- | --- | --- |
| Home | What is this, and is it for me? | The offer, who it is for, what an extension is and isn't |
| Work | What does it look like? | The three demonstrations |
| How it works | What happens after I send a brief? | The five steps, the four things we need, how changes work, what approval means, turnaround, the brand file |
| Catalogue | What can I order, and what does it cost? | The seven pieces, how fees work |
| Studio | Who makes it, and how is AI used? | How we are built, the three checks, the five promises |
| Agencies | How does it work for an agency? | Referral, white-label, the one rule |
| Send a brief | The order form | |
| Privacy | What does this website collect? | |
| Not found | The lost-page message | |

`python check.py` enforces the main ones under "said once".

## The things most likely to change

They live in one file, `site.json`:

| What | Where in `site.json` |
| --- | --- |
| The address briefs go to | `email` |
| The web address, when the site moves to its own domain | `url` and `base_path` (use `/` for a domain of its own) |
| Showing the site to search engines | set `hide_from_search` to `false` |

The site shows no prices. When prices are ruled, they go on the Catalogue page.

The seven catalogue pieces are named in two places that must match: the cards on `src/pages/catalogue.html` and the list the brief builder offers in `src/pages/brief.html`. The checks fail if they drift apart.

After changing anything, build and check (below).

## Build

```
python build.py
```

This turns `src/` into `docs/`, which is the folder GitHub Pages serves. The build stops and says why if a link or anchor points nowhere, an id is used twice on a page, a page uses a value that does not exist, a long dash slips into the copy, or a promise the studio has dropped comes back (the list is `RETIRED` at the top of `build.py`).

## Check

```
python check.py
```

Builds the site into a temporary folder, opens it in headless Chrome and runs about ninety checks, each printed as PASS or FAIL in plain words: the brief builder from empty form to finished email, the catalogue and its links into the brief, the steps and the three kinds of feedback, that each fact is said on one page only, that the retired pages are gone, the phone menu, and that no page scrolls sideways on a phone. It does not touch `docs/` and sends nothing anywhere.

## Publish

Build, then commit and push. GitHub Pages serves the `docs/` folder of the `main` branch.

## Where things are

| Folder | What is in it |
| --- | --- |
| `src/pages/` | One file per page. The block at the top sets its title, description and address. |
| `src/partials/` | Pieces shared between pages: header, footer, the closing call, the demonstration and catalogue artwork (`art/`) and the walking characters (`mascot/`). |
| `src/static/` | The stylesheet, the scripts, the fonts and the images. Copied to `docs/assets/`. |
| `src/layout.html` | The frame every page sits in. |
| `tests/` | The browser checks that `check.py` runs. |
| `docs/` | The built site. Do not edit by hand: it is rebuilt every time. |

## Still to be made true before prospects see it

The site is written as if the studio were trading. How a job really runs is in `../PROCESS.md`.

- **Briefs address.** `briefs@haslegs.example` is a placeholder and goes nowhere.
- **Fees.** No prices are shown. The Catalogue says fees are fixed, agreed first and paid up front. The amounts, and the way of taking payment, are not yet ruled.
- **Demonstrations and catalogue drawings.** Verlane Bank, Tumble Soda and Okavi Energy are invented brands with stand-in artwork drawn by hand in code. None of it was made by the pipeline, so it is not yet a sample of what a client gets.
- **The three checks on the Studio page.** The measured checks and the separate reviewer are agreed but not yet built or run on a real job.
- **"Hours, not days".** A working line, not yet measured on a real job.
- **The promises on the Studio page.** No training on client material and nothing shown without permission: the first needs the setting confirmed on every AI service the pipeline uses.

The agreed vocabulary for the site copy is in `../GLOSSARY.md`. Site copy uses no em dashes or en dashes.
