# Has Legs website

The website for Has Legs, a creative extension studio. Thirteen pages, a working brief builder and a job sizer. Plain HTML, CSS and JavaScript, with nothing to install and nothing loaded from other websites.

Live at https://gowisp.github.io/has-legs/ (hidden from search engines while it is a draft).

## The three things most likely to change

They all live in one file, `site.json`:

| What | Where in `site.json` |
| --- | --- |
| The address briefs go to | `email` |
| Prices | `prices` (first piece, each further piece in a Set, and how many pieces make a full Set) |
| The web address, when the site moves to its own domain | `url` and `base_path` (use `/` for a domain of its own) |
| Showing the site to search engines | set `hide_from_search` to `false` |

After changing anything, build and check (below). Every page, the brief builder and the job sizer pick the new values up from that one file.

## Build

```
python build.py
```

This turns `src/` into `docs/`, which is the folder GitHub Pages serves. The build stops and says why if a link or anchor points nowhere, an id is used twice on a page, a page uses a value that does not exist, or a long dash slips into the copy.

## Check

```
python check.py
```

Builds the site into a temporary folder, opens it in headless Chrome and runs about seventy checks, each printed as PASS or FAIL in plain words: the brief builder from empty form to finished email, the job sizer, the FAQ filter, the phone menu, and that no page scrolls sideways on a phone. It does not touch `docs/` and sends nothing anywhere.

## Publish

Build, then commit and push. GitHub Pages serves the `docs/` folder of the `main` branch.

## Where things are

| Folder | What is in it |
| --- | --- |
| `src/pages/` | One file per page. The block at the top sets its title, description and address. |
| `src/partials/` | Pieces shared between pages: header, footer, the closing call, size cards, FAQ answers (`faq/`), the demonstration artwork (`art/`) and the walking characters (`mascot/`). |
| `src/static/` | The stylesheet, the scripts, the fonts and the images. Copied to `docs/assets/`. |
| `src/layout.html` | The frame every page sits in. |
| `tests/` | The browser checks that `check.py` runs. |
| `docs/` | The built site. Do not edit by hand: it is rebuilt every time. |

## Still to be made true before prospects see it

- **Briefs address.** `briefs@haslegs.example` is a placeholder and goes nowhere.
- **Prices.** The numbers in `site.json` are working figures, not yet ruled.
- **Demonstrations.** Verlane Bank, Tumble Soda and Okavi Energy are invented brands with stand-in artwork drawn in code. They are for a designer to replace.
- **The promises on the Studio and Privacy pages.** Approved tools only, no training on client material, nothing shown without permission: these need to be in place with the designers.

The agreed vocabulary for the site copy is in `../GLOSSARY.md`. Site copy uses no em dashes or en dashes.
