Frontend deployment notes
------------------------

This static frontend expects a generated `config.js` file at the site root that sets `window.__API_BASE__`.

How `config.js` is created
- Locally: run from repo root:

```powershell
$env:FRONTEND_API_BASE='http://localhost:3000'; node .\scripts\inject-api-base.js
```

- On Vercel: set Environment Variable `FRONTEND_API_BASE` to your backend URL (e.g. `https://your-backend.vercel.app`) and set the Frontend project's Build Command to:

```
node ./scripts/inject-api-base.js
```

This will write `frontend/config.js` containing the normalized backend URL. The frontend will fall back to an empty string (relative `/api` calls) if `FRONTEND_API_BASE` is empty.
