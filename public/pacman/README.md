# Pac-Man Game

A complete, playable Pac-Man clone built with **HTML5 Canvas** and **vanilla JavaScript**, organized as a small project with separate modules for the maze, Pac-Man, ghosts, and shared utilities.

## Features

- **Classic 19x23 tile maze** with tunnels and a ghost house
- **Pac-Man movement** with smooth 60 FPS animation and mouth opening/closing
- **Dots and power pellets**
  - Dots: +10 points
  - Power pellets: +50 points and turn ghosts blue (frightened mode)
- **Four ghosts with simple AI**
  - **Blinky (red)** – direct chase
  - **Pinky (pink)** – targets tiles ahead of Pac‑Man
  - **Inky (cyan)** – flanks using Blinky’s position
  - **Clyde (orange)** – chases when far, scatters when close
- **Frightened (blue) mode**
  - Triggered by power pellets
  - Ghosts slow down, reverse direction, and become edible
  - Consecutive ghosts: 200 / 400 / 800 / 1600 points
- **Fruits** that appear mid‑level for bonus points
- **Scoring, lives, levels, and high score**
  - 3 starting lives
  - Extra life at **10,000** points
  - Levels get faster and power time gets shorter
- **Web Audio API** beeps for:
  - Dot eat
  - Power pellet
  - Ghost eaten
  - Death
- **Responsive layout** – canvas scales to fit while preserving aspect ratio

## Project Structure

```text
pacman-game/
  index.html       # Main entry (open this in your browser)
  styles.css       # Layout and HUD styling
  README.md        # This file
  js/
    utils.js       # Helpers, Web Audio sounds, math utils
    maze.js        # Maze definition, tile helpers, collision helpers
    pacman.js      # Pac-Man entity + movement + drawing
    ghosts.js      # Ghost entities, AI, movement, drawing
    main.js        # Game loop, state management, input, HUD updates
```

## How to Run

1. Place the `pacman-game` folder anywhere on your machine.
2. Open `index.html` directly in a modern desktop browser (Chrome, Edge, Firefox, etc.).
   - No build step or server is required.
3. Play!

> If your browser blocks some audio features on file URLs, simply allow audio when prompted or run a tiny static server (for example: `npx serve` in this folder).

## Controls

- **Arrow keys** – Move Pac‑Man
- **P** – Pause / unpause
- **R** – Restart current level

## Notes

- The implementation aims to be **faithful but approachable**, favoring clarity over perfect arcade‑exact behavior.
- All sounds are generated via the **Web Audio API** in `js/utils.js` – there are **no external assets**.

