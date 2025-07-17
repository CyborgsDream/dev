# DEV

This project includes a small Node.js server used to serve `index.html` and list any additional `.html` or `.htm` files in the project directory.

## Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine.
- `npm` is bundled with Node.js.

## Running locally

1. Clone or download this repository.
2. In the project directory, install dependencies (there are none, but this creates `node_modules`):
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
   This runs `node server.js` and starts the server on port **3000** by default.
4. Open your browser and visit [http://localhost:3000/](http://localhost:3000/). The page will display links to any `.html`/`.htm` files in this directory.

## Notes

The `server.js` file scans the project directory for HTML files. When you add more `.html`/`.htm` files alongside `index.html`, they will automatically appear in the list on the dashboard page once you refresh the page.

## JSON based content pages

Content pages are now stored as JSON files inside `data/pages`. The list of pages is defined in `data/pages.json`. Each page JSON contains a `title` and `body` field. The `page.html` template reads these files and displays the content dynamically.

To add a new page:

1. Create a new JSON file in `data/pages` (e.g. `my-page.json`).
2. Add an entry for it in `data/pages.json` with the desired slug and title.
3. Navigate to `page.html?slug=my-page` to view it.
