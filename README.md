# ASMP Shops & Waytones

A web application for tracking Minecraft shops and waystones across different dimensions. Built with React, Vite, Node.js and Express.

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev` (runs Vite dev server on port 5173)
4. In another terminal, start the backend: `npm start` (runs Express server on port 49876)
5. Open `http://localhost:5173` in your browser

## Production Build

1. Build the React app: `npm run build`
2. Set `NODE_ENV=production` and start the server: `npm start`
3. The server will serve the React app from the `dist` folder

## Configuration

- Edit `news.json` to manage server announcements
- Modify `ignoredShops.json` and `ignoredWaystones.json` to filter data
- Update `graphs.json` to manage graph data

## API Endpoints

- `GET /asmp/api/shops` - Get all shop data
- `GET /asmp/api/waystones` - Get all waystone data
- `GET /asmp/api/graphs` - Get graph data
- `GET /asmp/api/news` - Get news data
- `POST /asmp/post` - Submit new shop/waystone data (for mod integration)
- `POST /asmp/api/delete` - Delete shop or waystone

## Tech Stack

- **Frontend**: React 18, React Router, Chart.js
- **Backend**: Node.js, Express
- **Build Tool**: Vite

## Contributing

Fork the project, make your changes, and open a pull request!

## License

