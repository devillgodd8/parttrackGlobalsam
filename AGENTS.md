# Repository Guidelines

## Project Structure & Module Organization
- **HTML Pages (Root)**: Static web pages (`index.html`, `about-us.html`, `contact-us.html`, `track-order.html`, and policy pages) representing individual site routes.
- **Express Server (`server.js`)**: Node.js backend providing gzip compression, security headers (`nosniff`, `SAMEORIGIN`, `HSTS`), static asset caching (30-day max-age in production), clean URL rewriting (stripping `.html`), and the mock tracking API (`GET /api/v1/track/:trackingNumber`).
- **Client Scripts (`assets/view/js/`)**:
  - `part.js`: Quote form validation, vehicle model selection logic, and AJAX submission via Web3Forms.
  - `track-widget.js`: PartTrack consignment tracking widget interacting with the tracking endpoint.
- **Styles & Assets (`assets/view/css/`, `assets/images/`, `images/`)**: CSS stylesheets (`style8e0e.css`, `track-widget.css`, `bootstrap.min.css`) and static image assets.
- **Multi-Platform Hosting Configurations**:
  - `vercel.json`: Vercel rewrites, 301 redirects to clean URLs, and asset cache headers.
  - `netlify.toml`: Netlify build settings, pretty URLs, 301 redirects, and caching headers.
  - `.htaccess`: Apache mod_rewrite rules for extensionless URLs and mod_expires headers.

## Build, Test, and Development Commands
- `npm start`: Start the Express server on port 3000 (or `PORT` env var).
- `npm run dev`: Start the server in development mode.
- *Node Environment*: Requires Node.js `>=20.x`. No automated test suite or linter is configured in `package.json`.

## Commit & Pull Request Guidelines
- Commit history follows concise, lowercase summaries (e.g., `api changes`, `first commit`).
- Keep commits focused on specific functional changes or routing updates.
