Frontend deployment notes
------------------------

This static frontend expects a generated `config.js` file at the site root that sets `window.__API_BASE__`.

How `config.js` is created

- Locally (recommended): run from the `frontend` folder:

```powershell
cd frontend
$env:FRONTEND_API_BASE='http://localhost:3000'; node .\scripts\inject-api-base.js
```

- On Vercel: set Environment Variable `FRONTEND_API_BASE` to your backend URL (e.g. `https://your-backend.vercel.app`) and set the Frontend project's Build Command to run the injector before publishing. Example build command (project root = repo root):

```
node ./frontend/scripts/inject-api-base.js
```

Or if your Vercel project root is `frontend`, set the build command to:

```
node ./scripts/inject-api-base.js
```

This will write `frontend/config.js` containing the normalized backend URL. The frontend will fall back to an empty string (relative `/api` calls) if `FRONTEND_API_BASE` is empty.
