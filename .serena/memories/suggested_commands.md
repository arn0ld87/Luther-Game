# Suggested Commands

## Development
- **Start dev server**: `npm run dev` (Vite dev server with HMR)
- **Start backend server**: `npm run server` (Express server on port 3000)
- **Build for production**: `npm run build` (creates dist/ folder)
- **Preview production build**: `npm run preview`

## Running Both Servers
For full functionality, run both:
1. Terminal 1: `npm run server` (backend API)
2. Terminal 2: `npm run dev` (frontend)

The Vite dev server proxies `/api` requests to `http://localhost:3000`.

## Environment Setup
- Create `.env.local` with `GEMINI_API_KEY=<your-key>` for AI features
- The server loads from `.env` via dotenv

## System Commands (macOS/Darwin)
Standard BSD/macOS tools available: `ls`, `grep`, `find`, `cd`, etc.
