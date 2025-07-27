# Running the apps locally

To avoid browser CORS restrictions when loading files like `script.js`, start a simple HTTP server from the repository root.
You can use Python or Node:

```bash
python3 -m http.server
```

# or using Node
node server.js

Then open <http://localhost:8000/index.html> in your browser.

## Customizing App1 Labels

`apps/app1/app-data/app1.json` controls the text used by `apps/app1`. Edit the menu labels,
window titles or the icons array in that file and reload the page to see your
changes. You can also adjust optional settings like the clock format.
