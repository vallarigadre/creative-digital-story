# Creative Digital Story

V's weekly build log for Creative Digital Story. The site is built from plain markdown files and hosted free on Netlify.

## Folders

- `posts/` One file per entry. Every Saturday's scheduled task sends you a file named like `2026-10-17-short-slug.md`. Drop it in here.
- `static/images/` Cover and in-story photos. File names must match the ones in the post (for example `short-slug.jpg`, `short-slug-2.jpg`). Photos you haven't added yet are simply hidden; covers show a blush number card instead.
- `pages/` About, Disclosure, Privacy and the newsletter thank-you page.
- `site.config.json` Site name, shop link, newsletter name, and the web address.

## Weekly routine (Saturday)

1. Open the Saturday delivery in Claude.
2. Make the photos in ChatGPT using the prompts provided, saved with the exact file names.
3. On GitHub, upload the post to `posts/` and the photos to `static/images/`.
4. Netlify rebuilds the site by itself in about a minute.
5. Paste the Medium version into Medium and set its canonical link to the site post.
6. Plan the week's pins from the pin plan in the delivery.

## First-time setup (same steps as House & Habit)

1. Create a GitHub repository called `creative-digital-story` and upload everything in this folder.
2. In Netlify: Add new site > Import from GitHub > pick the repository. The settings fill in from `netlify.toml`.
3. Site configuration > Change site name > `creativedigitalstory`. Your address becomes creativedigitalstory.netlify.app. If you choose a different name, update `url` in `site.config.json`.
4. Forms > Enable form detection, so The Saturday Build sign-ups are collected.
5. Optional: paste a Cloudflare Web Analytics token into `cloudflareAnalyticsToken` in `site.config.json` to count views.

## Section names

`category` in each post must be exactly one of: Behind the Build, AI Tools, Income Experiments, Playbooks.
