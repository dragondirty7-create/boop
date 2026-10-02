// Rhythm Rush React Source Code
// Origin: Gemini Canvas prototype export preserved in Drive.
// This file keeps the recovered shell in GitHub while the playable mobile MVP lives in ./index.html.

import React, { useState } from 'react';

export default function RhythmRush() {
  const [gameState, setGameState] = useState('menu');

  return (
    <main
      className="eec-studio-room"
      style={{
        minHeight: '100svh',
        background: '#0d1117',
        color: '#f0f6fc',
        padding: 'max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom))'
      }}
    >
      <section style={{ width: 'min(100%, 760px)', margin: '0 auto' }}>
        <header style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(28px, 8vw, 48px)' }}>Rhythm Rush</h1>
          <p style={{ color: '#8b949e' }}>Welcome to the Arcade, Cosmo is waiting.</p>
        </header>

        <div
          className="game-container"
          style={{
            padding: 20,
            border: '1px solid #30363d',
            borderRadius: 22,
            background: '#161b22'
          }}
        >
          <p>This file preserves the structural React export from the Gemini Canvas prototype.</p>
          <p>The mobile-first playable BOOP MVP is in <code>rhythm-rush/index.html</code>.</p>
          <button
            type="button"
            onClick={() => setGameState(gameState === 'menu' ? 'ready' : 'menu')}
            style={{ minHeight: 48, padding: '0 18px', borderRadius: 14 }}
          >
            {gameState === 'menu' ? 'Ready up' : 'Back to menu'}
          </button>
        </div>
      </section>
    </main>
  );
}
