# Deployment

The raffle app is a Next.js static export (`output: "export"`) hosted on Azure
Static Web Apps. It has no server side: team data is CSV-uploaded and parsed in
the browser, and configuration lives in `localStorage`.

| | |
|---|---|
| Subscription | Visual Studio Premium with MSDN (`tmd1037`) |
| Resource group | `m365nyc-raffle-rg` (eastus2) |
| Static Web App | `m365nyc-raffle` (Free tier) |
| URL | https://salmon-mushroom-0c5330a0f.7.azurestaticapps.net |

## Deploying

```bash
npm run deploy         # optimize photos -> build -> upload
npm run deploy:quick   # build -> upload (skips photo optimization)
```

`npm run deploy` needs the az CLI installed and `az login` current. The
deployment token is read from Azure at run time — it is never written to disk.

## Photo pipeline

```
Goosechase export .zip                              downloaded to ~/Downloads
  -> node scripts/ingestGoosechaseZip.js
ingest/raw/<Team>/<Mission>.jpg                     source photos, local only
  -> npm run optimize:images
public/users/<Team>/{avatar,lg,sm,thumbnail}.webp   deployed with the site
  -> npm run build  (prebuild)
public/photo-catalog.json                           which teams have photos
```

Everything under `ingest/` is working data and is gitignored. It sits outside
`public/` deliberately, so Next never copies the full-resolution originals into
the static export.

`src/utils/photoCatalog.ts` fetches `/photo-catalog.json` at startup. If it is
missing or empty every avatar falls back to a generated gradient — the app works
fine, it just has no faces.

Run the `goosechase-refresh` skill to rebuild all of this from a new export.

Deployed photos are publicly fetchable at the site URL. That is intended — the
raffle shows faces. Keeping the source files out of git protects the repo
history, not the live site.

## Why deploys are not run from CI

`public/users/` is generated locally and is not committed: this repo is public,
and the originals it derives from are ~340MB of personal photos.

CI only sees committed files, so a CI deploy would produce a build with every
avatar silently replaced by a gradient — and would overwrite a good local deploy
on the next merge to `main`. The GitHub Action
(`.github/workflows/deploy-raffle.yml`) therefore lints, builds, and verifies
only. It uploads the export as a build artifact but does not publish it.

## Build safety guard

Source photos live under `ingest/`, outside `public/`, so Next cannot copy them
into the export at all. As a legacy backstop `scripts/pruneStaticExport.js` still
strips a stray `out/originals-backup`, and both the GitHub Action and
`scripts/deployToAzure.js` refuse to proceed if one appears.

`scripts/deployToAzure.js` also warns when `out/users` is missing, since that
means the site would go live with gradients instead of faces.

## Host configuration

`staticwebapp.config.json` lives at the repo root, not in `public/`, because
`.gitignore` excludes `/public*` and it would otherwise be untracked. The
postbuild step copies it into `out/`.
