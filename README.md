# Uno Multiplayer

Real-time multiplayer UNO. Players create or join a room and play against each other in the browser over WebSockets.

Built on Next.js 15 with a custom Socket.IO server, bundled into the same deployment rather than split into a separate service.

## What it does

- Create a room, share the code, join with up to four players
- Full UNO rules: draw, play, skip, reverse, wild, wild draw-four
- Colour and value wild-card selection
- Winner announcement and rematch
- Draw detection and automatic reshuffle on discard pile exhaustion

## Stack

| | |
|---|---|
| Framework | Next.js 15, React 19 |
| Language | TypeScript |
| Realtime | Socket.IO 4 |
| Animation | Motion 12 |
| Styling | Tailwind CSS 3 |

## Architecture

The Socket.IO server lives in `server.ts` and compiles alongside the Next.js app through `tsconfig.server.json`. Both ship in one deployment:

```
src/          React components, game state, UI
server.ts     Socket.IO server: room creation, turn order, rule enforcement
```

Rule enforcement lives on the server, not the client. Clients render what the server tells them, which keeps the game consistent between players and stops a modified client from cheating its way through a turn.

## Running locally

```bash
git clone https://github.com/rudalkunwar/uno-multiplayer.git
cd uno-multiplayer
npm install
npm run dev
```

Open `http://localhost:3000`, create a room, and share the code.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Next.js and the socket server, with hot reload |
| `npm run build` | Next.js production build plus server TypeScript compile |
| `npm start` | Runs the compiled `dist/server.js` |

## License

MIT
