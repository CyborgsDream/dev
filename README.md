# KodeDok DEV

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
