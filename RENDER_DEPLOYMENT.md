# Redeploy the current Alert X website on Render

This guide applies to the current `src/App.tsx` + root `server.ts` website.
Render builds the React assets and a JavaScript server, then runs `node server.js`
from the Docker image. The Express server serves both the website and its
`/api/time`, `/api/phivolcs-earthquakes`, and `/api/phivolcs-status` endpoints.
Use a **Web Service**, not a Static Site.

The current website uses demo/browser-side sign-in, local UI state, and simulated
email dispatch. Deployment does not enable durable recipient/settings storage,
server-enforced authorization, or real email delivery. The separate database API
in `server/src` is retained in the repository and tested, but is not the entry
point of this Render website. The older database deployment guide in
`DEPLOYMENT.md` describes that separate stack.

## Files to push

Push the complete current application source, not only `render.yaml`. In
particular, root `server.ts`, the new views/components/data files under `src`,
`package.json`, `package-lock.json`, `Dockerfile`, `render.yaml`,
`scripts/validate-render.mjs`, `scripts/smoke-web.mjs`, and
`.github/workflows/check.yml` must be included. Also include the updated
`.gitignore`, `.dockerignore`, this guide, and `docker-compose.yml` (which retains
an explicit entry point for the separate local database API).

Do not commit `.env`, `node_modules`, `dist`, or generated `server.js`. Docker
creates the build outputs. npm and `package-lock.json` are the deployment
package manager and lockfile; `bun.lock` is not used by these build commands.

Before committing, review `git status --short` and the changes in GitHub Desktop
or your editor. The current folder contains pre-existing modified and untracked
application files. Include the intended website files; do not commit private
operational data merely because it appears as untracked.

Local verification on Node 24:

```powershell
npm ci
npm run check:render
npm run check
npm run build
npm run test:web
npm test
npm run test:integration
```

`test:web` starts a temporary production server, verifies the health endpoint,
HTML, JavaScript asset, SPA route, and time API, and then stops it. It sends no
alerts and does not contact PHIVOLCS. The backend integration tests use an
isolated portable database unless `TEST_DATABASE_URL` is provided.

Commit the reviewed changes and push them to **main** in:
https://github.com/Glowmastar/Earthquake-Alert-within-Station-Area-of-Responsibility-Alert-X

## Redeploy an existing Blueprint

1. Open the Render Dashboard and select the **existing Blueprint** linked to
   this repository. Reuse it instead of creating a second Blueprint for the
   same resources.
2. Confirm the repository, branch **main**, and Blueprint path **render.yaml**.
3. Enable **Auto Sync**, or click **Manual Sync** after pushing these changes.
4. Inspect the proposed update to **alertx-api**. It remains a Docker Web
   Service in Singapore, using the existing paid `0.5c-512mb` plan. The Docker
   Command becomes **node server.js**. The health-check path is **/api/health**.
5. Check the service Settings after syncing. The **Pre-Deploy Command must be
   empty**. Remove any old `node build/server/migrate.js` hook if it remains.
6. Wait for GitHub's **Check Alert X** workflow to pass. Auto Deploy is **After
   CI Checks Pass**, so a failed or pending GitHub workflow prevents automatic
   deployment. Use **Manual Deploy → Deploy latest commit** if an initial
   deployment is needed after the checks pass.
7. Watch the Render logs for `Server running at http://0.0.0.0:10000`, then open
   the service's displayed `https://...onrender.com` URL.

The Blueprint no longer defines `alertx-worker` or `alertx-db` because this
website does not use them. Render does **not** delete resources removed from a
Blueprint. They can continue running and billing separately. Review any old
worker and suspend it if the old ingestion/delivery workflow is no longer
needed. Preserve the old database and its backups until you decide what data
you need; no database deletion is part of this change.

## If the old service was created manually

Pushing `render.yaml` does not automatically apply it to a manually configured
service. For an existing **Docker Web Service**, open Settings and use:

| Setting | Value |
|---|---|
| Repository | The GitHub repository above |
| Branch | `main` |
| Root Directory | Empty (repository root) |
| Dockerfile Path | `./Dockerfile` |
| Docker Build Context | `.` |
| Docker Command | `node server.js` |
| Pre-Deploy Command | Empty |
| Health Check Path | `/api/health` |
| Auto Deploy | After CI Checks Pass |

Set `NODE_ENV=production` and `PORT=10000` in Environment, then deploy the latest
commit. There is no separate Build Command or Start Command for this Docker
configuration; the Dockerfile supplies the build steps.

If creating a replacement service, choose **New → Blueprint**, connect the
repository, select **main**, and use **render.yaml**. Review the plan and
resource preview before deploying. Do not create a duplicate Blueprint when
your existing one can be synced. If the existing service has a different name
from `alertx-api`, update the YAML name to match before attempting to manage it
with this Blueprint, or intentionally create a separate replacement service.

## Environment and files on Render

You do not upload source files individually to Render. Render clones the
selected GitHub commit and builds the Docker image.

Only `NODE_ENV=production` and `PORT=10000` are required for this website. No
Postgres connection, S3 bucket, SMTP credentials, Gemini key, or Firebase setup
is required by the active entry point. Existing unused variables can remain;
do not copy secrets into GitHub. Render provides the public HTTPS URL.

## Verify and troubleshoot

- Open `/api/health`: expect JSON `{"status":"ok"}`.
- Open `/api/time`: expect JSON with `success: true` and Asia/Manila time.
- Open `/`: verify the website and navigation load.
- Open `/api/phivolcs-earthquakes`: a successful upstream request returns records;
  an upstream failure may return 502. This is separate from website health.
- If logs still mention `build/server/index.js`, PostgreSQL, or migrations,
  the service is still using an old Docker Command or Pre-Deploy Command.
- If `npm ci` rejects the lockfile, ensure both package files from this change
  were committed together. Do not work around it by deleting the lockfile.
- If automatic deploy does not begin, inspect GitHub Actions and Render Events.
  Confirm Render's GitHub app can access the repository and the linked branch
  is `main`.
- If a cached build appears stale after updating settings, use Render's
  **Clear build cache & deploy** action.

The Blueprint retains the existing paid compute plan. If you choose a free
instance in Render, update the Blueprint plan too so future syncs do not restore
the paid plan; review free-service limits before making that choice.

Official references:
- [Render Blueprint configuration](https://render.com/docs/blueprint-spec)
- [Managing and syncing existing Blueprints](https://render.com/docs/infrastructure-as-code)
- [Deploys and CI-triggered deployment](https://render.com/docs/deploys)
