# Project Overview

## Purpose
"Sola Fide: The Luther Run" - A 3D educational game about Luther's exegesis of Matthew 7:21. Players navigate theological dilemmas, choose between grace and works-righteousness, and debate with Erasmus.

## Tech Stack
- **Frontend**: React 19.2.3 with TypeScript 5.8.2
- **Build Tool**: Vite 6.2.0
- **3D Graphics**: React Three Fiber 9.4.2 + React Three Drei 10.7.7 + Three.js 0.182.0
- **Backend**: Express 5.2.1 server
- **AI Integration**: Google Gemini AI (@google/genai)
- **State Management**: React Context API + useReducer
- **Package Manager**: npm (uses package-lock.json)

## Project Structure
- **Root files**: Main app entry points (`index.tsx`, `App.tsx`, `GameApp.tsx`)
- **`/components`**: React components (GameCanvas, DebateInterface, ArtStudio, MapInterface, ErrorBoundary)
- **`/context`**: GameContext for centralized state management
- **`/hooks`**: Custom React hooks (useCanvasDrawing)
- **`/services`**: External service integrations (audio.ts, gemini.ts)
- **`/constants.ts`**: Game configuration, colors, questions
- **`/types.ts`**: TypeScript type definitions and enums
- **`server.ts`**: Express backend for Gemini API integration
- **`/verification`**: Test/verification files
