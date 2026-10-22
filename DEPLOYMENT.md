# Deploying La Galleria to Render

This project uses a Render web service for the Express API, a Render static
site for the React app, and MongoDB Atlas for the database.

## 1. Create a MongoDB Atlas database

1. Create an Atlas project and an M0 cluster.
2. Create a database user with a strong password.
3. Add `0.0.0.0/0` to the Atlas IP access list so Render can connect. Use a
   dedicated database user with only the permissions this app needs.
4. Copy the Atlas connection string. Replace its username and password with
   the database user's credentials and set the database name to `reststay`.
   Keep this connection string private.

## 2. Deploy the Render Blueprint

1. Push the deployment files to the `main` branch on GitHub.
2. In Render, choose **New > Blueprint**, connect the
   `meme517/La_galleria` repository, and select `main`.
3. Render reads `render.yaml` and creates the API and static-site services.
   When prompted for `MONGO_URI`, provide the Atlas connection string.
4. For `CORS_ORIGINS`, enter the static site's exact origin, such as
   `https://la-galleria-web.onrender.com` (no trailing slash). If Render gives
   the site a different hostname, use that hostname instead.
5. Render generates `JWT_SECRET` automatically. Do not replace it with a
   committed or locally reused secret.

The Blueprint sets `VITE_API_URL` to `https://la-galleria-api.onrender.com`.
If Render assigns the API a different hostname, change `VITE_API_URL` in the
static site's Environment settings to the API origin and trigger a new
frontend deploy. The app uses this setting for both API and Socket.IO traffic.

## 3. Verify the deployment

- Open the static site's URL; it should show the public La Galleria landing
  page.
- Open the API service URL ending in `/`; it should return
  `{"status":"ok"}`.
- Test sign-in and other API-backed features.

If you add a custom domain, update `CORS_ORIGINS` on the API service to include
the exact `https://` origin, then redeploy the API.

## Optional email configuration

If the app needs to send email, set `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`,
and `EMAIL_PASS` in the API service's Render Environment settings. These are
secrets and must not be committed.

## Local environment files

Copy `client/.env.example` to `client/.env` and `server/.env.example` to
`server/.env` for local development. Local `.env` files are ignored by Git;
set production values in Render's Environment settings instead.
