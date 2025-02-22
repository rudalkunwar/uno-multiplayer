UNO Game Project
Welcome to the UNO Game Project! This repository contains a visually appealing, mobile-responsive UNO game built with Next.js and TypeScript. The game supports 2 to 4 players and follows the classic UNO rules with additional enhancements like smooth animations, sound effects, and optional AI opponents.

Table of Contents
Overview
Features
Project Structure
Game Rules
Installation & Setup
Running the Game
Technologies Used
Contributing
License
Overview
The UNO Game Project is designed to offer a fun, interactive gaming experience that is both visually appealing and easy to use on mobile devices. It leverages the power of Next.js and TypeScript to deliver a robust and scalable application. Whether you're playing in a local multiplayer setting via WebSockets or challenging AI opponents, this project lays the groundwork for a seamless UNO gameplay experience.

Features
Mobile Responsive UI:
Crafted with Tailwind CSS to ensure the game looks great on both desktop and mobile devices.

Real-Time Multiplayer:
Supports real-time gameplay for 2 to 4 players through WebSocket integration.

Smooth Animations:
Utilizes Framer Motion for dynamic transitions and card movements.

Sound Effects & Visual Feedback:
Enhances gameplay with immersive sound effects and subtle animations.

AI Opponents:
Provides AI logic for single-player mode if human players are unavailable.

Accessibility:
Designed with accessibility in mind, featuring keyboard navigability and screen reader support.

Project Structure
plaintext
Copy
Edit
uno-game/
│── public/               // Static assets (images, card designs, audio)
│── src/
│   ├── components/       // Reusable UI components
│   │   ├── Card.tsx          // Renders individual UNO cards
│   │   ├── Player.tsx        // Manages player hands and actions
│   │   ├── GameBoard.tsx     // Main area where the game is displayed
│   │   ├── Deck.tsx          // Manages deck display and shuffling
│   │   ├── Controls.tsx      // Buttons for actions (Play, Draw, etc.)
│   ├── pages/            // Next.js pages for routing
│   │   ├── index.tsx         // Home screen and game setup
│   │   ├── game.tsx          // Game interface (main gameplay)
│   │   ├── lobby.tsx         // Pre-game lobby for player setup
│   ├── hooks/            // Custom React hooks (e.g., useGameLogic)
│   ├── utils/            // Utility functions for game logic
│   │   ├── gameRules.ts      // Implements core UNO rules and mechanics
│   │   ├── aiPlayer.ts       // Optional: logic for AI-controlled players
│   │   ├── shuffle.ts        // Utility for deck shuffling
│   ├── context/          // Global game state management (React Context)
│   ├── styles/           // Tailwind CSS or other styling frameworks
│── package.json          // Project dependencies
│── tsconfig.json         // TypeScript configuration
│── next.config.js        // Next.js configuration
│── README.md             // Project documentation and guidelines
Game Rules
Objective
Be the first to discard all your cards.

Gameplay
Players: Minimum 2, Maximum 4.
Starting Hand: Each player is dealt 7 cards.
Starting Card: A card is drawn from the deck to start the discard pile.
Turn Mechanics:
Play a card that matches the color or number of the card on the discard pile.
If you cannot play, draw a card.
When a player has one card left, they must call "UNO!".
Winning:
The first player to empty their hand wins the round. Scoring is based on the remaining cards in opponents' hands.
Card Types
Number Cards (0-9): Play by matching color or number.
Action Cards:
Skip: Next player loses their turn.
Reverse: Reverses the order of play.
Draw Two: Next player draws two cards.
Wild: Change the current color.
Wild Draw Four: Change color and force the next player to draw four cards.