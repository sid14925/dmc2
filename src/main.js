import { Game } from './core/Game.js';

// Devil May Cry - Mobile Web Port
// ================================

let game;

function boot() {
  const loadingBar = document.getElementById('loading-bar');
  const loadingScreen = document.getElementById('loading-screen');

  // Simulate loading progress
  let progress = 0;
  const loadInterval = setInterval(() => {
    progress += 5 + Math.random() * 15;
    if (progress >= 100) {
      progress = 100;
      clearInterval(loadInterval);

      // Create and initialize game
      game = new Game();
      game.init();

      // Fade out loading screen
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);

      // Start game loop
      game.update();
    }
    loadingBar.style.width = `${Math.min(100, progress)}%`;
  }, 100);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

// Handle visibility change - pause when tab is hidden
document.addEventListener('visibilitychange', () => {
  if (!game) return;
  if (document.hidden && game.state === 'playing') {
    game.pause();
  }
});

// Prevent pull-to-refresh on mobile
document.body.addEventListener('touchmove', (e) => {
  if (e.touches.length === 1) {
    e.preventDefault();
  }
}, { passive: false });
