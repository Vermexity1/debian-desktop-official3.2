import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────
// GAME: SNAKE
// ─────────────────────────────────────────────
function SnakeGame({ onExit }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    snake: [{ x: 10, y: 10 }],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    food: { x: 15, y: 10 },
    score: 0,
    running: false,
    dead: false,
  });
  const [score, setScore] = useState(0);
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const CELL = 20, COLS = 25, ROWS = 20;

  const spawnFood = useCallback((snake) => {
    let pos;
    do {
      pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    return pos;
  }, []);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.snake = [{ x: 12, y: 10 }, { x: 11, y: 10 }, { x: 10, y: 10 }];
    s.dir = { x: 1, y: 0 };
    s.nextDir = { x: 1, y: 0 };
    s.food = spawnFood(s.snake);
    s.score = 0;
    s.running = true;
    s.dead = false;
    setScore(0);
    setDead(false);
    setStarted(true);
  }, [spawnFood]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const draw = () => {
      const s = stateRef.current;
      ctx.fillStyle = "#0f1923";
      ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

      // Grid
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) {
        ctx.strokeRect(x * CELL, y * CELL, CELL, CELL);
      }

      // Food
      ctx.fillStyle = "#e63946";
      ctx.shadowColor = "#e63946";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(s.food.x * CELL + CELL / 2, s.food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Snake
      s.snake.forEach((seg, i) => {
        const ratio = i / s.snake.length;
        const r = Math.floor(26 + (139 - 26) * (1 - ratio));
        const g = Math.floor(188 + (233 - 188) * (1 - ratio));
        const b = Math.floor(156 + (96 - 156) * (1 - ratio));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        if (i === 0) {
          ctx.shadowColor = "#7fff7f";
          ctx.shadowBlur = 10;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.beginPath();
        ctx.roundRect(seg.x * CELL + 2, seg.y * CELL + 2, CELL - 4, CELL - 4, 4);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    };

    const tick = () => {
      const s = stateRef.current;
      if (!s.running) return;
      s.dir = s.nextDir;
      const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS || s.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        s.running = false;
        s.dead = true;
        setDead(true);
        return;
      }
      s.snake.unshift(head);
      if (head.x === s.food.x && head.y === s.food.y) {
        s.score++;
        setScore(s.score);
        s.food = spawnFood(s.snake);
      } else {
        s.snake.pop();
      }
    };

    let lastTick = 0;
    let animId;
    const loop = (ts) => {
      animId = requestAnimationFrame(loop);
      const interval = Math.max(80, 150 - stateRef.current.score * 2);
      if (ts - lastTick > interval) {
        tick();
        lastTick = ts;
      }
      draw();
    };
    animId = requestAnimationFrame(loop);

    const onKey = (e) => {
      const s = stateRef.current;
      if (!s.running) return;
      const map = {
        ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 }, s: { x: 0, y: 1 }, a: { x: -1, y: 0 }, d: { x: 1, y: 0 },
      };
      const nd = map[e.key];
      if (nd && !(nd.x === -s.dir.x && nd.y === -s.dir.y)) {
        s.nextDir = nd;
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("keydown", onKey); };
  }, [spawnFood]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: 24, background: "#0f1923", height: "100%", justifyContent: "center" }}>
      <div style={{ display: "flex", justifyContent: "space-between", width: COLS * CELL, alignItems: "center" }}>
        <span style={{ color: "#7fff7f", fontSize: "1.1rem", fontWeight: 700, fontFamily: "monospace" }}>🐍 SNAKE</span>
        <span style={{ color: "white", fontSize: "1rem", fontFamily: "monospace" }}>Score: {score}</span>
        <button onClick={onExit} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", padding: "4px 12px", borderRadius: 4, cursor: "pointer" }}>← Back</button>
      </div>
      <div style={{ position: "relative" }}>
        <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} style={{ border: "2px solid rgba(127,255,127,0.3)", borderRadius: 4, display: "block" }} />
        {!started && !dead && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", gap: 12 }}>
            <div style={{ color: "#7fff7f", fontSize: "2rem", fontWeight: 700 }}>🐍 SNAKE</div>
            <div style={{ color: "#aaa", fontSize: "0.85rem" }}>Use Arrow Keys or WASD to move</div>
            <button onClick={startGame} style={{ background: "#7fff7f", color: "#0f1923", border: "none", padding: "10px 28px", borderRadius: 6, fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}>START</button>
          </div>
        )}
        {dead && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", gap: 12 }}>
            <div style={{ color: "#e63946", fontSize: "2rem", fontWeight: 700 }}>GAME OVER</div>
            <div style={{ color: "white", fontSize: "1.2rem" }}>Score: {score}</div>
            <button onClick={startGame} style={{ background: "#7fff7f", color: "#0f1923", border: "none", padding: "10px 28px", borderRadius: 6, fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}>PLAY AGAIN</button>
          </div>
        )}
      </div>
      <div style={{ color: "#666", fontSize: "0.75rem" }}>Arrow Keys / WASD to move • Eat red orbs to grow</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// GAME: TETRIS
// ─────────────────────────────────────────────
const TETROMINOS = [
  { shape: [[1,1,1,1]], color: "#00f5ff" },
  { shape: [[1,1],[1,1]], color: "#ffd700" },
  { shape: [[0,1,0],[1,1,1]], color: "#a855f7" },
  { shape: [[1,0],[1,0],[1,1]], color: "#f97316" },
  { shape: [[0,1],[0,1],[1,1]], color: "#3b82f6" },
  { shape: [[1,1,0],[0,1,1]], color: "#22c55e" },
  { shape: [[0,1,1],[1,1,0]], color: "#ef4444" },
];

function TetrisGame({ onExit }) {
  const COLS = 10, ROWS = 20, CELL = 28;
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);

  const newPiece = () => {
    const t = TETROMINOS[Math.floor(Math.random() * TETROMINOS.length)];
    return { shape: t.shape, color: t.color, x: Math.floor(COLS / 2) - Math.floor(t.shape[0].length / 2), y: 0 };
  };

  const rotate = (shape) => shape[0].map((_, i) => shape.map(r => r[i]).reverse());

  const collides = (board, piece, ox = 0, oy = 0) => {
    for (let r = 0; r < piece.shape.length; r++)
      for (let c = 0; c < piece.shape[r].length; c++)
        if (piece.shape[r][c]) {
          const nx = piece.x + c + ox, ny = piece.y + r + oy;
          if (nx < 0 || nx >= COLS || ny >= ROWS || (ny >= 0 && board[ny][nx])) return true;
        }
    return false;
  };

  const startGame = useCallback(() => {
    const board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    const piece = newPiece();
    stateRef.current = { board, piece, next: newPiece(), score: 0, lines: 0, running: true, dead: false };
    setScore(0); setLines(0); setDead(false); setStarted(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const draw = () => {
      const s = stateRef.current;
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

      // Grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) ctx.strokeRect(c * CELL, r * CELL, CELL, CELL);

      // Board
      if (s) {
        s.board.forEach((row, r) => row.forEach((val, c) => {
          if (val) {
            ctx.fillStyle = val;
            ctx.shadowColor = val;
            ctx.shadowBlur = 6;
            ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "rgba(255,255,255,0.2)";
            ctx.strokeRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
          }
        }));

        // Ghost piece
        if (s.piece) {
          let ghostY = 0;
          while (!collides(s.board, s.piece, 0, ghostY + 1)) ghostY++;
          ctx.globalAlpha = 0.2;
          s.piece.shape.forEach((row, r) => row.forEach((val, c) => {
            if (val) {
              ctx.fillStyle = s.piece.color;
              ctx.fillRect((s.piece.x + c) * CELL + 1, (s.piece.y + r + ghostY) * CELL + 1, CELL - 2, CELL - 2);
            }
          }));
          ctx.globalAlpha = 1;

          // Active piece
          s.piece.shape.forEach((row, r) => row.forEach((val, c) => {
            if (val && s.piece.y + r >= 0) {
              ctx.fillStyle = s.piece.color;
              ctx.shadowColor = s.piece.color;
              ctx.shadowBlur = 8;
              ctx.fillRect((s.piece.x + c) * CELL + 1, (s.piece.y + r) * CELL + 1, CELL - 2, CELL - 2);
              ctx.shadowBlur = 0;
              ctx.strokeStyle = "rgba(255,255,255,0.3)";
              ctx.strokeRect((s.piece.x + c) * CELL + 1, (s.piece.y + r) * CELL + 1, CELL - 2, CELL - 2);
            }
          }));
        }
      }
    };

    const lock = (s) => {
      s.piece.shape.forEach((row, r) => row.forEach((val, c) => {
        if (val && s.piece.y + r >= 0) s.board[s.piece.y + r][s.piece.x + c] = s.piece.color;
      }));
      let cleared = 0;
      for (let r = ROWS - 1; r >= 0; ) {
        if (s.board[r].every(v => v)) { s.board.splice(r, 1); s.board.unshift(Array(COLS).fill(0)); cleared++; }
        else r--;
      }
      s.lines += cleared;
      s.score += [0, 100, 300, 500, 800][cleared] || 0;
      setScore(s.score); setLines(s.lines);
      s.piece = s.next;
      s.next = newPiece();
      if (collides(s.board, s.piece)) { s.running = false; s.dead = true; setDead(true); }
    };

    let lastTick = 0, animId;
    const loop = (ts) => {
      animId = requestAnimationFrame(loop);
      const s = stateRef.current;
      if (s && s.running) {
        const speed = Math.max(100, 500 - Math.floor(s.lines / 10) * 50);
        if (ts - lastTick > speed) {
          if (!collides(s.board, s.piece, 0, 1)) s.piece.y++;
          else lock(s);
          lastTick = ts;
        }
      }
      draw();
    };
    animId = requestAnimationFrame(loop);

    const onKey = (e) => {
      const s = stateRef.current;
      if (!s || !s.running) return;
      if (e.key === "ArrowLeft" && !collides(s.board, s.piece, -1, 0)) { s.piece.x--; e.preventDefault(); }
      else if (e.key === "ArrowRight" && !collides(s.board, s.piece, 1, 0)) { s.piece.x++; e.preventDefault(); }
      else if (e.key === "ArrowDown") { if (!collides(s.board, s.piece, 0, 1)) s.piece.y++; e.preventDefault(); }
      else if (e.key === "ArrowUp" || e.key === "x") {
        const rotated = { ...s.piece, shape: rotate(s.piece.shape) };
        if (!collides(s.board, rotated)) s.piece.shape = rotated.shape;
        e.preventDefault();
      } else if (e.key === " ") {
        while (!collides(s.board, s.piece, 0, 1)) s.piece.y++;
        lock(s);
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("keydown", onKey); };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: 24, background: "#111", height: "100%", justifyContent: "center" }}>
      <div style={{ display: "flex", justifyContent: "space-between", width: COLS * CELL + 120, alignItems: "center" }}>
        <span style={{ color: "#00f5ff", fontSize: "1.1rem", fontWeight: 700, fontFamily: "monospace" }}>🧱 TETRIS</span>
        <button onClick={onExit} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", padding: "4px 12px", borderRadius: 4, cursor: "pointer" }}>← Back</button>
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ position: "relative" }}>
          <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} style={{ border: "2px solid rgba(0,245,255,0.3)", borderRadius: 4, display: "block" }} />
          {!started && !dead && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", gap: 12 }}>
              <div style={{ color: "#00f5ff", fontSize: "2rem", fontWeight: 700 }}>TETRIS</div>
              <div style={{ color: "#aaa", fontSize: "0.85rem", textAlign: "center" }}>← → Move &nbsp;↑/X Rotate<br/>↓ Soft Drop &nbsp;Space Hard Drop</div>
              <button onClick={startGame} style={{ background: "#00f5ff", color: "#111", border: "none", padding: "10px 28px", borderRadius: 6, fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}>START</button>
            </div>
          )}
          {dead && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", gap: 12 }}>
              <div style={{ color: "#ef4444", fontSize: "2rem", fontWeight: 700 }}>GAME OVER</div>
              <div style={{ color: "white" }}>Score: {score} | Lines: {lines}</div>
              <button onClick={startGame} style={{ background: "#00f5ff", color: "#111", border: "none", padding: "10px 28px", borderRadius: 6, fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}>PLAY AGAIN</button>
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, color: "white", fontFamily: "monospace", minWidth: 100 }}>
          <div style={{ background: "rgba(255,255,255,0.06)", padding: 10, borderRadius: 6 }}>
            <div style={{ color: "#aaa", fontSize: "0.7rem" }}>SCORE</div>
            <div style={{ fontSize: "1.3rem", color: "#00f5ff" }}>{score}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.06)", padding: 10, borderRadius: 6 }}>
            <div style={{ color: "#aaa", fontSize: "0.7rem" }}>LINES</div>
            <div style={{ fontSize: "1.3rem", color: "#ffd700" }}>{lines}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.06)", padding: 10, borderRadius: 6 }}>
            <div style={{ color: "#aaa", fontSize: "0.7rem" }}>LEVEL</div>
            <div style={{ fontSize: "1.3rem", color: "#a855f7" }}>{Math.floor(lines / 10) + 1}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// GAME: FLAPPY BIRD
// ─────────────────────────────────────────────
function FlappyGame({ onExit }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState("idle"); // idle, running, dead

  const W = 400, H = 500, GAP = 150, PIPE_W = 60, BIRD_R = 16;

  const resetState = () => ({
    bird: { y: H / 2, vy: 0 },
    pipes: [],
    score: 0,
    frame: 0,
    running: false,
  });

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    if (!s.running) {
      s.running = true;
      setGameState("running");
    }
    s.bird.vy = -8;
  }, []);

  useEffect(() => {
    stateRef.current = resetState();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const draw = () => {
      const s = stateRef.current;
      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#1a1a3e");
      sky.addColorStop(1, "#2d1b69");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Stars
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      [{ x: 50, y: 60 }, { x: 120, y: 30 }, { x: 200, y: 80 }, { x: 300, y: 40 }, { x: 370, y: 100 }, { x: 80, y: 150 }, { x: 350, y: 200 }].forEach(st => {
        ctx.beginPath(); ctx.arc(st.x, st.y, 1.5, 0, Math.PI * 2); ctx.fill();
      });

      // Ground
      ctx.fillStyle = "#5d4e37";
      ctx.fillRect(0, H - 50, W, 50);
      ctx.fillStyle = "#7a6347";
      ctx.fillRect(0, H - 50, W, 8);

      // Pipes
      s.pipes.forEach(p => {
        const grad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_W, 0);
        grad.addColorStop(0, "#2d8a3e");
        grad.addColorStop(0.5, "#4aad58");
        grad.addColorStop(1, "#1e6b2e");
        ctx.fillStyle = grad;
        // Top pipe
        ctx.fillRect(p.x, 0, PIPE_W, p.top);
        ctx.fillRect(p.x - 5, p.top - 20, PIPE_W + 10, 20);
        // Bottom pipe
        ctx.fillRect(p.x, p.top + GAP, PIPE_W, H - 50 - (p.top + GAP));
        ctx.fillRect(p.x - 5, p.top + GAP, PIPE_W + 10, 20);
      });

      // Bird
      const bx = 80, by = s.bird.y;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(Math.min(Math.max(s.bird.vy * 0.05, -0.5), 1));
      // Body
      const birdGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, BIRD_R);
      birdGrad.addColorStop(0, "#ffe066");
      birdGrad.addColorStop(1, "#f4a800");
      ctx.fillStyle = birdGrad;
      ctx.beginPath();
      ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2);
      ctx.fill();
      // Eye
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(6, -5, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(7, -5, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Beak
      ctx.fillStyle = "#ff6b35";
      ctx.beginPath();
      ctx.moveTo(BIRD_R - 2, -2);
      ctx.lineTo(BIRD_R + 10, 0);
      ctx.lineTo(BIRD_R - 2, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Score
      ctx.font = "bold 28px monospace";
      ctx.fillStyle = "white";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
      ctx.textAlign = "center";
      ctx.fillText(s.score, W / 2, 50);
      ctx.shadowBlur = 0;
      ctx.textAlign = "left";
    };

    let animId;
    const loop = () => {
      animId = requestAnimationFrame(loop);
      const s = stateRef.current;
      if (!s) return;

      if (s.running) {
        s.frame++;
        s.bird.vy += 0.45;
        s.bird.y += s.bird.vy;

        if (s.frame % 90 === 0) {
          const top = Math.random() * (H - GAP - 150) + 50;
          s.pipes.push({ x: W + 10, top, scored: false });
        }
        s.pipes.forEach(p => p.x -= 3);
        s.pipes = s.pipes.filter(p => p.x > -PIPE_W - 20);

        // Score
        s.pipes.forEach(p => {
          if (!p.scored && p.x + PIPE_W < 80) {
            p.scored = true;
            s.score++;
            setScore(s.score);
          }
        });

        // Collision
        const bx = 80, by = s.bird.y;
        const hit = by - BIRD_R < 0 || by + BIRD_R > H - 50 ||
          s.pipes.some(p => bx + BIRD_R > p.x + 5 && bx - BIRD_R < p.x + PIPE_W - 5 && (by - BIRD_R < p.top || by + BIRD_R > p.top + GAP));
        if (hit) {
          s.running = false;
          setGameState("dead");
        }
      }
      draw();
    };
    animId = requestAnimationFrame(loop);

    const onKey = (e) => { if (e.key === " " || e.key === "ArrowUp") { e.preventDefault(); jump(); } };
    window.addEventListener("keydown", onKey);
    canvas.addEventListener("click", jump);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("keydown", onKey); canvas.removeEventListener("click", jump); };
  }, [jump]);

  const restart = () => {
    stateRef.current = resetState();
    setScore(0);
    setGameState("idle");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: 24, background: "#1a1a3e", height: "100%", justifyContent: "center" }}>
      <div style={{ display: "flex", justifyContent: "space-between", width: W, alignItems: "center" }}>
        <span style={{ color: "#ffe066", fontSize: "1.1rem", fontWeight: 700, fontFamily: "monospace" }}>🐦 FLAPPY BIRD</span>
        <button onClick={onExit} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", padding: "4px 12px", borderRadius: 4, cursor: "pointer" }}>← Back</button>
      </div>
      <div style={{ position: "relative" }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ border: "2px solid rgba(255,224,102,0.3)", borderRadius: 8, display: "block", cursor: "pointer" }} />
        {gameState === "idle" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.65)", gap: 12, borderRadius: 8 }}>
            <div style={{ color: "#ffe066", fontSize: "2.2rem", fontWeight: 700 }}>🐦 FLAPPY</div>
            <div style={{ color: "#aaa", fontSize: "0.9rem" }}>Click or Space to flap</div>
            <button onClick={jump} style={{ background: "#ffe066", color: "#111", border: "none", padding: "10px 28px", borderRadius: 6, fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}>TAP TO START</button>
          </div>
        )}
        {gameState === "dead" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", gap: 12, borderRadius: 8 }}>
            <div style={{ color: "#ef4444", fontSize: "2rem", fontWeight: 700 }}>OUCH!</div>
            <div style={{ color: "white", fontSize: "1.2rem" }}>Score: {score}</div>
            <button onClick={restart} style={{ background: "#ffe066", color: "#111", border: "none", padding: "10px 28px", borderRadius: 6, fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}>TRY AGAIN</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// GAME: SPACE INVADERS
// ─────────────────────────────────────────────
function SpaceInvadersGame({ onExit }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState("idle");
  const W = 500, H = 520;

  const initState = () => {
    const invaders = [];
    const cols = 10, rows = 5;
    const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        invaders.push({ x: 60 + c * 42, y: 60 + r * 40, alive: true, color: colors[r], type: r });
    return { player: { x: W / 2, vy: 0 }, invaders, bullets: [], invBullets: [], score: 0, lives: 3, dir: 1, invSpeed: 0.8, shootCooldown: 0, running: true, invShootTimer: 0, frame: 0, won: false };
  };

  const startGame = useCallback(() => {
    stateRef.current = initState();
    setScore(0); setLives(3); setGameState("running");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const keys = {};

    const draw = () => {
      const s = stateRef.current;
      ctx.fillStyle = "#050510";
      ctx.fillRect(0, 0, W, H);

      // Stars
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      [[50, 30], [120, 80], [200, 20], [320, 60], [410, 100], [470, 40], [90, 200], [380, 180]].forEach(([x, y]) => {
        ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill();
      });

      if (!s) return;

      // Player ship
      const px = s.player.x;
      ctx.fillStyle = "#00f5ff";
      ctx.shadowColor = "#00f5ff";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(px, H - 50);
      ctx.lineTo(px - 20, H - 30);
      ctx.lineTo(px - 8, H - 30);
      ctx.lineTo(px - 8, H - 25);
      ctx.lineTo(px + 8, H - 25);
      ctx.lineTo(px + 8, H - 30);
      ctx.lineTo(px + 20, H - 30);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Ground line
      ctx.strokeStyle = "rgba(0,245,255,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, H - 20); ctx.lineTo(W, H - 20); ctx.stroke();

      // Invaders
      s.invaders.forEach(inv => {
        if (!inv.alive) return;
        ctx.fillStyle = inv.color;
        ctx.shadowColor = inv.color;
        ctx.shadowBlur = 8;
        const t = inv.type;
        if (t === 0) { // UFO shape
          ctx.beginPath(); ctx.ellipse(inv.x, inv.y, 14, 8, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.beginPath(); ctx.ellipse(inv.x, inv.y - 6, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
        } else { // Crab shape
          ctx.fillRect(inv.x - 12, inv.y - 8, 24, 16);
          ctx.fillRect(inv.x - 16, inv.y - 4, 4, 8);
          ctx.fillRect(inv.x + 12, inv.y - 4, 4, 8);
          ctx.fillStyle = "#111";
          ctx.fillRect(inv.x - 7, inv.y - 4, 4, 4);
          ctx.fillRect(inv.x + 3, inv.y - 4, 4, 4);
        }
        ctx.shadowBlur = 0;
      });

      // Player bullets
      s.bullets.forEach(b => {
        ctx.fillStyle = "#00f5ff";
        ctx.shadowColor = "#00f5ff";
        ctx.shadowBlur = 6;
        ctx.fillRect(b.x - 2, b.y - 8, 4, 16);
        ctx.shadowBlur = 0;
      });

      // Invader bullets
      s.invBullets.forEach(b => {
        ctx.fillStyle = "#ef4444";
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 6;
        ctx.fillRect(b.x - 2, b.y, 4, 12);
        ctx.shadowBlur = 0;
      });

      // HUD
      ctx.font = "14px monospace";
      ctx.fillStyle = "white";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${s.score}`, 10, H - 3);
      ctx.textAlign = "right";
      ctx.fillText(`Lives: ${"❤️".repeat(s.lives)}`, W - 10, H - 3);
      ctx.textAlign = "left";
    };

    let animId;
    const loop = () => {
      animId = requestAnimationFrame(loop);
      const s = stateRef.current;
      if (!s || !s.running) { draw(); return; }

      s.frame++;

      // Player movement
      if (keys["ArrowLeft"] || keys["a"]) s.player.x = Math.max(25, s.player.x - 4);
      if (keys["ArrowRight"] || keys["d"]) s.player.x = Math.min(W - 25, s.player.x + 4);

      // Player shoot
      if (s.shootCooldown > 0) s.shootCooldown--;
      if ((keys[" "]) && s.shootCooldown === 0) {
        s.bullets.push({ x: s.player.x, y: H - 55 });
        s.shootCooldown = 15;
      }

      // Move bullets
      s.bullets.forEach(b => b.y -= 10);
      s.bullets = s.bullets.filter(b => b.y > 0);
      s.invBullets.forEach(b => b.y += 5);
      s.invBullets = s.invBullets.filter(b => b.y < H);

      // Move invaders
      const alive = s.invaders.filter(i => i.alive);
      if (alive.length === 0) { s.running = false; s.won = true; setGameState("won"); return; }

      const maxX = Math.max(...alive.map(i => i.x));
      const minX = Math.min(...alive.map(i => i.x));
      if ((s.dir > 0 && maxX > W - 50) || (s.dir < 0 && minX < 50)) {
        s.dir *= -1;
        s.invaders.forEach(i => { if (i.alive) i.y += 18; });
        s.invSpeed = Math.min(3, s.invSpeed + 0.1);
      }
      s.invaders.forEach(i => { if (i.alive) i.x += s.dir * s.invSpeed; });

      // Invaders reach bottom
      if (alive.some(i => i.y > H - 80)) { s.running = false; setGameState("dead"); return; }

      // Invader shoot
      s.invShootTimer++;
      if (s.invShootTimer > Math.max(30, 60 - alive.length)) {
        s.invShootTimer = 0;
        const shooter = alive[Math.floor(Math.random() * alive.length)];
        if (shooter) s.invBullets.push({ x: shooter.x, y: shooter.y + 10 });
      }

      // Bullet-invader collision
      s.bullets.forEach(b => {
        s.invaders.forEach(inv => {
          if (inv.alive && Math.abs(b.x - inv.x) < 16 && Math.abs(b.y - inv.y) < 12) {
            inv.alive = false;
            b.y = -999;
            s.score += (5 - inv.type) * 10;
            setScore(s.score);
          }
        });
      });

      // Invader bullet-player collision
      s.invBullets.forEach(b => {
        if (Math.abs(b.x - s.player.x) < 18 && b.y > H - 55) {
          b.y = H + 1;
          s.lives--;
          setLives(s.lives);
          if (s.lives <= 0) { s.running = false; setGameState("dead"); }
        }
      });

      draw();
    };
    animId = requestAnimationFrame(loop);

    const onKey = (e) => {
      keys[e.key] = true;
      if (e.key === " ") e.preventDefault();
    };
    const onKeyUp = (e) => { keys[e.key] = false; };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKeyUp); };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: 24, background: "#050510", height: "100%", justifyContent: "center" }}>
      <div style={{ display: "flex", justifyContent: "space-between", width: W, alignItems: "center" }}>
        <span style={{ color: "#00f5ff", fontSize: "1.1rem", fontWeight: 700, fontFamily: "monospace" }}>👾 SPACE INVADERS</span>
        <button onClick={onExit} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", padding: "4px 12px", borderRadius: 4, cursor: "pointer" }}>← Back</button>
      </div>
      <div style={{ position: "relative" }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ border: "2px solid rgba(0,245,255,0.3)", borderRadius: 4, display: "block" }} />
        {gameState === "idle" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", gap: 12, borderRadius: 4 }}>
            <div style={{ color: "#00f5ff", fontSize: "2rem", fontWeight: 700 }}>👾 SPACE INVADERS</div>
            <div style={{ color: "#aaa", fontSize: "0.85rem", textAlign: "center" }}>← → Move &nbsp; Space to Shoot</div>
            <button onClick={startGame} style={{ background: "#00f5ff", color: "#111", border: "none", padding: "10px 28px", borderRadius: 6, fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}>DEFEND EARTH</button>
          </div>
        )}
        {gameState === "dead" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", gap: 12, borderRadius: 4 }}>
            <div style={{ color: "#ef4444", fontSize: "2rem", fontWeight: 700 }}>INVASION!</div>
            <div style={{ color: "white" }}>Score: {score}</div>
            <button onClick={startGame} style={{ background: "#00f5ff", color: "#111", border: "none", padding: "10px 28px", borderRadius: 6, fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}>TRY AGAIN</button>
          </div>
        )}
        {gameState === "won" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", gap: 12, borderRadius: 4 }}>
            <div style={{ color: "#22c55e", fontSize: "2rem", fontWeight: 700 }}>EARTH SAVED!</div>
            <div style={{ color: "white" }}>Score: {score}</div>
            <button onClick={startGame} style={{ background: "#22c55e", color: "#111", border: "none", padding: "10px 28px", borderRadius: 6, fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}>PLAY AGAIN</button>
          </div>
        )}
      </div>
      <div style={{ color: "#666", fontSize: "0.75rem" }}>← → Move &nbsp;|&nbsp; Space to Shoot</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// GAME: BREAKOUT
// ─────────────────────────────────────────────
function BreakoutGame({ onExit }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState("idle");
  const W = 480, H = 520;

  const initState = () => {
    const bricks = [];
    const colors = ["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#a855f7"];
    for (let r = 0; r < 6; r++)
      for (let c = 0; c < 10; c++)
        bricks.push({ x: 10 + c * 46, y: 40 + r * 28, w: 40, h: 20, alive: true, color: colors[r], pts: (6 - r) * 10 });
    return { ball: { x: W / 2, y: H - 100, vx: 4, vy: -4 }, paddle: { x: W / 2, w: 80 }, bricks, score: 0, lives: 3, running: false, started: false };
  };

  const startGame = useCallback(() => {
    stateRef.current = initState();
    stateRef.current.running = true;
    stateRef.current.started = true;
    setScore(0); setGameState("running");
  }, []);

  useEffect(() => {
    stateRef.current = initState();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const onMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      const s = stateRef.current;
      if (s) s.paddle.x = Math.min(Math.max(e.clientX - rect.left, s.paddle.w / 2), W - s.paddle.w / 2);
    };
    canvas.addEventListener("mousemove", onMouse);

    const onKey = (e) => {
      const s = stateRef.current;
      if (!s) return;
      if (e.key === "ArrowLeft") s.paddle.x = Math.max(s.paddle.w / 2, s.paddle.x - 20);
      if (e.key === "ArrowRight") s.paddle.x = Math.min(W - s.paddle.w / 2, s.paddle.x + 20);
      if ((e.key === " " || e.key === "ArrowUp") && !s.running && s.started === false) { startGame(); }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);

    let animId;
    const loop = () => {
      animId = requestAnimationFrame(loop);
      const s = stateRef.current;
      ctx.fillStyle = "#0d1117";
      ctx.fillRect(0, 0, W, H);

      if (!s) return;

      // Bricks
      s.bricks.forEach(b => {
        if (!b.alive) return;
        const g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
        g.addColorStop(0, b.color);
        g.addColorStop(1, b.color + "88");
        ctx.fillStyle = g;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 4;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.shadowBlur = 0;
      });

      // Paddle
      ctx.fillStyle = "#c0c0c0";
      ctx.shadowColor = "#c0c0c0";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(s.paddle.x - s.paddle.w / 2, H - 35, s.paddle.w, 12, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Ball
      ctx.fillStyle = "white";
      ctx.shadowColor = "white";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(s.ball.x, s.ball.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Score / lives
      ctx.fillStyle = "white";
      ctx.font = "14px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${s.score}`, 10, H - 5);
      ctx.textAlign = "right";
      ctx.fillText(`Lives: ${"🟦".repeat(s.lives)}`, W - 10, H - 5);
      ctx.textAlign = "left";

      if (!s.running) return;

      // Move ball
      s.ball.x += s.ball.vx;
      s.ball.y += s.ball.vy;

      // Walls
      if (s.ball.x < 8 || s.ball.x > W - 8) s.ball.vx *= -1;
      if (s.ball.y < 8) s.ball.vy *= -1;

      // Paddle collision
      if (s.ball.y + 8 > H - 35 && s.ball.y + 8 < H - 23 && Math.abs(s.ball.x - s.paddle.x) < s.paddle.w / 2 + 8) {
        s.ball.vy = -Math.abs(s.ball.vy);
        const offset = (s.ball.x - s.paddle.x) / (s.paddle.w / 2);
        s.ball.vx = offset * 5;
      }

      // Bottom
      if (s.ball.y > H + 20) {
        s.lives--;
        if (s.lives <= 0) { s.running = false; setGameState("dead"); return; }
        s.ball.x = W / 2; s.ball.y = H - 100; s.ball.vx = 4; s.ball.vy = -4;
      }

      // Brick collision
      s.bricks.forEach(b => {
        if (!b.alive) return;
        if (s.ball.x + 8 > b.x && s.ball.x - 8 < b.x + b.w && s.ball.y + 8 > b.y && s.ball.y - 8 < b.y + b.h) {
          b.alive = false;
          s.ball.vy *= -1;
          s.score += b.pts;
          setScore(s.score);
        }
      });

      if (s.bricks.every(b => !b.alive)) { s.running = false; setGameState("won"); }
    };
    animId = requestAnimationFrame(loop);

    return () => { cancelAnimationFrame(animId); canvas.removeEventListener("mousemove", onMouse); window.removeEventListener("keydown", onKey); };
  }, [startGame]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: 24, background: "#0d1117", height: "100%", justifyContent: "center" }}>
      <div style={{ display: "flex", justifyContent: "space-between", width: W, alignItems: "center" }}>
        <span style={{ color: "#f97316", fontSize: "1.1rem", fontWeight: 700, fontFamily: "monospace" }}>🧱 BREAKOUT</span>
        <button onClick={onExit} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", padding: "4px 12px", borderRadius: 4, cursor: "pointer" }}>← Back</button>
      </div>
      <div style={{ position: "relative" }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ border: "2px solid rgba(249,115,22,0.3)", borderRadius: 4, display: "block" }} />
        {gameState === "idle" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", gap: 12, borderRadius: 4 }}>
            <div style={{ color: "#f97316", fontSize: "2rem", fontWeight: 700 }}>🧱 BREAKOUT</div>
            <div style={{ color: "#aaa", fontSize: "0.85rem", textAlign: "center" }}>Move mouse or ← → to control paddle<br/>Don't let the ball fall!</div>
            <button onClick={startGame} style={{ background: "#f97316", color: "#111", border: "none", padding: "10px 28px", borderRadius: 6, fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}>SMASH IT</button>
          </div>
        )}
        {gameState === "dead" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", gap: 12, borderRadius: 4 }}>
            <div style={{ color: "#ef4444", fontSize: "2rem", fontWeight: 700 }}>GAME OVER</div>
            <div style={{ color: "white" }}>Score: {score}</div>
            <button onClick={startGame} style={{ background: "#f97316", color: "#111", border: "none", padding: "10px 28px", borderRadius: 6, fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}>PLAY AGAIN</button>
          </div>
        )}
        {gameState === "won" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", gap: 12, borderRadius: 4 }}>
            <div style={{ color: "#22c55e", fontSize: "2rem", fontWeight: 700 }}>YOU WIN! 🎉</div>
            <div style={{ color: "white" }}>Score: {score}</div>
            <button onClick={startGame} style={{ background: "#f97316", color: "#111", border: "none", padding: "10px 28px", borderRadius: 6, fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}>PLAY AGAIN</button>
          </div>
        )}
      </div>
      <div style={{ color: "#666", fontSize: "0.75rem" }}>Move mouse or ← → to control paddle</div>
    </div>
  );
}


// ─────────────────────────────────────────────
// GAME: BOT BLASTER 3D (fully rewritten)
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// GAME: BOT BLASTER 3D — fully polished
// ─────────────────────────────────────────────
function FPSGame({ onExit }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const [health, setHealth] = useState(100);
  const [kills, setKills] = useState(0);
  const [ammo, setAmmo] = useState(30);
  const [gameState, setGameState] = useState("idle");
  const [crosshairFlash, setCrosshairFlash] = useState(false);

  const W = 640, H = 440;
  const MAP_W = 20, MAP_H = 20;
  const FOV = Math.PI / 2.8;

  const MAP = [
    "####################",
    "#..................#",
    "#.##.###..###.##..#",
    "#.#...#....#...#..#",
    "#.#.#.#.##.#.#.##.#",
    "#...#......#.#....#",
    "###.########.#.####",
    "#...#........#....#",
    "#.###.######.###..#",
    "#.....#......#....#",
    "#.#####.####.#.##.#",
    "#.#....#.....#.#..#",
    "#.#.####.#####.#..#",
    "#.#.......#....#..#",
    "#.#.#####.#.####..#",
    "#...#.....#......##",
    "####.#.###########.",
    "#....#............#",
    "#.##.##.##.##.##..#",
    "####################",
  ];

  const isWall = useCallback((x, y) => {
    const mx = Math.floor(x), my = Math.floor(y);
    if (mx < 0 || mx >= MAP_W || my < 0 || my >= MAP_H) return true;
    return MAP[my][mx] === "#";
  }, []);

  // Zone-based wall colors for visual variety
  const getWallColor = useCallback((mapX, mapY, side, dist) => {
    const zone = (mapX < 10 ? 0 : 1) + (mapY < 10 ? 0 : 2);
    const palettes = [
      [175, 135, 90],   // NW: warm stone
      [85, 120, 165],   // NE: cool metal blue
      [145, 75, 75],    // SW: red brick
      [75, 155, 95],    // SE: mossy green
    ];
    const [r, g, b] = palettes[zone];
    const fog = Math.max(0, 1 - dist / 14);
    const side_dim = side === 0 ? 1.0 : 0.58;
    const bright = fog * side_dim;
    return [Math.floor(r * bright), Math.floor(g * bright), Math.floor(b * bright)];
  }, []);

  const initFPS = useCallback(() => ({
    px: 1.5, py: 1.5, pangle: 0.5,
    bullets: 30, health: 100, kills: 0,
    // Stagger move timers so no bot fires on the very first frame
    bots: [
      { x: 10.5, y: 10.5, hp: 3, maxHp: 3, moveTimer: 120, alive: true, r: 220, g: 50,  b: 50,  color: "#ef4444" },
      { x: 17.5, y: 3.5,  hp: 3, maxHp: 3, moveTimer: 200, alive: true, r: 249, g: 115, b: 22,  color: "#f97316" },
      { x: 3.5,  y: 16.5, hp: 3, maxHp: 3, moveTimer: 160, alive: true, r: 168, g: 85,  b: 247, color: "#a855f7" },
      { x: 17.5, y: 17.5, hp: 3, maxHp: 3, moveTimer: 240, alive: true, r: 234, g: 179, b: 8,   color: "#eab308" },
      { x: 10.5, y: 3.5,  hp: 3, maxHp: 3, moveTimer: 300, alive: true, r: 59,  g: 130, b: 246, color: "#3b82f6" },
    ],
    shootCooldown: 0, running: true,
    hitTimer: 0, muzzleFlash: 0, bobPhase: 0,
  }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const keys = {};

    const onPLC = () => {};
    document.addEventListener("pointerlockchange", onPLC);
    const onMM = (e) => {
      if (document.pointerLockElement !== canvas) return;
      const s = stateRef.current;
      if (s && s.running) s.pangle += e.movementX * 0.0025;
    };
    document.addEventListener("mousemove", onMM);

    const shoot = () => {
      const s = stateRef.current;
      if (!s || !s.running) return;
      if (document.pointerLockElement !== canvas) { canvas.requestPointerLock(); return; }
      if (s.shootCooldown > 0 || s.bullets <= 0) return;
      s.shootCooldown = 18; s.bullets--; s.muzzleFlash = 10;
      setAmmo(s.bullets);
      let hit = false;
      for (let step = 0.05; step < 18 && !hit; step += 0.04) {
        const tx = s.px + Math.cos(s.pangle) * step;
        const ty = s.py + Math.sin(s.pangle) * step;
        if (isWall(tx, ty)) break;
        for (const bot of s.bots) {
          if (!bot.alive) continue;
          if (Math.hypot(tx - bot.x, ty - bot.y) < 0.42) {
            bot.hp--;
            hit = true;
            setCrosshairFlash(true);
            setTimeout(() => setCrosshairFlash(false), 150);
            if (bot.hp <= 0) { bot.alive = false; s.kills++; setKills(s.kills); }
            break;
          }
        }
      }
    };

    canvas.addEventListener("click", shoot);
    const onKD = (e) => {
      keys[e.key.toLowerCase()] = true;
      if ([" ", "f", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) e.preventDefault();
      if (e.key === " " || e.key.toLowerCase() === "f") shoot();
    };
    const onKU = (e) => { keys[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", onKD);
    window.addEventListener("keyup", onKU);

    // Pre-render static floor/ceiling gradient
    const bgCanvas = document.createElement("canvas");
    bgCanvas.width = W; bgCanvas.height = H;
    const bctx = bgCanvas.getContext("2d");
    // Ceiling
    const cg = bctx.createLinearGradient(0, 0, 0, H / 2);
    cg.addColorStop(0, "#020410"); cg.addColorStop(1, "#0a1228");
    bctx.fillStyle = cg; bctx.fillRect(0, 0, W, H / 2);
    // Floor — with subtle perspective grid
    const fg = bctx.createLinearGradient(0, H / 2, 0, H);
    fg.addColorStop(0, "#2a1a0e"); fg.addColorStop(0.5, "#1a0e06"); fg.addColorStop(1, "#0a0602");
    bctx.fillStyle = fg; bctx.fillRect(0, H / 2, W, H / 2);
    // Floor grid for depth
    bctx.strokeStyle = "rgba(255,255,255,0.04)"; bctx.lineWidth = 1;
    for (let i = 1; i <= 8; i++) {
      const y = H / 2 + (H / 2) * (i / 8);
      bctx.beginPath(); bctx.moveTo(0, y); bctx.lineTo(W, y); bctx.stroke();
    }
    // Vanishing point lines
    bctx.strokeStyle = "rgba(255,255,255,0.025)";
    for (let i = 0; i <= 12; i++) {
      const x = W * (i / 12);
      bctx.beginPath(); bctx.moveTo(W / 2, H / 2); bctx.lineTo(x, H); bctx.stroke();
    }

    let animId;
    const loop = () => {
      animId = requestAnimationFrame(loop);
      const s = stateRef.current;
      ctx.drawImage(bgCanvas, 0, 0);
      if (!s) return;

      if (s.running) {
        const SPEED = 0.052;
        // Arrow keys for rotation
        if (keys["arrowleft"])  s.pangle -= 0.032;
        if (keys["arrowright"]) s.pangle += 0.032;
        // WASD: W=forward, S=back, A=strafe left, D=strafe right
        const fwd = keys["w"] ? 1 : keys["s"] ? -1 : 0;
        const str = keys["a"] ? -1 : keys["d"] ? 1 : 0;
        if (fwd !== 0) {
          const nx = s.px + Math.cos(s.pangle) * SPEED * fwd;
          const ny = s.py + Math.sin(s.pangle) * SPEED * fwd;
          if (!isWall(nx, s.py)) s.px = nx;
          if (!isWall(s.px, ny)) s.py = ny;
        }
        if (str !== 0) {
          const sa = s.pangle + Math.PI / 2;
          const nx = s.px + Math.cos(sa) * SPEED * str;
          const ny = s.py + Math.sin(sa) * SPEED * str;
          if (!isWall(nx, s.py)) s.px = nx;
          if (!isWall(s.px, ny)) s.py = ny;
        }
        if (fwd || str) s.bobPhase += 0.14;
        if (s.shootCooldown > 0) s.shootCooldown--;
        if (s.hitTimer > 0) s.hitTimer--;
        if (s.muzzleFlash > 0) s.muzzleFlash--;

        // Bot AI
        s.bots.forEach(bot => {
          if (!bot.alive) return;
          bot.moveTimer++;
          const dx = s.px - bot.x, dy = s.py - bot.y;
          const dist = Math.hypot(dx, dy);
          const toPlayer = Math.atan2(dy, dx);

          // Move toward player
          if (dist > 1.5 && bot.moveTimer % 2 === 0) {
            const spd = 0.022;
            const nx = bot.x + Math.cos(toPlayer) * spd;
            const ny = bot.y + Math.sin(toPlayer) * spd;
            if (!isWall(nx, bot.y)) bot.x = nx;
            else if (!isWall(nx, bot.y + 0.4)) { bot.x = nx; bot.y += 0.2; }
            else if (!isWall(nx, bot.y - 0.4)) { bot.x = nx; bot.y -= 0.2; }
            if (!isWall(bot.x, ny)) bot.y = ny;
          }

          // Shoot only when: (1) in range, (2) player is in FOV of bot, (3) LOS, (4) timer
          if (dist < 8 && bot.moveTimer % 90 === 0) {
            // Check if player is roughly "in front of" the bot
            // Bot faces toward player direction — check if player is within 120° arc
            const botFacing = toPlayer; // bot always faces player
            // This is always true since bot faces the player, but check LOS
            let los = true;
            const steps = Math.ceil(dist / 0.1);
            for (let i = 1; i < steps && los; i++) {
              const lx = bot.x + dx * (i / steps);
              const ly = bot.y + dy * (i / steps);
              if (isWall(lx, ly)) los = false;
            }
            // Additionally: only shoot if player is facing toward the bot (within ~180°)
            // i.e. the player isn't behind the bot in the player's reference
            const playerToBot = Math.atan2(bot.y - s.py, bot.x - s.px);
            let angleDiff = playerToBot - s.pangle;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            // Only shoot if player is looking somewhat toward the bot (within ±90° means player can see the bot)
            const playerCanSeeDangerZone = Math.abs(angleDiff) < Math.PI * 0.65;

            if (los && playerCanSeeDangerZone) {
              const dmg = Math.max(3, 14 - Math.floor(dist * 1.5));
              s.health -= dmg;
              s.hitTimer = 15;
              setHealth(Math.max(0, s.health));
              if (s.health <= 0) { s.running = false; setGameState("dead"); }
            }
          }
        });

        if (s.bots.every(b => !b.alive)) { s.running = false; setGameState("won"); }
        s._bob = Math.sin(s.bobPhase) * 2.5;
      }

      // ── RAYCASTING: smooth walls with banded rendering ──
      // Use 4px wide columns to reduce gradient creation overhead
      const BAND = 2;
      const zBuffer = new Float32Array(W);
      const halfH = H / 2 + (s._bob || 0);

      for (let col = 0; col < W; col += BAND) {
        // Center ray for this band
        const rayAngle = s.pangle - FOV / 2 + ((col + BAND * 0.5) / W) * FOV;
        const cosA = Math.cos(rayAngle), sinA = Math.sin(rayAngle);
        let mapX = Math.floor(s.px), mapY = Math.floor(s.py);
        const ddX = Math.abs(1 / cosA), ddY = Math.abs(1 / sinA);
        const stepX = cosA < 0 ? -1 : 1, stepY = sinA < 0 ? -1 : 1;
        let sdX = cosA < 0 ? (s.px - mapX) * ddX : (mapX + 1 - s.px) * ddX;
        let sdY = sinA < 0 ? (s.py - mapY) * ddY : (mapY + 1 - s.py) * ddY;
        let side = 0;
        for (let i = 0; i < 40; i++) {
          if (sdX < sdY) { sdX += ddX; mapX += stepX; side = 0; }
          else { sdY += ddY; mapY += stepY; side = 1; }
          if (mapX >= 0 && mapX < MAP_W && mapY >= 0 && mapY < MAP_H && MAP[mapY][mapX] === "#") break;
        }
        const pwd = Math.max(0.1, side === 0
          ? (mapX - s.px + (1 - stepX) / 2) / cosA
          : (mapY - s.py + (1 - stepY) / 2) / sinA);

        // Fill z-buffer for entire band
        for (let b = 0; b < BAND && col + b < W; b++) zBuffer[col + b] = pwd;

        const wallH = Math.min(H * 5, H / pwd);
        const wTop = Math.max(0, halfH - wallH / 2);
        const wBot = Math.min(H, halfH + wallH / 2);
        const [wr, wg, wb] = getWallColor(mapX, mapY, side, pwd);

        // Vertical gradient for smooth shading (bright top, dark bottom)
        if (wBot > wTop) {
          const grad = ctx.createLinearGradient(col, wTop, col, wBot);
          const hi = 1.3, mid = 1.0, lo = 0.65;
          grad.addColorStop(0,   `rgb(${Math.min(255,Math.floor(wr*hi))},${Math.min(255,Math.floor(wg*hi))},${Math.min(255,Math.floor(wb*hi))})`);
          grad.addColorStop(0.3, `rgb(${wr},${wg},${wb})`);
          grad.addColorStop(1,   `rgb(${Math.floor(wr*lo)},${Math.floor(wg*lo)},${Math.floor(wb*lo)})`);
          ctx.fillStyle = grad;
          ctx.fillRect(col, wTop, Math.min(BAND, W - col), wBot - wTop);
        }
      }

      // ── ATMOSPHERIC DEPTH FOG ──
      // Apply a horizontal gradient fog that fades far-away walls
      // (done via the vignette at the end)

      // ── SPRITES ──
      const sprites = s.bots.filter(b => b.alive)
        .map(b => ({ b, dist2: (b.x - s.px) ** 2 + (b.y - s.py) ** 2 }))
        .sort((a, z) => z.dist2 - a.dist2);

      sprites.forEach(({ b: bot, dist2 }) => {
        const dist = Math.sqrt(dist2);
        if (dist < 0.3) return;
        const dx = bot.x - s.px, dy = bot.y - s.py;
        let sa = Math.atan2(dy, dx) - s.pangle;
        while (sa > Math.PI) sa -= 2 * Math.PI;
        while (sa < -Math.PI) sa += 2 * Math.PI;
        if (Math.abs(sa) > FOV * 0.72) return;

        const screenX = Math.floor(W * (0.5 + sa / FOV));
        const halfH2 = H / 2 + (s._bob || 0);
        const sprH = Math.min(H * 4, H / dist);
        const sprW = sprH * 0.65;
        const sX = Math.floor(screenX - sprW / 2);
        const sY = Math.floor(halfH2 - sprH / 2);

        let vis = false;
        for (let cx = Math.max(0, sX); cx < Math.min(W, sX + sprW); cx++) {
          if (zBuffer[cx] > dist) { vis = true; break; }
        }
        if (!vis) return;

        const fog = Math.max(0, 1 - dist / 14);
        ctx.save();
        ctx.beginPath();
        ctx.rect(Math.max(0, sX), 0, Math.min(W, sX + sprW) - Math.max(0, sX), H);
        ctx.clip();
        // fog used for color, not alpha — keep solid

        // Shadow blob on floor
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath();
        ctx.ellipse(screenX, sY + sprH * 0.96, sprW * 0.36, sprH * 0.035, 0, 0, Math.PI * 2);
        ctx.fill();

        const hR = sprW * 0.19;
        const hCX = screenX, hCY = sY + sprH * 0.14;

        // Head
        const hg = ctx.createRadialGradient(hCX - hR * 0.3, hCY - hR * 0.3, hR * 0.05, hCX, hCY, hR * 1.1);
        hg.addColorStop(0, `rgba(${Math.min(255, bot.r + 80)},${Math.min(255, bot.g + 80)},${Math.min(255, bot.b + 80)},0.95)`);
        hg.addColorStop(1, `rgba(${bot.r},${bot.g},${bot.b},0.85)`);
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.ellipse(hCX, hCY, hR, hR * 1.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Visor
        ctx.fillStyle = "rgba(0,210,255,0.72)";
        ctx.beginPath();
        ctx.ellipse(hCX, hCY + hR * 0.08, hR * 0.72, hR * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glowing eyes
        ctx.shadowColor = `rgb(${bot.r},${bot.g},${bot.b})`;
        ctx.shadowBlur = dist < 5 ? 12 : 6;
        ctx.fillStyle = "white";
        ctx.beginPath(); ctx.arc(hCX - hR * 0.28, hCY - hR * 0.06, hR * 0.13, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(hCX + hR * 0.28, hCY - hR * 0.06, hR * 0.13, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        // Body
        const bL = sX + sprW * 0.16, bT = sY + sprH * 0.28, bW = sprW * 0.68, bH = sprH * 0.44;
        const bg = ctx.createLinearGradient(bL, bT, bL, bT + bH);
        bg.addColorStop(0, `rgba(${bot.r},${bot.g},${bot.b},0.92)`);
        bg.addColorStop(0.5, `rgba(${Math.min(255, bot.r + 45)},${Math.min(255, bot.g + 45)},${Math.min(255, bot.b + 45)},0.95)`);
        bg.addColorStop(1, `rgba(${Math.floor(bot.r * 0.65)},${Math.floor(bot.g * 0.65)},${Math.floor(bot.b * 0.65)},0.85)`);
        ctx.fillStyle = bg;
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(bL, bT, bW, bH, bW * 0.08); ctx.fill(); }
        else ctx.fillRect(bL, bT, bW, bH);

        // Chest panel
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(bL + bW * 0.22, bT + bH * 0.12, bW * 0.56, bH * 0.42);
        for (let li = 0; li < 3; li++) {
          ctx.fillStyle = `rgb(${bot.r},${bot.g},${bot.b})`;
          ctx.shadowColor = `rgb(${bot.r},${bot.g},${bot.b})`; ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.arc(bL + bW * (0.33 + li * 0.17), bT + bH * 0.33, bW * 0.044, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Arms
        const aW = sprW * 0.11, aT = bT + bH * 0.04, aH = bH * 0.72;
        ctx.fillStyle = `rgba(${bot.r},${bot.g},${bot.b},0.82)`;
        ctx.fillRect(bL - aW - 1, aT, aW, aH);
        ctx.fillRect(bL + bW + 1, aT, aW, aH);
        ctx.fillStyle = "#3a3a3a";
        ctx.fillRect(bL - aW - 4, aT + aH * 0.65, aW + 5, aH * 0.28);
        ctx.fillRect(bL + bW - 1, aT + aH * 0.65, aW + 5, aH * 0.28);

        // Legs
        const lT = bT + bH, lH = sprH * 0.2, lW = bW * 0.28;
        ctx.fillStyle = `rgba(${bot.r},${bot.g},${bot.b},0.76)`;
        ctx.fillRect(bL + bW * 0.06, lT, lW, lH);
        ctx.fillRect(bL + bW * 0.58, lT, lW, lH);
        ctx.fillStyle = "#252525";
        ctx.fillRect(bL + bW * 0.04, lT + lH * 0.8, lW + 2, lH * 0.2);
        ctx.fillRect(bL + bW * 0.56, lT + lH * 0.8, lW + 2, lH * 0.2);

        ctx.restore();

        // HP bar
        const bwW = Math.max(22, sprW * 0.92);
        const bwH = Math.max(4, sprH * 0.02);
        const bwX = screenX - bwW / 2, bwY = sY - bwH - 3;
        if (bwY > 0) {
          ctx.fillStyle = "#111"; ctx.fillRect(bwX - 1, bwY - 1, bwW + 2, bwH + 2);
          ctx.fillStyle = "#2a2a2a"; ctx.fillRect(bwX, bwY, bwW, bwH);
          const hpF = bot.hp / bot.maxHp;
          ctx.fillStyle = hpF > 0.6 ? "#22c55e" : hpF > 0.3 ? "#eab308" : "#ef4444";
          ctx.fillRect(bwX, bwY, bwW * hpF, bwH);
        }
      });

      // ── DEPTH VIGNETTE (distance fog) ──
      const dv = ctx.createRadialGradient(W / 2, H / 2, H * 0.15, W / 2, H / 2, H * 0.92);
      dv.addColorStop(0, "rgba(0,0,0,0)");
      dv.addColorStop(0.65, "rgba(0,0,0,0.07)");
      dv.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.fillStyle = dv; ctx.fillRect(0, 0, W, H);

      // ── HIT VIGNETTE ──
      if (s.hitTimer > 0) {
        const hv = ctx.createRadialGradient(W / 2, H / 2, H * 0.1, W / 2, H / 2, H * 0.95);
        hv.addColorStop(0, "rgba(255,0,0,0)");
        hv.addColorStop(0.5, `rgba(255,0,0,${(s.hitTimer / 15) * 0.25})`);
        hv.addColorStop(1, `rgba(255,0,0,${(s.hitTimer / 15) * 0.72})`);
        ctx.fillStyle = hv; ctx.fillRect(0, 0, W, H);
      }

      // ── MUZZLE FLASH ──
      if (s.muzzleFlash > 0) {
        ctx.fillStyle = `rgba(255,215,80,${(s.muzzleFlash / 10) * 0.25})`;
        ctx.fillRect(0, 0, W, H);
      }

      // ── GUN ──
      const bob2 = (s._bob || 0) * 1.4;
      const kick = s.shootCooldown > 10 ? -22 : s.shootCooldown > 5 ? -10 : 0;
      const gx = W - 148, gy = H - 90 + kick + bob2;
      ctx.fillStyle = "#666"; ctx.fillRect(gx + 58, gy - 18, 26, 10);
      ctx.fillStyle = "#444"; ctx.fillRect(gx + 70, gy - 24, 14, 8);
      ctx.fillStyle = "#787878";
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(gx, gy, 96, 30, 5); ctx.fill(); }
      else ctx.fillRect(gx, gy, 96, 30);
      ctx.fillStyle = "#929292"; ctx.fillRect(gx + 4, gy + 3, 65, 13);
      ctx.fillStyle = "#505050"; ctx.fillRect(gx + 4, gy + 18, 55, 8);
      ctx.fillStyle = "#555";
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(gx + 14, gy + 26, 24, 20, 3); ctx.fill(); }
      else ctx.fillRect(gx + 14, gy + 26, 24, 20);
      ctx.fillStyle = "#c00"; ctx.fillRect(gx + 38, gy - 6, 5, 5);
      if (s.muzzleFlash > 6) {
        ctx.save(); ctx.shadowColor = "#ffd040"; ctx.shadowBlur = 22;
        ctx.fillStyle = "rgba(255,220,80,0.95)";
        ctx.beginPath(); ctx.arc(gx + 83, gy - 13, 13, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.restore();
      }

      // ── MINIMAP ──
      const mm = 4, mmX = 10, mmY = 10;
      ctx.fillStyle = "rgba(0,0,0,0.62)";
      ctx.fillRect(mmX - 2, mmY - 2, MAP_W * mm + 4, MAP_H * mm + 4);
      for (let my = 0; my < MAP_H; my++)
        for (let mx = 0; mx < MAP_W; mx++) {
          ctx.fillStyle = MAP[my][mx] === "#" ? "rgba(180,170,160,0.75)" : "rgba(20,20,30,0.45)";
          ctx.fillRect(mmX + mx * mm, mmY + my * mm, mm - 1, mm - 1);
        }
      // FOV cone
      ctx.strokeStyle = "rgba(0,245,255,0.2)"; ctx.lineWidth = 1;
      const fovDist = 4.5;
      ctx.beginPath();
      ctx.moveTo(mmX + s.px * mm, mmY + s.py * mm);
      ctx.lineTo(mmX + (s.px + Math.cos(s.pangle - FOV / 2) * fovDist) * mm, mmY + (s.py + Math.sin(s.pangle - FOV / 2) * fovDist) * mm);
      ctx.moveTo(mmX + s.px * mm, mmY + s.py * mm);
      ctx.lineTo(mmX + (s.px + Math.cos(s.pangle + FOV / 2) * fovDist) * mm, mmY + (s.py + Math.sin(s.pangle + FOV / 2) * fovDist) * mm);
      ctx.stroke();
      // Player dot
      ctx.fillStyle = "#00f5ff"; ctx.shadowColor = "#00f5ff"; ctx.shadowBlur = 5;
      ctx.beginPath(); ctx.arc(mmX + s.px * mm, mmY + s.py * mm, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#00f5ff"; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mmX + s.px * mm, mmY + s.py * mm);
      ctx.lineTo(mmX + (s.px + Math.cos(s.pangle) * 3.5) * mm, mmY + (s.py + Math.sin(s.pangle) * 3.5) * mm);
      ctx.stroke();
      // Bot dots
      s.bots.forEach(b => {
        if (!b.alive) return;
        ctx.fillStyle = b.color; ctx.shadowColor = b.color; ctx.shadowBlur = 4;
        ctx.beginPath(); ctx.arc(mmX + b.x * mm, mmY + b.y * mm, 3, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      });

      // ── HUD ──
      ctx.fillStyle = "rgba(0,0,0,0.68)"; ctx.fillRect(0, H - 40, W, 40);
      const hpF = Math.max(0, s.health / 100);
      ctx.fillStyle = "#2a2a2a"; ctx.fillRect(12, H - 28, 160, 16);
      ctx.fillStyle = hpF > 0.6 ? "#22c55e" : hpF > 0.3 ? "#eab308" : "#ef4444";
      ctx.fillRect(12, H - 28, 160 * hpF, 16);
      ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.lineWidth = 1; ctx.strokeRect(12, H - 28, 160, 16);
      ctx.fillStyle = "white"; ctx.font = "bold 11px monospace"; ctx.textAlign = "left";
      ctx.fillText(`❤️ ${s.health}`, 16, H - 15);
      ctx.textAlign = "right";
      ctx.fillStyle = s.bullets > 8 ? "#ddd" : "#ef4444"; ctx.font = "bold 14px monospace";
      ctx.fillText(`🔫 ${s.bullets}/30`, W - 12, H - 15);
      ctx.textAlign = "center";
      ctx.fillStyle = "#aaa"; ctx.font = "12px monospace";
      ctx.fillText(`KILLS ${s.kills}/${s.bots.length}`, W / 2, H - 15);
      ctx.textAlign = "left";

      // Lock overlay
      if (document.pointerLockElement !== canvas && s && s.running) {
        ctx.fillStyle = "rgba(0,0,0,0.62)"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "white"; ctx.font = "bold 18px monospace"; ctx.textAlign = "center";
        ctx.fillText("Click to lock mouse & aim", W / 2, H / 2 - 10);
        ctx.fillStyle = "#888"; ctx.font = "13px monospace";
        ctx.fillText("ESC to release lock", W / 2, H / 2 + 18);
        ctx.textAlign = "left";
      }
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", onKD);
      window.removeEventListener("keyup", onKU);
      document.removeEventListener("mousemove", onMM);
      document.removeEventListener("pointerlockchange", onPLC);
      canvas.removeEventListener("click", shoot);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
    };
  }, [isWall, getWallColor, initFPS]);

  const startGame = () => {
    stateRef.current = initFPS();
    setAmmo(30); setHealth(100); setKills(0); setGameState("running");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: 16, background: "#060606", height: "100%", justifyContent: "center" }}>
      <div style={{ display: "flex", justifyContent: "space-between", width: W, alignItems: "center" }}>
        <span style={{ color: "#ef4444", fontSize: "1.1rem", fontWeight: 700, fontFamily: "monospace" }}>🔫 BOT BLASTER 3D</span>
        <button onClick={() => { if (document.pointerLockElement) document.exitPointerLock(); onExit(); }} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", padding: "4px 12px", borderRadius: 4, cursor: "pointer" }}>← Back</button>
      </div>
      <div style={{ position: "relative" }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ border: "2px solid rgba(239,68,68,0.4)", borderRadius: 4, display: "block", cursor: "crosshair" }} />
        {gameState === "running" && (
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }}>
            <div style={{ width: 24, height: 2, background: crosshairFlash ? "#ef4444" : "rgba(255,255,255,0.9)", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
            <div style={{ height: 24, width: 2, background: crosshairFlash ? "#ef4444" : "rgba(255,255,255,0.9)", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
            <div style={{ width: 5, height: 5, border: `1.5px solid ${crosshairFlash ? "#ef4444" : "rgba(255,255,255,0.6)"}`, borderRadius: "50%", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
          </div>
        )}
        {gameState === "idle" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.9)", gap: 14, borderRadius: 4 }}>
            <div style={{ color: "#ef4444", fontSize: "2.2rem", fontWeight: 700, textShadow: "0 0 24px rgba(239,68,68,0.8)" }}>🔫 BOT BLASTER 3D</div>
            <div style={{ color: "#bbb", fontSize: "0.85rem", textAlign: "center", lineHeight: 2, fontFamily: "monospace" }}>
              <b style={{ color: "#00f5ff" }}>W/S</b> — Forward / Back<br />
              <b style={{ color: "#00f5ff" }}>A/D</b> — Strafe Left / Right<br />
              <b style={{ color: "#00f5ff" }}>Mouse</b> — Aim (click to lock)<br />
              <b style={{ color: "#00f5ff" }}>Click / F</b> — Shoot
            </div>
            <button onClick={startGame} style={{ background: "#ef4444", color: "white", border: "none", padding: "12px 36px", borderRadius: 6, fontSize: "1rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 0 24px rgba(239,68,68,0.6)" }}>DEPLOY</button>
          </div>
        )}
        {gameState === "dead" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.92)", gap: 12, borderRadius: 4 }}>
            <div style={{ color: "#ef4444", fontSize: "2.5rem", fontWeight: 700 }}>YOU DIED</div>
            <div style={{ color: "#aaa" }}>Kills: {kills} / 5</div>
            <button onClick={startGame} style={{ background: "#ef4444", color: "white", border: "none", padding: "10px 30px", borderRadius: 6, fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}>RESPAWN</button>
          </div>
        )}
        {gameState === "won" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.88)", gap: 12, borderRadius: 4 }}>
            <div style={{ color: "#22c55e", fontSize: "2rem", fontWeight: 700 }}>MISSION COMPLETE! 🏆</div>
            <div style={{ color: "white" }}>All bots down! HP: {health}</div>
            <button onClick={startGame} style={{ background: "#22c55e", color: "#111", border: "none", padding: "10px 30px", borderRadius: 6, fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}>PLAY AGAIN</button>
          </div>
        )}
      </div>
      <div style={{ color: "#444", fontSize: "0.72rem", fontFamily: "monospace" }}>W/S move • A/D strafe • Mouse look (click to lock) • Click/F shoot</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// GAME: 3D ASTEROID RUNNER
// ─────────────────────────────────────────────
function AsteroidRunner({ onExit }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState("idle");
  const W = 600, H = 420;

  const initState = () => ({
    shipX: 0, shipY: 0,
    shipTargetX: 0, shipTargetY: 0,
    speed: 1, distance: 0,
    asteroids: [],
    stars: Array.from({length:80}, () => ({ x:(Math.random()-0.5)*6, y:(Math.random()-0.5)*4, z:Math.random()*12+0.5 })),
    spawnTimer: 0, running: true, frame: 0,
    boost: false, boostCool: 0,
    shields: 3,
  });

  const startGame = useCallback(() => {
    stateRef.current = initState();
    setScore(0); setGameState("running");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Pointer lock for immersive mouse steering
    const onPLC = () => {};
    document.addEventListener("pointerlockchange", onPLC);

    const onMouse = (e) => {
      if (document.pointerLockElement !== canvas) return;
      const s = stateRef.current;
      if (!s || !s.running) return;
      s.shipTargetX = Math.max(-2.5, Math.min(2.5, s.shipTargetX + e.movementX * 0.015));
      s.shipTargetY = Math.max(-1.8, Math.min(1.8, s.shipTargetY + e.movementY * 0.015));
    };
    document.addEventListener("mousemove", onMouse);

    const onCanvasClick = () => {
      const s = stateRef.current;
      if (!s || !s.running) return;
      if (document.pointerLockElement !== canvas) canvas.requestPointerLock();
    };
    canvas.addEventListener("click", onCanvasClick);

    const onKey = (e) => {
      const s = stateRef.current;
      if (!s || !s.running) return;
      if (e.key === " " && s.boostCool <= 0) { s.boost = true; s.boostCool = 120; e.preventDefault(); }
    };
    window.addEventListener("keydown", onKey);

    const project = (x, y, z) => {
      const fov = 400;
      const sx = (x / z) * fov + W / 2;
      const sy = (y / z) * fov + H / 2;
      return { sx, sy, scale: fov / z };
    };

    let animId;
    const loop = () => {
      animId = requestAnimationFrame(loop);
      const s = stateRef.current;

      ctx.fillStyle = "#000010";
      ctx.fillRect(0, 0, W, H);

      if (!s) return;

      // Stars
      s.stars.forEach(star => {
        star.z -= s.speed * 0.08;
        if (star.z <= 0.1) { star.x=(Math.random()-0.5)*6; star.y=(Math.random()-0.5)*4; star.z=12; }
        const { sx, sy, scale } = project(star.x, star.y, star.z);
        if (sx<0||sx>W||sy<0||sy>H) return;
        const size = Math.min(3, scale * 0.015);
        const bright = Math.min(1, 1 - star.z / 12);
        ctx.fillStyle = `rgba(200,220,255,${bright * 0.8})`;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI*2);
        ctx.fill();
      });

      if (s.running) {
        // Smooth ship movement
        s.shipX += (s.shipTargetX - s.shipX) * 0.08;
        s.shipY += (s.shipTargetY - s.shipY) * 0.08;
        s.frame++;
        s.distance += s.speed;
        s.speed = Math.min(4, 1 + s.distance / 2000);
        if (s.boostCool > 0) s.boostCool--;
        if (s.boost) { s.speed = Math.min(6, s.speed + 2); s.boost = false; }
        setScore(Math.floor(s.distance));

        // Spawn asteroids
        s.spawnTimer--;
        if (s.spawnTimer <= 0) {
          s.spawnTimer = Math.max(20, 60 - s.distance/100);
          const cols = ["#8b7355","#6b5a3e","#9a8468","#a0875f","#7a6347"];
          s.asteroids.push({
            x: (Math.random()-0.5)*5, y: (Math.random()-0.5)*3.5, z: 12,
            size: 0.15 + Math.random()*0.35,
            color: cols[Math.floor(Math.random()*cols.length)],
            rotX: Math.random()*0.05, rotY: Math.random()*0.05,
            craters: Array.from({length:3+Math.floor(Math.random()*3)},()=>({ox:(Math.random()-0.5)*0.6,oy:(Math.random()-0.5)*0.6,r:0.1+Math.random()*0.15}))
          });
        }

        // Move & check asteroids
        s.asteroids = s.asteroids.filter(a => a.z > 0.3);
        s.asteroids.forEach(a => {
          a.z -= s.speed * 0.08;
          // Collision
          const { sx: ax, sy: ay, scale } = project(a.x, a.y, Math.max(0.3, a.z));
          const screenAsteroidR = a.size * scale;
          const sx = (s.shipX / 5 + 0.5) * W;
          const sy = (s.shipY / 3 + 0.5) * H;
          if (a.z < 1.5 && Math.hypot(ax - sx, ay - sy) < screenAsteroidR + 18) {
            a.z = -1;
            s.shields--;
            if (s.shields <= 0) { s.running = false; setGameState("dead"); }
          }
        });
      }

      // Draw asteroids (back to front)
      [...s.asteroids].sort((a,b) => b.z - a.z).forEach(a => {
        const z = Math.max(0.3, a.z);
        const { sx, sy, scale } = project(a.x, a.y, z);
        if (sx < -100 || sx > W+100 || sy < -100 || sy > H+100) return;
        const r = a.size * scale;
        if (r < 1) return;

        // Main body
        const grad = ctx.createRadialGradient(sx - r*0.3, sy - r*0.3, r*0.05, sx, sy, r);
        grad.addColorStop(0, "#c4a882");
        grad.addColorStop(0.6, a.color);
        grad.addColorStop(1, "#2a1e0a");
        ctx.fillStyle = grad;
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = r * 0.4;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Craters
        a.craters.forEach(c => {
          const cx = sx + c.ox * r, cy = sy + c.oy * r;
          const cr = c.r * r;
          if (cr < 1) return;
          ctx.fillStyle = "rgba(0,0,0,0.35)";
          ctx.beginPath();
          ctx.arc(cx, cy, cr, 0, Math.PI*2);
          ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.08)";
          ctx.beginPath();
          ctx.arc(cx - cr*0.2, cy - cr*0.2, cr*0.5, 0, Math.PI*2);
          ctx.fill();
        });
      });

      // Draw ship
      const sx = (s.shipX / 5 + 0.5) * W;
      const sy = (s.shipY / 3 + 0.5) * H;
      const tiltX = (s.shipTargetX - s.shipX) * 8;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(tiltX * 0.04);
      // Engine glow
      const engineGlow = ctx.createRadialGradient(0, 30, 2, 0, 30, 28);
      engineGlow.addColorStop(0, "rgba(100,150,255,0.9)");
      engineGlow.addColorStop(0.4, "rgba(80,100,255,0.4)");
      engineGlow.addColorStop(1, "rgba(0,0,255,0)");
      ctx.fillStyle = engineGlow;
      ctx.beginPath();
      ctx.arc(0, 30, 28, 0, Math.PI*2);
      ctx.fill();
      // Boost effect
      if (s.boostCool > 110 || (s.boostCool > 0 && s.boostCool % 4 < 2)) {
        const boostGlow = ctx.createRadialGradient(0, 40, 2, 0, 40, 45);
        boostGlow.addColorStop(0, "rgba(255,200,50,0.9)");
        boostGlow.addColorStop(1, "rgba(255,100,0,0)");
        ctx.fillStyle = boostGlow;
        ctx.beginPath();
        ctx.arc(0, 40, 45, 0, Math.PI*2);
        ctx.fill();
      }
      // Hull
      const hull = ctx.createLinearGradient(-24, -25, 24, 20);
      hull.addColorStop(0, "#e0e8ff");
      hull.addColorStop(0.5, "#8090cc");
      hull.addColorStop(1, "#303060");
      ctx.fillStyle = hull;
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.bezierCurveTo(20, -10, 26, 10, 18, 24);
      ctx.lineTo(-18, 24);
      ctx.bezierCurveTo(-26, 10, -20, -10, 0, -30);
      ctx.fill();
      // Wings
      ctx.fillStyle = "#5060a0";
      ctx.beginPath(); ctx.moveTo(-18,8); ctx.lineTo(-40,22); ctx.lineTo(-22,22); ctx.fill();
      ctx.beginPath(); ctx.moveTo(18,8); ctx.lineTo(40,22); ctx.lineTo(22,22); ctx.fill();
      // Cockpit
      const cockpit = ctx.createRadialGradient(-4, -12, 2, 0, -8, 12);
      cockpit.addColorStop(0, "rgba(150,220,255,0.9)");
      cockpit.addColorStop(1, "rgba(20,60,120,0.7)");
      ctx.fillStyle = cockpit;
      ctx.beginPath();
      ctx.ellipse(0, -8, 9, 13, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();

      // HUD
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, H - 34, W, 34);
      ctx.fillStyle = "#00f5ff";
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`DIST: ${Math.floor(s.distance)} km`, 12, H - 13);
      ctx.textAlign = "center";
      ctx.fillStyle = "#eab308";
      ctx.fillText(`SPEED: ${s.speed.toFixed(1)}x`, W/2, H - 13);
      ctx.textAlign = "right";
      ctx.fillStyle = "#ef4444";
      ctx.fillText(`SHIELDS: ${"🛡️".repeat(Math.max(0,s.shields))}`, W - 10, H - 13);
      ctx.fillStyle = "#888";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(s.boostCool > 0 ? `BOOST ${Math.ceil(s.boostCool/60)}s` : "SPACE: BOOST", W/2, H - 24);
      ctx.textAlign = "left";

      // Pointer lock overlay
      if (document.pointerLockElement !== canvas && s && s.running) {
        ctx.fillStyle = "rgba(0,0,0,0.62)"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "white"; ctx.font = "bold 17px monospace"; ctx.textAlign = "center";
        ctx.fillText("Click to capture mouse & steer", W/2, H/2 - 8);
        ctx.fillStyle = "#aaa"; ctx.font = "12px monospace";
        ctx.fillText("ESC to release", W/2, H/2 + 20);
        ctx.textAlign = "left";
      }
    };
    animId = requestAnimationFrame(loop);

    return () => { cancelAnimationFrame(animId); document.removeEventListener("mousemove", onMouse); document.removeEventListener("pointerlockchange", onPLC); canvas.removeEventListener("click", onCanvasClick); window.removeEventListener("keydown", onKey); if (document.pointerLockElement === canvas) document.exitPointerLock(); };
  }, []);

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12, padding:20, background:"#000010", height:"100%", justifyContent:"center" }}>
      <div style={{ display:"flex", justifyContent:"space-between", width:W, alignItems:"center" }}>
        <span style={{ color:"#00f5ff", fontSize:"1.1rem", fontWeight:700, fontFamily:"monospace" }}>🚀 ASTEROID RUNNER</span>
        <button onClick={onExit} style={{ background:"rgba(255,255,255,0.1)", border:"none", color:"white", padding:"4px 12px", borderRadius:4, cursor:"pointer" }}>← Back</button>
      </div>
      <div style={{ position:"relative" }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ border:"2px solid rgba(0,245,255,0.3)", borderRadius:4, display:"block", cursor:"none" }} />
        {gameState === "idle" && (
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"rgba(0,0,16,0.88)", gap:14, borderRadius:4 }}>
            <div style={{ color:"#00f5ff", fontSize:"2.2rem", fontWeight:700, textShadow:"0 0 20px rgba(0,245,255,0.6)" }}>🚀 ASTEROID RUNNER</div>
            <div style={{ color:"#aaa", fontSize:"0.85rem", textAlign:"center", lineHeight:1.9 }}>
              Move mouse to steer your ship<br/>
              Dodge asteroids flying toward you<br/>
              Space to activate boost!
            </div>
            <button onClick={startGame} style={{ background:"#00f5ff", color:"#000", border:"none", padding:"12px 32px", borderRadius:6, fontSize:"1rem", fontWeight:700, cursor:"pointer" }}>LAUNCH</button>
          </div>
        )}
        {gameState === "dead" && (
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.88)", gap:12, borderRadius:4 }}>
            <div style={{ color:"#ef4444", fontSize:"2rem", fontWeight:700 }}>SHIP DESTROYED!</div>
            <div style={{ color:"white" }}>Distance: {score} km</div>
            <button onClick={startGame} style={{ background:"#00f5ff", color:"#000", border:"none", padding:"10px 28px", borderRadius:6, fontSize:"1rem", fontWeight:700, cursor:"pointer" }}>TRY AGAIN</button>
          </div>
        )}
      </div>
      <div style={{ color:"#555", fontSize:"0.73rem" }}>Move mouse to steer • Space for boost • Survive as long as possible!</div>
    </div>
  );
}


// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// GAME: DUNGEON CRAWLER — fully polished
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// GAME: DUNGEON CRAWLER — fully polished
// ─────────────────────────────────────────────
function DungeonCrawler({ onExit }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const [hp, setHp] = useState(100);
  const [gold, setGold] = useState(0);
  const [keysHeld, setKeysHeld] = useState(0);
  const [floorNum, setFloorNum] = useState(1);
  const [gameState, setGameState] = useState("idle");
  const msgRef = useRef("");
  const msgTimerRef = useRef(null);
  const hudRef = useRef({ hp:100, gold:0, keys:0, floor:1 });

  const W = 640, H = 440;
  const MAP_W = 30, MAP_H = 30;
  const FOV = Math.PI / 2.2;
  const HALF_H = H / 2;

  const FLOOR_THEMES = [
    { name: "Stone Dungeon",    wallBase:[165,130,90],  wallDark:[110,85,60],  ceilTop:"#050509", ceilBot:"#10102a", flrTop:"#2a1a0e", flrBot:"#100806", torchColor:"rgba(255,140,30," },
    { name: "Lava Cavern",      wallBase:[200,80,40],   wallDark:[140,50,20],  ceilTop:"#0f0200", ceilBot:"#200800", flrTop:"#3a0f00", flrBot:"#1a0500", torchColor:"rgba(255,60,0,"  },
    { name: "Ice Fortress",     wallBase:[100,145,200], wallDark:[65,100,150], ceilTop:"#000610", ceilBot:"#001428", flrTop:"#001a30", flrBot:"#000810", torchColor:"rgba(80,180,255," },
    { name: "Cursed Catacombs", wallBase:[110,70,130],  wallDark:[70,40,90],   ceilTop:"#080008", ceilBot:"#180018", flrTop:"#150010", flrBot:"#080004", torchColor:"rgba(200,0,200," },
    { name: "Golden Vault",     wallBase:[210,170,70],  wallDark:[150,120,40], ceilTop:"#0c0600", ceilBot:"#1e1000", flrTop:"#201200", flrBot:"#100800", torchColor:"rgba(255,200,50," },
  ];

  const generateMap = useCallback((floorN) => {
    const m = Array.from({length: MAP_H}, () => Array(MAP_W).fill("#"));
    const rooms = [];

    const tryAddRoom = (x, y, w, h) => {
      if (x < 1 || y < 1 || x + w >= MAP_W - 1 || y + h >= MAP_H - 1) return null;
      for (const r of rooms) {
        if (x < r.x + r.w + 2 && x + w > r.x - 2 && y < r.y + r.h + 2 && y + h > r.y - 2) return null;
      }
      for (let ry = y; ry < y + h; ry++)
        for (let rx = x; rx < x + w; rx++) m[ry][rx] = ".";
      const room = { x, y, w, h, cx: x + Math.floor(w / 2), cy: y + Math.floor(h / 2) };
      rooms.push(room);
      return room;
    };

    const dig = (r1, r2) => {
      let cx = r1.cx, cy = r1.cy;
      // L-shaped corridor
      if (Math.random() < 0.5) {
        while (cx !== r2.cx) { if (m[cy][cx] === "#") m[cy][cx] = "."; cx += cx < r2.cx ? 1 : -1; }
        while (cy !== r2.cy) { if (m[cy][cx] === "#") m[cy][cx] = "."; cy += cy < r2.cy ? 1 : -1; }
      } else {
        while (cy !== r2.cy) { if (m[cy][cx] === "#") m[cy][cx] = "."; cy += cy < r2.cy ? 1 : -1; }
        while (cx !== r2.cx) { if (m[cy][cx] === "#") m[cy][cx] = "."; cx += cx < r2.cx ? 1 : -1; }
      }
    };

    // Generate 14-18 rooms
    const target = 14 + Math.floor(Math.random() * 5);
    for (let attempt = 0; attempt < 200 && rooms.length < target; attempt++) {
      const rw = 4 + Math.floor(Math.random() * 6);
      const rh = 4 + Math.floor(Math.random() * 5);
      tryAddRoom(
        1 + Math.floor(Math.random() * (MAP_W - rw - 2)),
        1 + Math.floor(Math.random() * (MAP_H - rh - 2)),
        rw, rh
      );
    }

    // Connect all rooms
    for (let i = 1; i < rooms.length; i++) dig(rooms[i - 1], rooms[i]);
    // Extra connections for loops
    if (rooms.length > 5) {
      dig(rooms[0], rooms[Math.floor(rooms.length * 0.6)]);
      dig(rooms[rooms.length - 1], rooms[Math.floor(rooms.length * 0.3)]);
    }

    // Secret rooms: small hidden rooms accessible via narrow passage
    const secretRooms = [];
    for (let att = 0; att < 40 && secretRooms.length < 3; att++) {
      const sw = 3 + Math.floor(Math.random() * 2), sh = 3 + Math.floor(Math.random() * 2);
      const sx = 2 + Math.floor(Math.random() * (MAP_W - sw - 3));
      const sy = 2 + Math.floor(Math.random() * (MAP_H - sh - 3));
      let ok = true;
      for (const r of rooms) {
        if (sx < r.x + r.w + 1 && sx + sw > r.x - 1 && sy < r.y + r.h + 1 && sy + sh > r.y - 1) { ok = false; break; }
      }
      if (ok) {
        for (let ry = sy; ry < sy + sh; ry++) for (let rx = sx; rx < sx + sw; rx++) m[ry][rx] = ".";
        const sr = { x: sx, y: sy, w: sw, h: sh, cx: sx + Math.floor(sw / 2), cy: sy + Math.floor(sh / 2) };
        secretRooms.push(sr);
        // Connect to nearest main room with single-cell corridor (easy to miss!)
        const near = rooms.reduce((b, r) => Math.hypot(r.cx - sr.cx, r.cy - sr.cy) < Math.hypot(b.cx - sr.cx, b.cy - sr.cy) ? r : b, rooms[0]);
        dig(sr, near);
      }
    }

    // Exit and boss markers
    const exitRoom = rooms[rooms.length - 1];
    const bossRoom = rooms[rooms.length - 2] || rooms[Math.floor(rooms.length / 2)];
    m[exitRoom.cy][exitRoom.cx] = "E";

    // Items
    const items = [];
    const usedCells = new Set([`${exitRoom.cx},${exitRoom.cy}`, `${bossRoom.cx},${bossRoom.cy}`]);
    const placeAt = (type, x, y) => {
      const key = `${x},${y}`;
      if (usedCells.has(key) || !m[y] || m[y][x] === "#") return false;
      usedCells.add(key);
      items.push({ x: x + 0.5, y: y + 0.5, type, collected: false, bob: Math.random() * Math.PI * 2 });
      return true;
    };
    const placeInRoom = (type, room, ox = 0, oy = 0) => placeAt(type, room.cx + ox, room.cy + oy);

    // Regular loot in most rooms
    rooms.forEach((r, i) => {
      if (i === 0) return;
      const roll = Math.random();
      const ox = Math.floor(Math.random() * 3) - 1, oy = Math.floor(Math.random() * 3) - 1;
      if (roll < 0.45) placeInRoom("gold", r, ox, oy);
      else if (roll < 0.65) placeInRoom("health", r, ox, oy);
    });
    // Keys (3 total)
    rooms.slice(2, 8).filter((_, i) => i % 2 === 0).forEach(r => placeInRoom("key", r, 1, 0));
    // Chests (3 total, need keys)
    rooms.slice(4, 10).filter((_, i) => i % 2 === 0).forEach(r => placeInRoom("chest", r, -1, 1));
    // Secret room premium loot
    secretRooms.forEach(r => {
      placeInRoom("gold_big", r);
      placeInRoom("health_big", r, 1, 0);
    });

    // Enemies
    const enemies = [];
    const eTypes = [
      { r: 220, g: 50,  b: 50,  col: "#ef4444", basehp: 2, spd: 0.018, dmg: 8,  name: "Grunt"   },
      { r: 168, g: 85,  b: 247, col: "#a855f7", basehp: 3, spd: 0.022, dmg: 6,  name: "Shade"   },
      { r: 234, g: 179, b: 8,   col: "#eab308", basehp: 1, spd: 0.032, dmg: 5,  name: "Specter" },
      { r: 59,  g: 180, b: 130, col: "#3bb08a", basehp: 3, spd: 0.016, dmg: 10, name: "Golem"   },
    ];
    const numEnemies = 5 + floorN * 2;
    for (let i = 0; i < numEnemies; i++) {
      const r = rooms[1 + Math.floor(Math.random() * (rooms.length - 2))];
      const t = eTypes[i % eTypes.length];
      enemies.push({
        x: r.cx + (Math.random() - 0.5) * 2 + 0.5,
        y: r.cy + (Math.random() - 0.5) * 2 + 0.5,
        ...t, hp: t.basehp + floorN, maxHp: t.basehp + floorN,
        alive: true, moveTimer: Math.floor(Math.random() * 120) + 60, isBoss: false,
      });
    }
    // Boss
    enemies.push({
      x: bossRoom.cx + 0.5, y: bossRoom.cy + 0.5,
      r: 255, g: 20, b: 20, col: "#ff1414",
      hp: 10 + floorN * 5, maxHp: 10 + floorN * 5,
      spd: 0.014, dmg: 18, name: "BOSS",
      alive: true, moveTimer: 200, isBoss: true,
    });

    return { map: m, rooms, secretRooms, items, enemies, startX: rooms[0].cx + 0.5, startY: rooms[0].cy + 0.5 };
  }, []);

  const isWallD = useCallback((map, x, y) => {
    const mx = Math.floor(x), my = Math.floor(y);
    if (mx < 0 || mx >= MAP_W || my < 0 || my >= MAP_H) return true;
    return map[my][mx] === "#";
  }, []);

  const initState = useCallback((fNum, prevGold = 0, prevHp = 100, prevKeys = 0) => {
    const gen = generateMap(fNum);
    return {
      ...gen, px: gen.startX, py: gen.startY, pangle: 0.3,
      hp: Math.min(100, prevHp + 15), gold: prevGold, keys: prevKeys,
      floor: fNum, attackCool: 0, hitTimer: 0, running: true,
      bobPhase: 0, swingPhase: 0,
    };
  }, [generateMap]);

  const startGame = useCallback(() => {
    const s = initState(1, 0, 100, 0);
    stateRef.current = s;
    setHp(100); setGold(0); setKeysHeld(0); setFloorNum(1); setGameState("running");
    msgRef.current = "";
  }, [initState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const keys = {};

    const onPLC = () => {};
    document.addEventListener("pointerlockchange", onPLC);
    const onMM = (e) => {
      if (document.pointerLockElement !== canvas) return;
      const s = stateRef.current;
      if (s && s.running) s.pangle += e.movementX * 0.0025;
    };
    document.addEventListener("mousemove", onMM);
    canvas.addEventListener("click", () => {
      if (document.pointerLockElement !== canvas) canvas.requestPointerLock();
    });

    const onKD = (e) => {
      keys[e.key.toLowerCase()] = true;
      if ([" ", "f", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) e.preventDefault();
    };
    const onKU = (e) => { keys[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", onKD);
    window.addEventListener("keyup", onKU);

    // Sync HUD state to React at 10fps — avoids re-renders breaking pointer lock
    const hudInterval = setInterval(() => {
      const s = stateRef.current;
      if (!s) return;
      const h = hudRef.current;
      if (h.hp !== s.hp) { h.hp = s.hp; setHp(Math.max(0, s.hp)); }
      if (h.gold !== s.gold) { h.gold = s.gold; setGold(s.gold); }
      if (h.keys !== s.keys) { h.keys = s.keys; setKeysHeld(s.keys); }
      if (h.floor !== s.floor) { h.floor = s.floor; setFloorNum(s.floor); }
    }, 100);

    const showMsg = (text) => {
      msgRef.current = text;
      if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
      msgTimerRef.current = setTimeout(() => { msgRef.current = ""; }, 2200);
    };

    let animId, frame = 0;
    const loop = () => {
      animId = requestAnimationFrame(loop);
      frame++;
      const s = stateRef.current;
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
      if (!s) return;

      const theme = FLOOR_THEMES[(s.floor - 1) % FLOOR_THEMES.length];
      const torchFlicker = 0.82 + Math.sin(frame * 0.055) * 0.10 + Math.cos(frame * 0.12) * 0.05;

      if (s.running) {
        const SPEED = 0.045, RSPD = 0.032;
        // Arrow keys = rotation, WASD = move/strafe
        if (keys["arrowleft"])  s.pangle -= RSPD;
        if (keys["arrowright"]) s.pangle += RSPD;
        const fwd = keys["w"] ? 1 : keys["s"] ? -1 : 0;
        const str = keys["a"] ? -1 : keys["d"] ? 1 : 0;
        if (fwd !== 0) {
          const nx = s.px + Math.cos(s.pangle) * SPEED * fwd;
          const ny = s.py + Math.sin(s.pangle) * SPEED * fwd;
          if (!isWallD(s.map, nx, s.py)) s.px = nx;
          if (!isWallD(s.map, s.px, ny)) s.py = ny;
        }
        if (str !== 0) {
          const sa = s.pangle + Math.PI / 2;
          const nx = s.px + Math.cos(sa) * SPEED * str;
          const ny = s.py + Math.sin(sa) * SPEED * str;
          if (!isWallD(s.map, nx, s.py)) s.px = nx;
          if (!isWallD(s.map, s.px, ny)) s.py = ny;
        }
        if (fwd || str) s.bobPhase += 0.12;
        if (s.attackCool > 0) s.attackCool--;
        if (s.hitTimer > 0) s.hitTimer--;

        // Attack
        if ((keys["f"] || keys[" "]) && s.attackCool === 0) {
          s.attackCool = 22; s.swingPhase = 22;
          s.enemies.forEach(en => {
            if (!en.alive) return;
            const dist = Math.hypot(s.px - en.x, s.py - en.y);
            if (dist < 1.9) {
              let aToE = Math.atan2(en.y - s.py, en.x - s.px) - s.pangle;
              while (aToE > Math.PI) aToE -= 2 * Math.PI;
              while (aToE < -Math.PI) aToE += 2 * Math.PI;
              if (Math.abs(aToE) < FOV * 0.55) {
                en.hp -= en.isBoss ? 2 : 3;
                if (en.hp <= 0) {
                  en.alive = false;
                  s.gold += en.isBoss ? (60 + s.floor * 25) : (12 + s.floor * 5);
                  if (en.isBoss) showMsg("👑 BOSS DEFEATED! +Big Gold!");
                }
              }
            }
          });
        }
        if (s.swingPhase > 0) s.swingPhase--;

        // Item pickups
        s.items.forEach(item => {
          if (item.collected) return;
          if (Math.hypot(s.px - item.x, s.py - item.y) < 0.72) {
            item.collected = true;
            switch (item.type) {
              case "gold":       s.gold += 15 + s.floor * 5; showMsg("💰 +" + (15 + s.floor * 5) + " gold!"); break;
              case "gold_big":   s.gold += 60 + s.floor * 20; showMsg("💰 Secret! +" + (60 + s.floor * 20) + " gold!"); break;
              case "health":     s.hp = Math.min(100, s.hp + 20); showMsg("❤️ +20 HP!"); break;
              case "health_big": s.hp = Math.min(100, s.hp + 45); showMsg("💖 Secret! +45 HP!"); break;
              case "key":        s.keys = (s.keys || 0) + 1; showMsg("🔑 Key found!"); break;
              case "chest":
                if ((s.keys || 0) > 0) {
                  s.keys--;
                  if (Math.random() < 0.5) { s.gold += 40 + s.floor * 12; showMsg("📦 Chest: " + (40 + s.floor * 12) + " gold!"); }
                  else { s.hp = Math.min(100, s.hp + 40); showMsg("📦 Chest: +40 HP!"); }
                } else {
                  item.collected = false; // put it back
                  showMsg("📦 Need a 🔑 key!");
                }
                break;
            }
          }
        });

        // Enemy AI
        s.enemies.forEach(en => {
          if (!en.alive) return;
          en.moveTimer++;
          const dx = s.px - en.x, dy = s.py - en.y;
          const dist = Math.hypot(dx, dy);
          const toP = Math.atan2(dy, dx);

          if (dist < 10 && dist > 1.1) {
            const nx = en.x + Math.cos(toP) * en.spd;
            const ny = en.y + Math.sin(toP) * en.spd;
            if (!isWallD(s.map, nx, en.y)) en.x = nx;
            else if (!isWallD(s.map, nx, en.y + 0.4)) { en.x = nx; en.y += 0.2; }
            else if (!isWallD(s.map, nx, en.y - 0.4)) { en.x = nx; en.y -= 0.2; }
            if (!isWallD(s.map, en.x, ny)) en.y = ny;
          }

          const shootInterval = en.isBoss ? 55 : 85;
          if (dist < 6 && en.moveTimer % shootInterval === 0) {
            let los = true;
            const steps = Math.ceil(dist / 0.1);
            for (let i = 1; i < steps && los; i++) {
              if (isWallD(s.map, en.x + dx * (i / steps), en.y + dy * (i / steps))) los = false;
            }
            if (los) {
              s.hp -= en.dmg; s.hitTimer = 15;
              if (s.hp <= 0) { s.running = false; setGameState("dead"); }
            }
          }
        });

        // Exit check
        const mx = Math.floor(s.px), my = Math.floor(s.py);
        if (s.map[my] && s.map[my][mx] === "E") {
          const nf = s.floor + 1;
          const ns = initState(nf, s.gold, s.hp, s.keys);
          stateRef.current = ns;
          showMsg(`⬇ Floor ${nf}: ${FLOOR_THEMES[(nf - 1) % FLOOR_THEMES.length].name}`);
          return;
        }
      }

      // ── FLOOR & CEILING with bob ──
      const bob = Math.sin(s.bobPhase) * 2.8;
      const halfH = HALF_H + bob;

      const cg = ctx.createLinearGradient(0, 0, 0, halfH);
      cg.addColorStop(0, theme.ceilTop); cg.addColorStop(1, theme.ceilBot);
      ctx.fillStyle = cg; ctx.fillRect(0, 0, W, halfH);

      const fg = ctx.createLinearGradient(0, halfH, 0, H);
      fg.addColorStop(0, theme.flrTop); fg.addColorStop(0.65, theme.flrBot);
      ctx.fillStyle = fg; ctx.fillRect(0, halfH, W, H - halfH);

      // Perspective floor grid (strong depth cue)
      ctx.strokeStyle = "rgba(255,255,255,0.045)"; ctx.lineWidth = 1;
      for (let gi = 1; gi <= 10; gi++) {
        const t = halfH + (H - halfH) * (gi / 10);
        ctx.beginPath(); ctx.moveTo(0, t); ctx.lineTo(W, t); ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255,255,255,0.028)";
      for (let gi = 0; gi <= 14; gi++) {
        const x = W * (gi / 14);
        ctx.beginPath(); ctx.moveTo(W / 2, halfH); ctx.lineTo(x, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(W / 2, halfH); ctx.lineTo(x, 0); ctx.stroke();
      }

      // ── RAYCASTING: 2px bands for smooth walls ──
      const BAND = 2;
      const zBuf = new Float32Array(W);

      for (let col = 0; col < W; col += BAND) {
        const ra = s.pangle - FOV / 2 + ((col + BAND * 0.5) / W) * FOV;
        const cosA = Math.cos(ra), sinA = Math.sin(ra);
        let mapX = Math.floor(s.px), mapY = Math.floor(s.py);
        const ddX = Math.abs(1 / cosA), ddY = Math.abs(1 / sinA);
        const stX = cosA < 0 ? -1 : 1, stY = sinA < 0 ? -1 : 1;
        let sdX = cosA < 0 ? (s.px - mapX) * ddX : (mapX + 1 - s.px) * ddX;
        let sdY = sinA < 0 ? (s.py - mapY) * ddY : (mapY + 1 - s.py) * ddY;
        let side = 0;
        for (let i = 0; i < 52; i++) {
          if (sdX < sdY) { sdX += ddX; mapX += stX; side = 0; }
          else { sdY += ddY; mapY += stY; side = 1; }
          if (mapX >= 0 && mapX < MAP_W && mapY >= 0 && mapY < MAP_H && s.map[mapY][mapX] === "#") break;
        }
        const pwd = Math.max(0.08, side === 0
          ? (mapX - s.px + (1 - stX) / 2) / cosA
          : (mapY - s.py + (1 - stY) / 2) / sinA);

        for (let b = 0; b < BAND && col + b < W; b++) zBuf[col + b] = pwd;

        const wallH = Math.min(H * 6, H / pwd);
        const wTop = Math.max(0, halfH - wallH / 2);
        const wBot = Math.min(H, halfH + wallH / 2);

        // Torch-lit wall color
        const fog = Math.max(0, 1 - pwd / 12) * torchFlicker;
        const sideDim = side === 0 ? 1.0 : 0.52;
        const [wr, wg, wb] = theme.wallBase;
        const [dr, dg, db] = theme.wallDark;
        // Interpolate between dark and base based on distance+torch
        const bright = fog * sideDim;
        const cr = Math.floor(dr + (wr - dr) * bright);
        const cg2 = Math.floor(dg + (wg - dg) * bright);
        const cb = Math.floor(db + (wb - db) * bright);

        if (wBot > wTop) {
          // Vertical gradient: brighter at top (simulates overhead lighting)
          const wGrad = ctx.createLinearGradient(col, wTop, col, wBot);
          wGrad.addColorStop(0,    `rgb(${Math.min(255,Math.floor(cr*1.35))},${Math.min(255,Math.floor(cg2*1.35))},${Math.min(255,Math.floor(cb*1.35))})`);
          wGrad.addColorStop(0.25, `rgb(${cr},${cg2},${cb})`);
          wGrad.addColorStop(0.75, `rgb(${Math.floor(cr*0.82)},${Math.floor(cg2*0.82)},${Math.floor(cb*0.82)})`);
          wGrad.addColorStop(1,    `rgb(${Math.floor(cr*0.6)},${Math.floor(cg2*0.6)},${Math.floor(cb*0.6)})`);
          ctx.fillStyle = wGrad;
          ctx.fillRect(col, wTop, Math.min(BAND, W - col), wBot - wTop);

          // Subtle edge highlight on near walls for depth
          if (pwd < 2.5 && side === 0) {
            ctx.fillStyle = `rgba(255,255,255,${(1 - pwd / 2.5) * 0.06})`;
            ctx.fillRect(col, wTop, Math.min(BAND, W - col), 2);
          }
        }
      }

      // ── SPRITES: items + enemies ──
      const allSprites = [
        ...s.items.filter(i => !i.collected).map(i => ({ ...i, isItem: true, dist: Math.hypot(i.x - s.px, i.y - s.py) })),
        ...s.enemies.filter(e => e.alive).map(e => ({ ...e, isEnemy: true, dist: Math.hypot(e.x - s.px, e.y - s.py) })),
      ].sort((a, b) => b.dist - a.dist);

      allSprites.forEach(spr => {
        const dist = spr.dist;
        if (dist < 0.28 || dist > 12) return;
        let sa = Math.atan2(spr.y - s.py, spr.x - s.px) - s.pangle;
        while (sa > Math.PI) sa -= 2 * Math.PI;
        while (sa < -Math.PI) sa += 2 * Math.PI;
        if (Math.abs(sa) > FOV * 0.68) return;

        const screenX = Math.floor(W * (0.5 + sa / FOV));
        const sprH = Math.min(H * 4.5, H / dist);
        const sprW = spr.isItem ? sprH * 0.5 : sprH * (spr.isBoss ? 1.05 : 0.72);
        const dSX = Math.floor(screenX - sprW / 2);
        const dSY = Math.floor(halfH - sprH * (spr.isBoss ? 0.54 : 0.5));

        let anyVis = false;
        for (let sx = Math.max(0, dSX); sx < Math.min(W, dSX + sprW); sx++) {
          if (zBuf[sx] > dist) { anyVis = true; break; }
        }
        if (!anyVis) return;

        const fogBright = Math.max(0.35, Math.min(1, 1 - dist / 10)) * torchFlicker;
        ctx.save();
        ctx.beginPath();
        ctx.rect(Math.max(0, dSX), 0, Math.min(W, dSX + sprW) - Math.max(0, dSX), H);
        ctx.clip();
        // Always fully opaque — fog handled via color darkening not alpha

        if (spr.isItem) {
          const pulse = 0.88 + Math.sin(frame * 0.08 + spr.bob) * 0.12;
          const itemColors = { gold: "#ffd700", gold_big: "#ffaa00", health: "#22c55e", health_big: "#00ff88", key: "#00f5ff", chest: "#cd853f" };
          const glowC = itemColors[spr.type] || "#fff";
          ctx.shadowColor = glowC; ctx.shadowBlur = sprH * 0.38;

          if (spr.type === "chest") {
            // Chest body
            ctx.fillStyle = "#7a4a28"; ctx.fillRect(dSX + sprW * 0.1, dSY + sprH * 0.35, sprW * 0.8, sprH * 0.45);
            ctx.fillStyle = "#a06030"; ctx.fillRect(dSX + sprW * 0.1, dSY + sprH * 0.3, sprW * 0.8, sprH * 0.12);
            ctx.fillStyle = "#ffd700"; ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 8;
            ctx.beginPath(); ctx.arc(screenX, dSY + sprH * 0.38, sprW * 0.09, 0, Math.PI * 2); ctx.fill();
            // Lock color hint if no key
          } else if (spr.type === "key") {
            ctx.shadowColor = "#00f5ff"; ctx.shadowBlur = 12;
            ctx.strokeStyle = "#00f5ff"; ctx.lineWidth = Math.max(2, sprW * 0.1);
            ctx.beginPath(); ctx.arc(screenX - sprW * 0.1, dSY + sprH * 0.5, sprW * 0.22 * pulse, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(screenX + sprW * 0.12, dSY + sprH * 0.5); ctx.lineTo(screenX + sprW * 0.45, dSY + sprH * 0.5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(screenX + sprW * 0.35, dSY + sprH * 0.5); ctx.lineTo(screenX + sprW * 0.35, dSY + sprH * 0.38); ctx.stroke();
          } else {
            ctx.fillStyle = glowC;
            ctx.beginPath(); ctx.arc(screenX, dSY + sprH * 0.52, sprW * 0.3 * pulse, 0, Math.PI * 2); ctx.fill();
            const icons = { gold: "💰", gold_big: "💰", health: "❤️", health_big: "💖" };
            ctx.font = `${Math.max(10, sprH * 0.32)}px serif`;
            ctx.textAlign = "center"; ctx.shadowBlur = 0;
            ctx.fillText(icons[spr.type] || "?", screenX, dSY + sprH * 0.7);
          }
          ctx.shadowBlur = 0;
        } else {
          // Enemy rendering
          const er = Math.floor(spr.r * fogBright), eg = Math.floor(spr.g * fogBright), eb = Math.floor(spr.b * fogBright);
          const hR = sprW * (spr.isBoss ? 0.23 : 0.2);
          const hCX = screenX, hCY = dSY + sprH * (spr.isBoss ? 0.11 : 0.13);

          // Head
          const hg = ctx.createRadialGradient(hCX - hR * 0.3, hCY - hR * 0.3, hR * 0.05, hCX, hCY, hR * 1.15);
          hg.addColorStop(0, `rgba(${Math.min(255, er + 70)},${Math.min(255, eg + 70)},${Math.min(255, eb + 70)},0.95)`);
          hg.addColorStop(1, `rgba(${er},${eg},${eb},0.85)`);
          ctx.fillStyle = hg;
          ctx.beginPath(); ctx.ellipse(hCX, hCY, hR, hR * (spr.isBoss ? 1.3 : 1.12), 0, 0, Math.PI * 2); ctx.fill();

          // Boss crown
          if (spr.isBoss) {
            ctx.fillStyle = "#ffd700"; ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 12;
            for (let ci = 0; ci < 3; ci++) {
              const cx3 = hCX + (ci - 1) * hR * 0.55;
              ctx.beginPath();
              ctx.moveTo(cx3 - hR * 0.2, hCY - hR * 0.6);
              ctx.lineTo(cx3, hCY - hR * 1.5);
              ctx.lineTo(cx3 + hR * 0.2, hCY - hR * 0.6);
              ctx.fill();
            }
            ctx.shadowBlur = 0;
          }

          // Glowing eyes
          ctx.shadowColor = spr.isBoss ? "#ff0000" : `rgb(${spr.r},${spr.g},${spr.b})`;
          ctx.shadowBlur = spr.isBoss ? 18 : 9;
          ctx.fillStyle = spr.isBoss ? "#ff3a3a" : "rgba(255,90,90,0.95)";
          ctx.beginPath(); ctx.arc(hCX - hR * 0.3, hCY - hR * 0.04, hR * 0.14, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(hCX + hR * 0.3, hCY - hR * 0.04, hR * 0.14, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;

          // Body
          const bL = dSX + sprW * 0.14, bT = dSY + sprH * 0.27, bW = sprW * 0.72, bH = sprH * (spr.isBoss ? 0.52 : 0.44);
          const bGrad = ctx.createLinearGradient(bL, bT, bL, bT + bH);
          bGrad.addColorStop(0, `rgba(${er},${eg},${eb},0.95)`);
          bGrad.addColorStop(1, `rgba(${Math.floor(er * 0.58)},${Math.floor(eg * 0.58)},${Math.floor(eb * 0.58)},0.85)`);
          ctx.fillStyle = bGrad; ctx.fillRect(bL, bT, bW, bH);

          // Armor stripes
          ctx.fillStyle = `rgba(${Math.floor(er * 0.45)},${Math.floor(eg * 0.45)},${Math.floor(eb * 0.45)},0.7)`;
          ctx.fillRect(bL + bW * 0.08, bT + bH * 0.12, bW * 0.84, bH * 0.1);
          ctx.fillRect(bL + bW * 0.08, bT + bH * 0.38, bW * 0.84, bH * 0.1);

          // Arms
          ctx.fillStyle = `rgba(${er},${eg},${eb},0.8)`;
          ctx.fillRect(bL - sprW * 0.13, bT + bH * 0.05, sprW * 0.13, bH * 0.75);
          ctx.fillRect(bL + bW, bT + bH * 0.05, sprW * 0.13, bH * 0.75);
          // Weapon
          ctx.fillStyle = "#777";
          ctx.fillRect(bL + bW + sprW * 0.07, bT - bH * 0.25, sprW * 0.05, bH * 0.85);

          // Legs
          ctx.fillStyle = `rgba(${Math.floor(er * 0.72)},${Math.floor(eg * 0.72)},${Math.floor(eb * 0.72)},0.82)`;
          ctx.fillRect(bL + bW * 0.06, bT + bH, sprW * 0.28, sprH * 0.17);
          ctx.fillRect(bL + bW * 0.58, bT + bH, sprW * 0.28, sprH * 0.17);

          // Boss outline glow
          if (spr.isBoss) {
            ctx.strokeStyle = `rgba(255,0,0,${0.3 + Math.sin(frame * 0.1) * 0.15})`;
            ctx.lineWidth = 3;
            ctx.strokeRect(bL - 3, dSY - hR * 2.4, bW + 6, bH + sprH * 0.22 + hR * 2.4);
            ctx.lineWidth = 1;
          }

          // HP bar
          const bhW = Math.max(24, sprW * (spr.isBoss ? 1.12 : 0.9));
          const bhH = Math.max(4, sprH * 0.022);
          const bhX = screenX - bhW / 2, bhY = dSY - bhH - (spr.isBoss ? 10 : 4);
          if (bhY > 0) {
            ctx.fillStyle = "#111"; ctx.fillRect(bhX - 1, bhY - 1, bhW + 2, bhH + 2);
            ctx.fillStyle = "#2a2a2a"; ctx.fillRect(bhX, bhY, bhW, bhH);
            const hpF = spr.hp / spr.maxHp;
            ctx.fillStyle = spr.isBoss ? (hpF > 0.5 ? "#ff6600" : "#ff0000") : hpF > 0.6 ? "#22c55e" : hpF > 0.3 ? "#eab308" : "#ef4444";
            ctx.fillRect(bhX, bhY, bhW * hpF, bhH);
            if (spr.isBoss) {
              ctx.fillStyle = "#fff"; ctx.font = `bold ${Math.max(8, bhH + 4)}px monospace`;
              ctx.textAlign = "center";
              ctx.fillText("👑 BOSS", screenX, bhY - 3);
              ctx.textAlign = "left";
            }
          }
        }
        ctx.globalAlpha = 1;
        ctx.restore();
      });

      // ── TORCH VIGNETTE (flickering light) ──
      const tvign = ctx.createRadialGradient(W / 2, H / 2, H * 0.05, W / 2, H / 2, H * 0.96);
      tvign.addColorStop(0, "rgba(0,0,0,0)");
      tvign.addColorStop(0.5, "rgba(0,0,0,0.12)");
      tvign.addColorStop(1, `rgba(0,0,0,${0.82 - torchFlicker * 0.14})`);
      ctx.fillStyle = tvign; ctx.fillRect(0, 0, W, H);

      // Warm torch glow from below-center
      const tGlow = ctx.createRadialGradient(W / 2, H * 0.82, 0, W / 2, H * 0.82, W * 0.7);
      tGlow.addColorStop(0, `${theme.torchColor}${(torchFlicker * 0.1).toFixed(2)})`);
      tGlow.addColorStop(1, "rgba(255,60,0,0)");
      ctx.fillStyle = tGlow; ctx.fillRect(0, 0, W, H);

      // ── HIT VIGNETTE ──
      if (s.hitTimer > 0) {
        const hv = ctx.createRadialGradient(W / 2, H / 2, H * 0.06, W / 2, H / 2, H);
        hv.addColorStop(0, "rgba(255,0,0,0)");
        hv.addColorStop(0.55, `rgba(255,0,0,${(s.hitTimer / 15) * 0.22})`);
        hv.addColorStop(1, `rgba(255,0,0,${(s.hitTimer / 15) * 0.68})`);
        ctx.fillStyle = hv; ctx.fillRect(0, 0, W, H);
      }

      // ── SWORD ──
      const swing = s.swingPhase > 0;
      const swingRot = swing ? ((22 - s.swingPhase) / 22) * 1.5 : 0;
      const swOff = swing ? -32 : 0;
      ctx.save();
      ctx.translate(W * 0.64 + swOff + Math.sin(s.bobPhase) * 3, H * 0.59 - swOff * 0.45 + bob * 1.2);
      ctx.rotate(-0.28 + swingRot);
      // Blade
      const bldG = ctx.createLinearGradient(-3, -68, 5, -68);
      bldG.addColorStop(0, "#d8e0f0"); bldG.addColorStop(0.5, "#a0a8c0"); bldG.addColorStop(1, "#585868");
      ctx.fillStyle = bldG;
      ctx.beginPath(); ctx.moveTo(-3, -72); ctx.lineTo(5, -72); ctx.lineTo(3, 0); ctx.lineTo(-2, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.45)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(3, -66); ctx.lineTo(3, -5); ctx.stroke();
      // Guard
      ctx.fillStyle = "#8b7a50"; ctx.fillRect(-10, -2, 22, 7);
      ctx.fillStyle = "#a09062"; ctx.fillRect(-8, 0, 18, 3);
      // Grip
      ctx.fillStyle = "#6b4830"; ctx.fillRect(-3, 5, 8, 22);
      ctx.fillStyle = "#4a3020";
      for (let gi = 0; gi < 3; gi++) ctx.fillRect(-3, 7 + gi * 6, 8, 3);
      // Pommel
      ctx.fillStyle = "#9a8a60"; ctx.beginPath(); ctx.arc(1, 28, 5, 0, Math.PI * 2); ctx.fill();
      // Swing arc
      if (swing && s.swingPhase > 10) {
        ctx.strokeStyle = `rgba(200,225,255,${(s.swingPhase - 10) / 12 * 0.65})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, 58, -Math.PI * 0.52, -Math.PI * 0.08); ctx.stroke();
        ctx.lineWidth = 1;
      }
      ctx.restore();

      // ── MINIMAP ──
      const mm = 3, mmX = W - MAP_W * mm - 8, mmY = 8;
      ctx.fillStyle = "rgba(0,0,0,0.68)";
      ctx.fillRect(mmX - 2, mmY - 2, MAP_W * mm + 4, MAP_H * mm + 4);
      for (let my = 0; my < MAP_H; my++)
        for (let mx = 0; mx < MAP_W; mx++) {
          const cell = s.map[my][mx];
          if (cell === "#") ctx.fillStyle = "rgba(150,135,110,0.7)";
          else if (cell === "E") ctx.fillStyle = "rgba(0,255,100,0.95)";
          else ctx.fillStyle = "rgba(22,18,12,0.45)";
          ctx.fillRect(mmX + mx * mm, mmY + my * mm, mm - 1, mm - 1);
        }
      // Item dots on minimap
      const itmColors = { gold: "#ffd700", gold_big: "#ff8800", health: "#22c55e", health_big: "#00ff88", key: "#00f5ff", chest: "#cd853f" };
      s.items.filter(i => !i.collected).forEach(i => {
        ctx.fillStyle = itmColors[i.type] || "#fff";
        ctx.fillRect(mmX + Math.floor(i.x) * mm, mmY + Math.floor(i.y) * mm, mm, mm);
      });
      // Enemy dots
      s.enemies.filter(e => e.alive).forEach(e => {
        ctx.fillStyle = e.isBoss ? "#ff0000" : e.col;
        ctx.shadowColor = e.isBoss ? "#ff0000" : "none"; ctx.shadowBlur = e.isBoss ? 4 : 0;
        ctx.beginPath(); ctx.arc(mmX + e.x * mm, mmY + e.y * mm, mm * (e.isBoss ? 1.5 : 1), 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      });
      // Player
      ctx.fillStyle = "#00f5ff"; ctx.shadowColor = "#00f5ff"; ctx.shadowBlur = 5;
      ctx.beginPath(); ctx.arc(mmX + s.px * mm, mmY + s.py * mm, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#00f5ff"; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(mmX + s.px * mm, mmY + s.py * mm);
      ctx.lineTo(mmX + (s.px + Math.cos(s.pangle) * 3) * mm, mmY + (s.py + Math.sin(s.pangle) * 3) * mm);
      ctx.stroke();

      // ── HUD ──
      ctx.fillStyle = "rgba(0,0,0,0.72)"; ctx.fillRect(0, H - 42, W, 42);
      const hpF2 = Math.max(0, s.hp / 100);
      ctx.fillStyle = "#2a2a2a"; ctx.fillRect(12, H - 30, 155, 16);
      ctx.fillStyle = hpF2 > 0.6 ? "#22c55e" : hpF2 > 0.3 ? "#eab308" : "#ef4444";
      ctx.fillRect(12, H - 30, 155 * hpF2, 16);
      ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.strokeRect(12, H - 30, 155, 16);
      ctx.fillStyle = "white"; ctx.font = "bold 11px monospace"; ctx.textAlign = "left";
      ctx.fillText(`❤️ ${s.hp}`, 16, H - 17);
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffd700"; ctx.font = "bold 12px monospace";
      ctx.fillText(`💰 ${s.gold}`, W / 2 - 40, H - 17);
      ctx.fillStyle = "#00f5ff";
      ctx.fillText(`🔑 ${s.keys || 0}`, W / 2 + 40, H - 17);
      ctx.textAlign = "right";
      ctx.fillStyle = "#c084fc"; ctx.font = "bold 11px monospace";
      ctx.fillText(`${theme.name} — F${s.floor}`, W - 10, H - 17);
      ctx.fillStyle = "#888"; ctx.font = "10px monospace";
      ctx.fillText("F/SPC: Attack", W - 10, H - 28);
      ctx.textAlign = "left";

      // Message popup
      if (msgRef.current) {
        ctx.fillStyle = "rgba(0,0,0,0.78)"; ctx.fillRect(W / 2 - 110, H / 2 - 52, 220, 38);
        ctx.fillStyle = "#ffd700"; ctx.font = "bold 15px monospace"; ctx.textAlign = "center";
        ctx.fillText(msgRef.current, W / 2, H / 2 - 28); ctx.textAlign = "left";
      }

      // Pointer lock hint
      if (document.pointerLockElement !== canvas && s.running) {
        ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "white"; ctx.font = "bold 17px monospace"; ctx.textAlign = "center";
        ctx.fillText("Click to capture mouse", W / 2, H / 2 - 8);
        ctx.fillStyle = "#aaa"; ctx.font = "12px monospace";
        ctx.fillText("ESC to release", W / 2, H / 2 + 20); ctx.textAlign = "left";
      }
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(hudInterval);
      window.removeEventListener("keydown", onKD);
      window.removeEventListener("keyup", onKU);
      document.removeEventListener("mousemove", onMM);
      document.removeEventListener("pointerlockchange", onPLC);
      if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
    };
  }, [isWallD, initState, generateMap]);  // stable deps — no re-render loops

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: 16, background: "#050302", height: "100%", justifyContent: "center" }}>
      <div style={{ display: "flex", justifyContent: "space-between", width: W, alignItems: "center" }}>
        <span style={{ color: "#ffd700", fontSize: "1.1rem", fontWeight: 700, fontFamily: "monospace" }}>⚔️ DUNGEON CRAWLER</span>
        <button onClick={() => { if (document.pointerLockElement) document.exitPointerLock(); onExit(); }} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", padding: "4px 12px", borderRadius: 4, cursor: "pointer" }}>← Back</button>
      </div>
      <div style={{ position: "relative" }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ border: "2px solid rgba(255,215,0,0.3)", borderRadius: 4, display: "block", cursor: "crosshair" }} />
        {gameState === "running" && (
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }}>
            <div style={{ width: 6, height: 6, background: "rgba(255,255,255,0.7)", borderRadius: "50%", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", boxShadow: "0 0 5px white" }} />
          </div>
        )}
        {gameState === "idle" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.93)", gap: 14, borderRadius: 4 }}>
            <div style={{ color: "#ffd700", fontSize: "2.2rem", fontWeight: 700, textShadow: "0 0 24px rgba(255,215,0,0.7)" }}>⚔️ DUNGEON CRAWLER</div>
            <div style={{ color: "#bbb", fontSize: "0.85rem", textAlign: "center", lineHeight: 2, fontFamily: "monospace" }}>
              <b style={{ color: "#00f5ff" }}>W/S</b> — Move Forward / Back<br />
              <b style={{ color: "#00f5ff" }}>A/D</b> — Strafe Left / Right<br />
              <b style={{ color: "#00f5ff" }}>Mouse</b> — Look around (click to lock)<br />
              <b style={{ color: "#00f5ff" }}>F / Space</b> — Attack enemies<br />
              Collect 💰 🔑 📦 ❤️ — find 🚪 Exit to go deeper<br />
              Defeat the 👑 Boss on each floor!
            </div>
            <button onClick={startGame} style={{ background: "#ffd700", color: "#111", border: "none", padding: "12px 36px", borderRadius: 6, fontSize: "1rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 0 24px rgba(255,215,0,0.5)" }}>ENTER DUNGEON</button>
          </div>
        )}
        {gameState === "dead" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.94)", gap: 12, borderRadius: 4 }}>
            <div style={{ color: "#ef4444", fontSize: "2rem", fontWeight: 700 }}>YOU PERISHED</div>
            <div style={{ color: "#aaa" }}>Floor {floorNum} • 💰 {gold} gold</div>
            <button onClick={startGame} style={{ background: "#ffd700", color: "#000", border: "none", padding: "10px 30px", borderRadius: 6, fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}>TRY AGAIN</button>
          </div>
        )}
      </div>
      <div style={{ color: "#444", fontSize: "0.72rem", fontFamily: "monospace" }}>W/S move • A/D strafe • Mouse look (click to lock) • F/Space attack</div>
    </div>
  );
}



// ─────────────────────────────────────────────
// GAME: NIGHT RACER — proper pseudo-3D road
// ─────────────────────────────────────────────
function RacingGame({ onExit }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const [gameState, setGameState] = useState("idle");
  const W = 620, H = 430;

  // Road segment data: curve and hill for each segment
  const buildSegments = () => {
    const segs = [];
    for (let i = 0; i < 1600; i++) {
      segs.push({
        curve: Math.sin(i * 0.06 + 1.2) * 0.55 + Math.cos(i * 0.022) * 0.35,
        hill:  Math.sin(i * 0.042 + 0.8) * 0.4,
        // Decoration type on this segment
        deco: i % 7 === 0 ? "tree" : i % 11 === 0 ? "billboard" : "none",
      });
    }
    return segs;
  };

  const initState = () => ({
    pos: 0,        // current position along the road (in segments)
    speed: 0,
    maxSpeed: 220,
    x: 0,          // lateral offset -1..1
    running: true,
    score: 0,
    offRoad: 0,
    shake: 0,
    traffic: Array.from({ length: 8 }, (_, i) => ({
      segOffset: 8 + i * 12 + Math.floor(Math.random() * 8),
      laneX: (Math.random() - 0.5) * 1.4,
      color: ["#cc3333","#3388cc","#33aa33","#cc8833","#8833cc","#cc8800"][i % 6],
    })),
    segments: buildSegments(),
    stars: Array.from({ length: 70 }, () => ({
      x: Math.random(), y: Math.random() * 0.38, b: 0.3 + Math.random() * 0.7,
    })),
    frame: 0,
  });

  const startGame = useCallback(() => {
    stateRef.current = initState();
    setGameState("running");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const keys = {};
    const onKD = (e) => {
      keys[e.key] = true;
      if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","a","d","w","s"," "].includes(e.key)) e.preventDefault();
    };
    const onKU = (e) => { keys[e.key] = false; };
    window.addEventListener("keydown", onKD);
    window.addEventListener("keyup", onKU);

    const ROAD_W  = 2000;  // road half-width in world units
    const CAM_DEPTH = 0.84;
    const DRAW_DIST = 200; // segments to draw ahead

    // Project a world point to screen
    const project = (camX, camY, camZ, worldX, worldY, worldZ) => {
      const dx = worldX - camX;
      const dy = worldY - camY;
      const dz = worldZ - camZ;
      if (dz <= 0) return null;
      const scale = CAM_DEPTH / dz;
      const sx = (W / 2) + scale * dx * W / 2;
      const sy = (H / 2) + scale * dy * H / 2;
      return { x: sx, y: sy, scale, w: scale * ROAD_W };
    };

    let animId;
    const loop = () => {
      animId = requestAnimationFrame(loop);
      const s = stateRef.current;
      if (!s) return;

      s.frame++;

      if (s.running) {
        // Acceleration
        const accel = (keys["ArrowUp"] || keys["w"]) ? 0.6 : (keys["ArrowDown"] || keys["s"]) ? -0.4 : -0.15;
        s.speed = Math.max(0, Math.min(s.maxSpeed, s.speed + accel));

        // Steering (proportional to speed)
        const steerAmt = 0.04 * (s.speed / s.maxSpeed);
        if (keys["ArrowLeft"] || keys["a"]) s.x = Math.max(-1.0, s.x - steerAmt);
        if (keys["ArrowRight"] || keys["d"]) s.x = Math.min(1.0, s.x + steerAmt);

        // Road curve pushes car
        const si = Math.floor(s.pos) % s.segments.length;
        const curCurve = s.segments[si].curve;
        s.x += curCurve * (s.speed / s.maxSpeed) * 0.012;
        s.x = Math.max(-1.5, Math.min(1.5, s.x));

        // Off-road friction
        if (Math.abs(s.x) > 1.0) {
          s.speed *= 0.97;
          s.shake = 8;
        }
        if (s.shake > 0) s.shake--;

        s.pos += s.speed * 0.012;
        s.score = Math.floor(s.pos * 0.8);
      }

      const shakeY = s.shake > 0 ? (Math.random() - 0.5) * 3 : 0;

      // ── DRAW SKY ──
      const skyG = ctx.createLinearGradient(0, 0, 0, H * 0.45);
      skyG.addColorStop(0, "#020810");
      skyG.addColorStop(1, "#0a1e38");
      ctx.fillStyle = skyG;
      ctx.fillRect(0, 0, W, H * 0.45);

      // Stars
      s.stars.forEach(st => {
        const twinkle = 0.5 + 0.5 * Math.sin(s.frame * 0.04 + st.x * 20);
        ctx.fillStyle = `rgba(200,220,255,${st.b * twinkle * 0.8})`;
        ctx.fillRect(st.x * W, st.y * H * 0.45, 1.5, 1.5);
      });

      // City silhouette on horizon
      ctx.fillStyle = "#08162a";
      let bx = 0;
      const bHeights = [40,70,55,90,60,45,80,55,65,35,75,48,62,50,38,72,58,44,68,52];
      const bWidths  = [28,22,32,20,25,30,18,26,24,34,22,28,20,32,26,24,30,22,28,24];
      bHeights.forEach((bh, bi) => {
        const bw = bWidths[bi % bWidths.length];
        const baseY = H * 0.45 - 2;
        ctx.fillRect(bx, baseY - bh, bw, bh + 2);
        // Windows
        for (let wy = 5; wy < bh - 5; wy += 8) {
          for (let wx = 4; wx < bw - 4; wx += 7) {
            if ((bi * 7 + wy * 3 + wx * 2) % 5 !== 0) {
              ctx.fillStyle = `rgba(255,225,100,${0.3 + ((bi + wy) % 3) * 0.2})`;
              ctx.fillRect(bx + wx, baseY - bh + wy, 3, 4);
              ctx.fillStyle = "#08162a";
            }
          }
        }
        bx += bw + 1;
        if (bx > W) bx = 0;
      });

      // ── DRAW ROAD SEGMENTS (back to front) ──
      const startSeg = Math.floor(s.pos);
      let camX = s.x * ROAD_W;
      let camY = 1500;  // camera height
      let camZ = 0;

      // Accumulate screen positions for each segment
      const screenSegs = [];
      let x = 0, y = 0, z = 0;
      let xInc = 0, yInc = 0;

      for (let n = 0; n < DRAW_DIST; n++) {
        const si = (startSeg + n) % s.segments.length;
        const seg = s.segments[si];
        const scale = CAM_DEPTH / (n + 1);
        const screenX = (W / 2) + (scale * x * W / 2);
        const screenY = (H / 2) + (scale * (y - camY) * H / 2);
        const screenW = scale * ROAD_W;

        xInc += seg.curve;
        x += xInc;
        y += seg.hill;

        if (screenY < 0) continue;

        screenSegs.push({
          sx: screenX, sy: screenY, sw: screenW,
          n, si, seg,
          dark: Math.floor((s.pos + n) / 8) % 2 === 0,
          rumble: Math.floor((s.pos + n) / 4) % 2 === 0,
        });
      }

      // Draw from far to near
      for (let i = screenSegs.length - 1; i >= 0; i--) {
        const cur = screenSegs[i];
        const next = screenSegs[i - 1] || { sx: W / 2, sy: H * 0.45, sw: 0 };

        const y1 = Math.max(H * 0.44, next.sy);
        const y2 = Math.min(H, cur.sy);
        if (y2 <= y1) continue;

        // ── Grass (sides) ──
        const grassCol = cur.dark ? "#0d2210" : "#0a1a0c";
        ctx.fillStyle = grassCol;
        ctx.fillRect(0, y1, W, y2 - y1);

        // ── Road surface ──
        const roadCol = cur.dark ? "#1e1e1e" : "#252525";
        ctx.beginPath();
        ctx.moveTo(cur.sx - cur.sw, cur.sy);
        ctx.lineTo(cur.sx + cur.sw, cur.sy);
        ctx.lineTo(next.sx + next.sw, next.sy);
        ctx.lineTo(next.sx - next.sw, next.sy);
        ctx.fillStyle = roadCol;
        ctx.fill();

        // ── Rumble strips ──
        const rCol = cur.rumble ? "#cc2222" : "#eeeeee";
        const rw = cur.sw * 0.09;
        ctx.beginPath();
        ctx.moveTo(cur.sx - cur.sw - rw, cur.sy);
        ctx.lineTo(cur.sx - cur.sw, cur.sy);
        ctx.lineTo(next.sx - next.sw, next.sy);
        ctx.lineTo(next.sx - next.sw - rw * (next.sw / Math.max(cur.sw, 1)), next.sy);
        ctx.fillStyle = rCol; ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cur.sx + cur.sw, cur.sy);
        ctx.lineTo(cur.sx + cur.sw + rw, cur.sy);
        ctx.lineTo(next.sx + next.sw + rw * (next.sw / Math.max(cur.sw, 1)), next.sy);
        ctx.lineTo(next.sx + next.sw, next.sy);
        ctx.fillStyle = rCol; ctx.fill();

        // ── Center dashes ──
        if (cur.dark) {
          const dw = Math.max(2, cur.sw * 0.035);
          ctx.beginPath();
          ctx.moveTo(cur.sx - dw, cur.sy);
          ctx.lineTo(cur.sx + dw, cur.sy);
          ctx.lineTo(next.sx + dw, next.sy);
          ctx.lineTo(next.sx - dw, next.sy);
          ctx.fillStyle = "#cccc40"; ctx.fill();
        }

        // ── Roadside decorations (trees, billboards) ──
        if (cur.seg.deco !== "none" && i < screenSegs.length - 2) {
          const scale2 = CAM_DEPTH / (cur.n + 1);
          const h = scale2 * 4800;
          const spriteY = cur.sy - h * 0.65;

          if (h > 5) {
            if (cur.seg.deco === "tree") {
              // Left tree
              const lx = cur.sx - cur.sw * 1.55;
              drawTree(ctx, lx, cur.sy, h, s.frame);
              // Right tree
              const rx = cur.sx + cur.sw * 1.55;
              drawTree(ctx, rx, cur.sy, h, s.frame);
            } else if (cur.seg.deco === "billboard") {
              const bh = h * 1.4;
              const bw = bh * 0.65;
              const lx = cur.sx - cur.sw * 1.85;
              drawBillboard(ctx, lx, cur.sy, bw, bh, cur.si);
            }
          }
        }
      }

      // ── Draw traffic cars ──
      s.traffic.forEach(car => {
        const segIdx = screenSegs.findIndex(sg => sg.n >= car.segOffset);
        if (segIdx < 0) return;
        const sg = screenSegs[segIdx];
        if (!sg) return;
        const carScale = CAM_DEPTH / (sg.n + 1);
        const ch = Math.max(4, carScale * 2800);
        const cw = ch * 1.7;
        const cx = sg.sx + car.laneX * sg.sw * 0.7;
        const cy = sg.sy - ch * 0.5;
        if (cy > H || ch < 4) return;

        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.beginPath(); ctx.ellipse(cx, sg.sy, cw * 0.45, ch * 0.12, 0, 0, Math.PI*2); ctx.fill();
        // Body
        ctx.fillStyle = car.color;
        const r = Math.max(1, cw * 0.1);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(cx - cw/2, cy - ch * 0.7, cw, ch, r);
        else ctx.rect(cx - cw/2, cy - ch * 0.7, cw, ch);
        ctx.fill();
        // Roof
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.fillRect(cx - cw * 0.3, cy - ch * 0.7, cw * 0.6, ch * 0.4);
        // Windshield
        ctx.fillStyle = "rgba(150,220,255,0.65)";
        ctx.fillRect(cx - cw * 0.24, cy - ch * 0.67, cw * 0.48, ch * 0.3);
        // Tail lights
        ctx.fillStyle = "#ff3333"; ctx.shadowColor = "#ff1100"; ctx.shadowBlur = cw * 0.4;
        ctx.fillRect(cx - cw * 0.48, cy - ch * 0.25, cw * 0.1, ch * 0.16);
        ctx.fillRect(cx + cw * 0.38, cy - ch * 0.25, cw * 0.1, ch * 0.16);
        ctx.shadowBlur = 0;
      });

      // ── Headlight road glow ──
      ctx.save();
      const hl = ctx.createRadialGradient(W/2, H, 10, W/2, H*0.7, H*0.45);
      hl.addColorStop(0, "rgba(255,248,180,0.18)");
      hl.addColorStop(1, "rgba(255,248,180,0)");
      ctx.fillStyle = hl;
      ctx.beginPath();
      ctx.moveTo(W/2 - 15, H);
      ctx.lineTo(W/2 - 90, H * 0.68);
      ctx.lineTo(W/2 + 90, H * 0.68);
      ctx.lineTo(W/2 + 15, H);
      ctx.fill();
      ctx.restore();

      // ── Player Car ──
      const steerLean = (keys["ArrowLeft"]||keys["a"]) ? -0.08 : (keys["ArrowRight"]||keys["d"]) ? 0.08 : 0;
      const carX = W/2 + shakeY * 0.6;
      const carY = H - 28;
      ctx.save();
      ctx.translate(carX, carY);
      ctx.rotate(steerLean);

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.beginPath(); ctx.ellipse(0, 8, 32, 6, 0, 0, Math.PI*2); ctx.fill();

      // Body gradient
      const bodyG = ctx.createLinearGradient(-30, -50, 30, 5);
      bodyG.addColorStop(0, "#ff7070");
      bodyG.addColorStop(0.45, "#cc2020");
      bodyG.addColorStop(1, "#881010");
      ctx.fillStyle = bodyG;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-28, -46, 56, 50, 7);
      else ctx.rect(-28, -46, 56, 50);
      ctx.fill();

      // Roof
      ctx.fillStyle = "#991818";
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-17, -56, 34, 18, 5);
      else ctx.rect(-17, -56, 34, 18);
      ctx.fill();

      // Windshield
      ctx.fillStyle = "rgba(160,230,255,0.82)";
      ctx.fillRect(-13, -53, 26, 13);

      // Headlights
      ctx.fillStyle = "#ffffaa"; ctx.shadowColor = "#ffff60"; ctx.shadowBlur = 18;
      ctx.fillRect(-26, -42, 10, 7);
      ctx.fillRect(16, -42, 10, 7);
      ctx.shadowBlur = 0;

      // Taillights
      ctx.fillStyle = "#ff4444"; ctx.shadowColor = "#ff1100"; ctx.shadowBlur = 10;
      ctx.fillRect(-26, 0, 10, 5);
      ctx.fillRect(16, 0, 10, 5);
      ctx.shadowBlur = 0;

      // Wheels
      ctx.fillStyle = "#1a1a1a";
      [[-24,-32],[24,-32],[-24,4],[24,4]].forEach(([wx,wy]) => {
        ctx.beginPath(); ctx.ellipse(wx, wy, 7, 9, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#444";
        ctx.beginPath(); ctx.ellipse(wx, wy, 3, 4, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#1a1a1a";
      });
      ctx.restore();

      // ── HUD ──
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect(0, H - 40, W, 40);

      ctx.textAlign = "left"; ctx.font = "bold 13px monospace";
      ctx.fillStyle = "#00f5ff";
      ctx.fillText(`SCORE: ${s.score}`, 12, H - 16);

      ctx.textAlign = "center";
      ctx.fillStyle = "#eab308"; ctx.font = "bold 12px monospace";
      ctx.fillText(`${Math.floor(s.speed)} km/h`, W/2, H-16);

      ctx.textAlign = "right";
      ctx.fillStyle = Math.abs(s.x) > 0.95 ? "#ef4444" : "#22c55e";
      ctx.fillText(Math.abs(s.x) > 0.95 ? "⚠ OFF ROAD" : "ON TRACK", W-10, H-16);

      // Speed bar
      ctx.fillStyle = "#222"; ctx.fillRect(10, H-30, 120, 6);
      const spd01 = s.speed / s.maxSpeed;
      const spG = ctx.createLinearGradient(10, 0, 130, 0);
      spG.addColorStop(0, "#22c55e"); spG.addColorStop(0.6, "#eab308"); spG.addColorStop(1, "#ef4444");
      ctx.fillStyle = spG; ctx.fillRect(10, H-30, 120 * spd01, 6);

      ctx.textAlign = "left";
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", onKD);
      window.removeEventListener("keyup", onKU);
    };
  }, []);

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12, padding:20, background:"#030610", height:"100%", justifyContent:"center" }}>
      <div style={{ display:"flex", justifyContent:"space-between", width:W, alignItems:"center" }}>
        <span style={{ color:"#ef4444", fontSize:"1.1rem", fontWeight:700, fontFamily:"monospace" }}>🏎️ NIGHT RACER</span>
        <button onClick={onExit} style={{ background:"rgba(255,255,255,0.1)", border:"none", color:"white", padding:"4px 12px", borderRadius:4, cursor:"pointer" }}>← Back</button>
      </div>
      <div style={{ position:"relative" }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ border:"2px solid rgba(239,68,68,0.4)", borderRadius:4, display:"block" }} />
        {gameState === "idle" && (
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.9)", gap:16, borderRadius:4 }}>
            <div style={{ color:"#ef4444", fontSize:"2.2rem", fontWeight:700, textShadow:"0 0 20px rgba(239,68,68,0.8)" }}>🏎️ NIGHT RACER</div>
            <div style={{ color:"#bbb", fontSize:"0.85rem", textAlign:"center", lineHeight:2.1, fontFamily:"monospace" }}>
              <b style={{color:"#00f5ff"}}>W / ↑</b> — Accelerate &nbsp; <b style={{color:"#00f5ff"}}>S / ↓</b> — Brake<br/>
              <b style={{color:"#00f5ff"}}>A/D or ←/→</b> — Steer<br/>
              Dodge traffic • Stay on road!
            </div>
            <button onClick={startGame} style={{ background:"#ef4444", color:"white", border:"none", padding:"12px 36px", borderRadius:6, fontSize:"1.05rem", fontWeight:700, cursor:"pointer", boxShadow:"0 0 24px rgba(239,68,68,0.5)" }}>START RACE</button>
          </div>
        )}
      </div>
      <div style={{ color:"#444", fontSize:"0.72rem", fontFamily:"monospace" }}>W/↑ accelerate • S/↓ brake • A/D steer • Stay on road!</div>
    </div>
  );
}

// Helper: draw a pine tree sprite
function drawTree(ctx, x, baseY, h, frame) {
  const w = h * 0.5;
  if (h < 5) return;
  // Trunk
  ctx.fillStyle = "#3a2010";
  ctx.fillRect(x - w * 0.08, baseY - h * 0.25, w * 0.16, h * 0.25);
  // Foliage layers
  const layers = [
    { yFrac: 0.88, wFrac: 0.85, col: "#1a4a1a" },
    { yFrac: 0.65, wFrac: 0.72, col: "#1e5a1e" },
    { yFrac: 0.42, wFrac: 0.55, col: "#226622" },
    { yFrac: 0.22, wFrac: 0.35, col: "#267026" },
  ];
  layers.forEach(l => {
    ctx.fillStyle = l.col;
    ctx.beginPath();
    ctx.moveTo(x, baseY - h * l.yFrac - h * 0.22);
    ctx.lineTo(x - w * l.wFrac, baseY - h * l.yFrac + h * 0.06);
    ctx.lineTo(x + w * l.wFrac, baseY - h * l.yFrac + h * 0.06);
    ctx.fill();
  });
}

// Helper: draw a neon roadside billboard
function drawBillboard(ctx, x, baseY, bw, bh, seed) {
  if (bh < 8) return;
  const poleH = bh * 0.6;
  const boardH = bh * 0.5;
  const boardW = bw;
  // Pole
  ctx.fillStyle = "#555";
  ctx.fillRect(x - bw * 0.05, baseY - poleH, bw * 0.1, poleH);
  // Board
  const msgs = ["FUEL STOP", "CASINO", "HOT DOGS", "MOTEL", "DINER", "SPEED ZONE"];
  const cols  = ["#e31010","#1060cc","#cc8800","#9922cc","#22aa44","#cc4400"];
  const idx = seed % msgs.length;
  ctx.fillStyle = "#111";
  ctx.fillRect(x - boardW/2, baseY - poleH - boardH, boardW, boardH);
  ctx.fillStyle = cols[idx]; ctx.shadowColor = cols[idx]; ctx.shadowBlur = Math.max(4, bw*0.3);
  ctx.fillRect(x - boardW/2 + 2, baseY - poleH - boardH + 2, boardW - 4, boardH - 4);
  ctx.shadowBlur = 0;
  if (boardH > 12) {
    ctx.fillStyle = "white";
    ctx.font = `bold ${Math.max(6, boardH * 0.3)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(msgs[idx], x, baseY - poleH - boardH/2 + boardH * 0.12);
    ctx.textAlign = "left";
  }
}

// ─────────────────────────────────────────────
// GAME: SPACE INVADERS 3D
// ─────────────────────────────────────────────
function SpaceInvaders3D({ onExit }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const [gameState, setGameState] = useState("idle");
  const W = 620, H = 430;

  const spawnWave = (waveNum) => {
    const rows = Math.min(4, 2 + waveNum);
    const cols = Math.min(10, 6 + waveNum);
    const invaders = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        invaders.push({
          x: -2.0 + c * (4.0 / Math.max(cols - 1, 1)),
          y: 1.2 + r * 0.52,
          z: 2.0 + r * 0.28,   // spawn far away, safe distance from player (z<4.5 = safe)
          hp: r === 0 ? 3 : r === 1 ? 2 : 1,
          maxHp: r === 0 ? 3 : r === 1 ? 2 : 1,
          alive: true,
          type: r === 0 ? "boss" : r === 1 ? "mid" : "small",
          shootTimer: 80 + Math.floor(Math.random() * 180),
          animPhase: Math.random() * Math.PI * 2,
        });
      }
    }
    return invaders;
  };

  const initState = (waveNum = 1) => ({
    px: 0, lives: 3, score: 0, wave: waveNum,
    invaders: spawnWave(waveNum),
    bullets: [], eBullets: [],
    shootCool: 0, running: true,
    marchDir: 1, marchTimer: 0,
    stars: Array.from({ length: 90 }, () => ({
      x: (Math.random()-0.5)*8, y: (Math.random()-0.5)*5.5, z: Math.random()*9+1.5,
    })),
    frame: 0, hitFlash: 0,
  });

  const startGame = useCallback(() => {
    stateRef.current = initState(1);
    setGameState("running");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const keys = {};
    const onKD = (e) => {
      keys[e.key] = true;
      if (["ArrowLeft","ArrowRight"," ","a","d"].includes(e.key)) e.preventDefault();
      if (e.key === " ") {
        const s = stateRef.current;
        if (s && s.running && s.shootCool <= 0) {
          s.bullets.push({ x: s.px, z: 5.2, speed: 0.16 });
          s.shootCool = 13;
        }
      }
    };
    const onKU = (e) => { keys[e.key] = false; };
    window.addEventListener("keydown", onKD);
    window.addEventListener("keyup", onKU);

    const proj = (x, y, z) => {
      const fov = 310;
      return { sx: (x / z) * fov + W / 2, sy: -(y / z) * fov + H * 0.5, sc: fov / z };
    };

    const COLS = { boss:"#ef4444", mid:"#a855f7", small:"#22c55e" };

    let animId;
    const loop = () => {
      animId = requestAnimationFrame(loop);
      const s = stateRef.current;

      const bg = ctx.createLinearGradient(0,0,0,H);
      bg.addColorStop(0,"#000508"); bg.addColorStop(1,"#001018");
      ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
      if (!s) return;

      // Stars with gentle drift
      s.stars.forEach(st => {
        const {sx,sy,sc} = proj(st.x, st.y, st.z);
        if(sx<0||sx>W||sy<0||sy>H) return;
        const sz2 = Math.min(2.5, sc*0.011);
        const a = Math.min(1, sc*0.028);
        ctx.fillStyle = `rgba(210,225,255,${a})`;
        ctx.beginPath(); ctx.arc(sx,sy,sz2,0,Math.PI*2); ctx.fill();
      });

      if (s.running) {
        s.frame++;
        const pSpd = 0.042;
        if (keys["ArrowLeft"]||keys["a"]) s.px = Math.max(-2.15, s.px - pSpd);
        if (keys["ArrowRight"]||keys["d"]) s.px = Math.min(2.15, s.px + pSpd);
        if (s.shootCool > 0) s.shootCool--;
        if (s.hitFlash > 0) s.hitFlash--;

        // March invaders
        s.marchTimer++;
        const spd = Math.max(6, 28 - s.wave * 2);
        if (s.marchTimer >= spd) {
          s.marchTimer = 0;
          const alive = s.invaders.filter(i => i.alive);
          const maxX = Math.max(...alive.map(i=>i.x));
          const minX = Math.min(...alive.map(i=>i.x));
          if (maxX > 2.3 && s.marchDir > 0) { s.marchDir = -1; s.invaders.forEach(i=>{if(i.alive)i.z+=0.12;}); }
          if (minX < -2.3 && s.marchDir < 0) { s.marchDir = 1; s.invaders.forEach(i=>{if(i.alive)i.z+=0.12;}); }
          s.invaders.forEach(i => { if(i.alive) { i.x += s.marchDir * 0.05; i.animPhase += 0.18; } });
        }

        // Enemy shooting
        const alive = s.invaders.filter(i => i.alive);
        alive.forEach(inv => {
          inv.shootTimer--;
          if (inv.shootTimer <= 0) {
            inv.shootTimer = 70 + Math.floor(Math.random() * 160);
            if (Math.random() < 0.28 + s.wave * 0.04)
              s.eBullets.push({ x: inv.x, y: -0.15, z: inv.z, spd: 0.055 + s.wave * 0.008 });
          }
        });

        // Move bullets
        s.bullets = s.bullets.filter(b => b.z > 0.5);
        s.bullets.forEach(b => { b.z -= b.speed; });
        s.eBullets = s.eBullets.filter(b => b.z < 7.5);
        s.eBullets.forEach(b => { b.z += b.spd; });

        // Hit detection
        s.bullets.forEach(b => {
          s.invaders.forEach(inv => {
            if (!inv.alive) return;
            if (Math.abs(b.x - inv.x) < 0.28 && Math.abs(b.z - inv.z) < 0.35) {
              inv.hp--; b.z = -1;
              if (inv.hp <= 0) {
                inv.alive = false;
                s.score += inv.type==="boss"?30:inv.type==="mid"?20:10;
              }
            }
          });
        });

        // Enemy bullets hit player
        s.eBullets.forEach(b => {
          if (b.z > 5.85 && Math.abs(b.x - s.px) < 0.22) {
            b.z = 99; s.lives--; s.hitFlash = 18;
            if (s.lives <= 0) { s.running = false; setGameState("dead"); }
          }
        });

        // Invaders reach player
        if (alive.some(i => i.z > 4.5)) { s.running = false; setGameState("dead"); }

        // Wave clear
        if (alive.length === 0) {
          const nw = s.wave + 1;
          s.invaders = spawnWave(nw);
          s.wave = nw;
          s.marchDir = 1; s.marchTimer = 0;
        }
      }

      // Draw invaders (far→near)
      [...s.invaders].filter(i=>i.alive).sort((a,b)=>b.z-a.z).forEach(inv => {
        const {sx,sy,sc} = proj(inv.x, inv.y, inv.z);
        if(sx<-60||sx>W+60||sy<-60||sy>H+60) return;
        const sz2 = Math.max(4, 26*sc);
        const col = COLS[inv.type];
        const bob = Math.sin(inv.animPhase) * sz2 * 0.06;

        ctx.save();
        ctx.translate(sx, sy + bob);

        // Glow
        ctx.shadowColor = col; ctx.shadowBlur = sz2 * 0.55;

        if (inv.type === "boss") {
          // Wide threatening shape
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.ellipse(0,-sz2*0.1,sz2*0.58,sz2*0.45,0,0,Math.PI*2); ctx.fill();
          ctx.fillRect(-sz2*0.45,sz2*0.28,sz2*0.9,sz2*0.38);
          // Pincers
          ctx.fillRect(-sz2*0.72,sz2*0.08,sz2*0.28,sz2*0.22);
          ctx.fillRect(sz2*0.44,sz2*0.08,sz2*0.28,sz2*0.22);
          ctx.fillRect(-sz2*0.8,sz2*0.28,sz2*0.12,sz2*0.3);
          ctx.fillRect(sz2*0.68,sz2*0.28,sz2*0.12,sz2*0.3);
          // Eyes
          ctx.fillStyle="#ffffff"; ctx.shadowColor="#fff"; ctx.shadowBlur=sz2*0.3;
          ctx.beginPath(); ctx.arc(-sz2*0.22,-sz2*0.1,sz2*0.14,0,Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(sz2*0.22,-sz2*0.1,sz2*0.14,0,Math.PI*2); ctx.fill();
          // HP pips
          for(let pi=0;pi<inv.maxHp;pi++){
            ctx.fillStyle = pi<inv.hp?"#ffd700":"#333";
            ctx.shadowColor=pi<inv.hp?"#ffd700":"transparent"; ctx.shadowBlur=pi<inv.hp?4:0;
            ctx.beginPath(); ctx.arc(-sz2*0.25+pi*sz2*0.25,-sz2*0.7,sz2*0.1,0,Math.PI*2); ctx.fill();
          }
        } else if (inv.type === "mid") {
          // Crab shape
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.ellipse(0,0,sz2*0.48,sz2*0.32,0,0,Math.PI*2); ctx.fill();
          ctx.fillRect(-sz2*0.65,-sz2*0.08,sz2*0.2,sz2*0.22);
          ctx.fillRect(sz2*0.45,-sz2*0.08,sz2*0.2,sz2*0.22);
          const legY = sz2*0.28;
          for(let li=-1;li<=1;li+=2){
            ctx.fillRect(li*(sz2*0.3),legY,sz2*0.08,sz2*0.28);
            ctx.fillRect(li*(sz2*0.5),legY+sz2*0.1,sz2*0.08,sz2*0.2);
          }
          ctx.fillStyle="#ffff00"; ctx.shadowColor="#ffff00"; ctx.shadowBlur=sz2*0.25;
          ctx.beginPath(); ctx.arc(-sz2*0.18,-sz2*0.06,sz2*0.1,0,Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(sz2*0.18,-sz2*0.06,sz2*0.1,0,Math.PI*2); ctx.fill();
          if (inv.hp < inv.maxHp) {
            ctx.fillStyle="#ef4444"; ctx.shadowColor="#ef4444"; ctx.shadowBlur=4;
            ctx.beginPath(); ctx.arc(0,-sz2*0.55,sz2*0.1,0,Math.PI*2); ctx.fill();
          }
        } else {
          // Classic pixel invader
          ctx.fillStyle = col;
          ctx.fillRect(-sz2*0.32,-sz2*0.22,sz2*0.64,sz2*0.44);
          ctx.fillRect(-sz2*0.18,-sz2*0.46,sz2*0.36,sz2*0.24);
          ctx.fillRect(-sz2*0.5,sz2*0.12,sz2*0.18,sz2*0.26);
          ctx.fillRect(sz2*0.32,sz2*0.12,sz2*0.18,sz2*0.26);
          ctx.fillRect(-sz2*0.54,-sz2*0.08,sz2*0.14,sz2*0.16);
          ctx.fillRect(sz2*0.40,-sz2*0.08,sz2*0.14,sz2*0.16);
          ctx.fillStyle="#000";
          ctx.fillRect(-sz2*0.21,-sz2*0.12,sz2*0.13,sz2*0.13);
          ctx.fillRect(sz2*0.08,-sz2*0.12,sz2*0.13,sz2*0.13);
        }
        ctx.shadowBlur = 0;
        ctx.restore();
      });

      // Player bullets
      s.bullets.forEach(b => {
        const {sx,sy,sc} = proj(b.x, 0, b.z);
        ctx.fillStyle="#00ff88"; ctx.shadowColor="#00ff88"; ctx.shadowBlur=10;
        ctx.beginPath(); ctx.arc(sx,sy,Math.max(2,4.5*sc),0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0;
      });

      // Enemy bullets
      s.eBullets.forEach(b => {
        const {sx,sy,sc} = proj(b.x, b.y, b.z);
        ctx.fillStyle="#ff4444"; ctx.shadowColor="#ff4444"; ctx.shadowBlur=8;
        ctx.beginPath(); ctx.arc(sx,sy,Math.max(2,3.5*sc),0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0;
      });

      // Player ship
      const {sx:psx} = proj(s.px, 0, 6.2);
      const pcy = H*0.87;
      ctx.fillStyle="#3584e4"; ctx.shadowColor="#3584e4"; ctx.shadowBlur=18;
      ctx.beginPath(); ctx.moveTo(psx,pcy-22); ctx.lineTo(psx-26,pcy+10); ctx.lineTo(psx+26,pcy+10); ctx.fill();
      ctx.fillStyle="#6fb0ff";
      ctx.beginPath(); ctx.moveTo(psx,pcy-12); ctx.lineTo(psx-11,pcy+6); ctx.lineTo(psx+11,pcy+6); ctx.fill();
      // Engine glow
      ctx.fillStyle="rgba(100,180,255,0.4)"; ctx.shadowColor="#3584e4"; ctx.shadowBlur=22;
      ctx.beginPath(); ctx.ellipse(psx,pcy+14,8,4,0,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0;

      // Hit flash
      if (s.hitFlash > 0) {
        ctx.fillStyle = `rgba(255,0,0,${(s.hitFlash/18)*0.35})`;
        ctx.fillRect(0,0,W,H);
      }

      // Ground line
      ctx.strokeStyle="rgba(53,132,228,0.25)"; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(0,H*0.91); ctx.lineTo(W,H*0.91); ctx.stroke();

      // HUD
      ctx.fillStyle="rgba(0,0,0,0.68)"; ctx.fillRect(0,H-38,W,38);
      ctx.textAlign="left"; ctx.font="bold 13px monospace";
      ctx.fillStyle="#ef4444";
      ctx.fillText(`❤️ ${"\u2665".repeat(s.lives)}`,12,H-14);
      ctx.textAlign="center"; ctx.fillStyle="#ffd700";
      ctx.fillText(`SCORE: ${s.score}`,W/2,H-14);
      ctx.textAlign="right"; ctx.fillStyle="#a855f7";
      ctx.fillText(`WAVE ${s.wave}  👾 ${s.invaders.filter(i=>i.alive).length}`,W-10,H-14);
      ctx.textAlign="left";
    };
    animId = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("keydown",onKD); window.removeEventListener("keyup",onKU); };
  }, []);

  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:12,padding:20,background:"#000610",height:"100%",justifyContent:"center" }}>
      <div style={{ display:"flex",justifyContent:"space-between",width:W,alignItems:"center" }}>
        <span style={{ color:"#a855f7",fontSize:"1.1rem",fontWeight:700,fontFamily:"monospace" }}>👾 SPACE INVADERS 3D</span>
        <button onClick={onExit} style={{ background:"rgba(255,255,255,0.1)",border:"none",color:"white",padding:"4px 12px",borderRadius:4,cursor:"pointer" }}>← Back</button>
      </div>
      <div style={{ position:"relative" }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ border:"2px solid rgba(168,85,247,0.4)",borderRadius:4,display:"block" }} />
        {gameState === "idle" && (
          <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.92)",gap:14,borderRadius:4 }}>
            <div style={{ color:"#a855f7",fontSize:"2.2rem",fontWeight:700,textShadow:"0 0 24px rgba(168,85,247,0.8)" }}>👾 SPACE INVADERS 3D</div>
            <div style={{ color:"#bbb",fontSize:"0.85rem",textAlign:"center",lineHeight:2,fontFamily:"monospace" }}>
              <b style={{color:"#00f5ff"}}>A/D or ←/→</b> — Move ship<br/>
              <b style={{color:"#00f5ff"}}>Space</b> — Fire laser<br/>
              Destroy all invaders before they reach you!
            </div>
            <button onClick={startGame} style={{ background:"#a855f7",color:"white",border:"none",padding:"12px 32px",borderRadius:6,fontSize:"1rem",fontWeight:700,cursor:"pointer",boxShadow:"0 0 20px rgba(168,85,247,0.5)" }}>DEFEND EARTH</button>
          </div>
        )}
        {gameState === "dead" && (
          <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.92)",gap:12,borderRadius:4 }}>
            <div style={{ color:"#ef4444",fontSize:"2rem",fontWeight:700 }}>EARTH INVADED!</div>
            <div style={{ color:"#aaa" }}>Score: {stateRef.current?.score || 0} • Wave {stateRef.current?.wave || 1}</div>
            <button onClick={startGame} style={{ background:"#a855f7",color:"white",border:"none",padding:"10px 28px",borderRadius:6,fontSize:"1rem",fontWeight:700,cursor:"pointer" }}>TRY AGAIN</button>
          </div>
        )}
      </div>
      <div style={{ color:"#444",fontSize:"0.72rem",fontFamily:"monospace" }}>A/D or ←/→ move • Space shoot • Survive all waves!</div>
    </div>
  );
}


// ─────────────────────────────────────────────
// STEAM APP SHELL
// ─────────────────────────────────────────────
const GAMES = [
  {
    id: "snake", title: "Snake Reloaded", genre: "Arcade", rating: 4.3, players: "1P",
    desc: "Classic snake game with glowing neon graphics. Eat food to grow longer. Don't hit the walls or yourself!",
    tags: ["Arcade", "Classic", "Casual"], size: "0.1 MB",
    color: "#22c55e", emoji: "🐍", component: SnakeGame,
  },
  {
    id: "tetris", title: "TetriX", genre: "Puzzle", rating: 4.7, players: "1P",
    desc: "The iconic block-stacking puzzle game. Clear lines, level up, and beat your high score!",
    tags: ["Puzzle", "Classic", "Strategy"], size: "0.1 MB",
    color: "#00f5ff", emoji: "🧱", component: TetrisGame,
  },
  {
    id: "flappy", title: "Flappy Space", genre: "Casual", rating: 4.1, players: "1P",
    desc: "Guide your bird through endless pipe obstacles in this addictive one-tap game. How far can you go?",
    tags: ["Casual", "Endless", "One-Tap"], size: "0.1 MB",
    color: "#ffe066", emoji: "🐦", component: FlappyGame,
  },
  {
    id: "breakout", title: "Brick Blaster", genre: "Arcade", rating: 4.5, players: "1P",
    desc: "Smash all the bricks with your ball and paddle! Power through 6 colorful rows in this timeless arcade classic.",
    tags: ["Arcade", "Classic", "Action"], size: "0.1 MB",
    color: "#f97316", emoji: "🏓", component: BreakoutGame,
  },
  {
    id: "fps", title: "Bot Blaster 3D", genre: "FPS", rating: 4.6, players: "1P vs Bots",
    desc: "Full 3D raycasting first-person shooter with pointer lock mouse aiming! Navigate a maze and eliminate 5 enemy bots.",
    tags: ["FPS", "3D", "Action", "Shooter"], size: "0.2 MB",
    color: "#ef4444", emoji: "🔫", component: FPSGame,
  },
  {
    id: "asteroid", title: "Asteroid Runner", genre: "Space", rating: 4.4, players: "1P",
    desc: "Pilot a sleek spacecraft through an endless asteroid field. Dodge rocks with your mouse, boost with Space, survive!",
    tags: ["3D", "Endless", "Space", "Action"], size: "0.2 MB",
    color: "#00f5ff", emoji: "🚀", component: AsteroidRunner,
  },
  {
    id: "dungeon", title: "Dungeon Crawler", genre: "RPG", rating: 4.5, players: "1P",
    desc: "Explore procedurally-generated dungeons across 5 themed floors! Fight enemies & epic bosses, find keys to unlock chests, discover secret rooms. WASD + mouse look.",
    tags: ["3D", "RPG", "Dungeon", "Action"], size: "0.2 MB",
    color: "#ffd700", emoji: "⚔️", component: DungeonCrawler,
  },
  {
    id: "racing", title: "Night Racer", genre: "Racing", rating: 4.4, players: "1P",
    desc: "Pseudo-3D night racing through a neon city! Dodge traffic, handle curves, and stay on the road as speed increases. A/D to steer.",
    tags: ["3D", "Racing", "Arcade", "Action"], size: "0.2 MB",
    color: "#ef4444", emoji: "🏎️", component: RacingGame,
  },
  {
    id: "invaders", title: "Space Invaders 3D", genre: "Shooter", rating: 4.6, players: "1P",
    desc: "Classic space invaders with full 3D perspective! Three types of alien enemies march closer each wave. Shoot them all before they reach you!",
    tags: ["3D", "Shooter", "Arcade", "Classic"], size: "0.2 MB",
    color: "#a855f7", emoji: "👾", component: SpaceInvaders3D,
  },
];

export default function SteamApp() {
  const [activeGame, setActiveGame] = useState(null);
  const [tab, setTab] = useState("store");
  const [library] = useState(["snake", "tetris", "flappy", "breakout", "fps", "asteroid", "dungeon", "racing", "invaders"]);
  const [hoveredGame, setHoveredGame] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);

  const GameComponent = activeGame ? GAMES.find(g => g.id === activeGame)?.component : null;

  if (GameComponent) {
    return <GameComponent onExit={() => setActiveGame(null)} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#1b2838", color: "white", fontFamily: "sans-serif", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(180deg, #171a21 0%, #1b2838 100%)", padding: "0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", padding: "12px 20px", gap: 20, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: "1.6rem" }}>🎮</div>
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#c7d5e0", letterSpacing: 2, textTransform: "uppercase" }}>STEAM</div>
              <div style={{ fontSize: "0.6rem", color: "#8f98a0", letterSpacing: 1 }}>GAME PLATFORM</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 2, marginLeft: 20 }}>
            {[{ id: "store", label: "STORE" }, { id: "library", label: "LIBRARY" }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: tab === t.id ? "rgba(102,192,244,0.15)" : "none",
                border: "none", color: tab === t.id ? "#66c0f4" : "#8f98a0",
                padding: "8px 16px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700,
                letterSpacing: 1, borderBottom: tab === t.id ? "2px solid #66c0f4" : "2px solid transparent",
              }}>{t.label}</button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ color: "#8f98a0", fontSize: "0.8rem" }}>user@debian</div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        {tab === "store" && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div style={{ width: selectedGame ? "42%" : "100%", overflowY: "auto", transition: "width 0.2s", borderRight: selectedGame ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <div style={{ padding: "20px 20px 12px", background: "linear-gradient(180deg,rgba(102,192,244,0.08) 0%,transparent 100%)" }}>
                <div style={{ fontSize: "0.75rem", color: "#8f98a0", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Featured & Recommended</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#c7d5e0" }}>{GAMES.length} Games Available</div>
              </div>
              <div style={{ padding: "0 12px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                {GAMES.map(game => (
                  <div
                    key={game.id}
                    onClick={() => setSelectedGame(selectedGame?.id === game.id ? null : game)}
                    onMouseEnter={() => setHoveredGame(game.id)}
                    onMouseLeave={() => setHoveredGame(null)}
                    style={{
                      background: selectedGame?.id === game.id ? "rgba(102,192,244,0.12)" : hoveredGame === game.id ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
                      border: selectedGame?.id === game.id ? "1px solid rgba(102,192,244,0.4)" : "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 6, padding: 12, cursor: "pointer", transition: "all 0.15s", display: "flex", gap: 14, alignItems: "center",
                    }}
                  >
                    <div style={{ width: 60, height: 60, borderRadius: 8, background: `linear-gradient(135deg, ${game.color}33, ${game.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", flexShrink: 0, border: `1px solid ${game.color}44` }}>
                      {game.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: "#c7d5e0", fontSize: "0.9rem" }}>{game.title}</div>
                      <div style={{ fontSize: "0.72rem", color: "#8f98a0", marginTop: 2 }}>{game.genre} • {game.players}</div>
                      <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
                        {game.tags.slice(0, 3).map(tag => (
                          <span key={tag} style={{ fontSize: "0.62rem", background: "rgba(255,255,255,0.07)", padding: "1px 5px", borderRadius: 3, color: "#8f98a0" }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ color: "#ffe066", fontSize: "0.78rem" }}>{"★".repeat(Math.round(game.rating))}{"☆".repeat(5 - Math.round(game.rating))}</div>
                      <div style={{ color: "#22c55e", fontSize: "0.75rem", marginTop: 4, fontWeight: 700 }}>FREE</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedGame && (
              <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ background: `linear-gradient(135deg, ${selectedGame.color}22, ${selectedGame.color}08, #1b2838)`, border: `1px solid ${selectedGame.color}33`, borderRadius: 10, padding: 22, display: "flex", gap: 18, alignItems: "center" }}>
                  <div style={{ fontSize: "3.5rem" }}>{selectedGame.emoji}</div>
                  <div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "white" }}>{selectedGame.title}</div>
                    <div style={{ color: "#8f98a0", marginTop: 4, fontSize: "0.82rem" }}>{selectedGame.genre} • {selectedGame.players}</div>
                    <div style={{ color: "#ffe066", marginTop: 5, fontSize: "0.85rem" }}>{"★".repeat(Math.round(selectedGame.rating))} {selectedGame.rating}/5.0</div>
                  </div>
                </div>
                <p style={{ color: "#c7d5e0", fontSize: "0.875rem", lineHeight: 1.65, margin: 0 }}>{selectedGame.desc}</p>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {selectedGame.tags.map(tag => (
                    <span key={tag} style={{ fontSize: "0.72rem", background: "rgba(102,192,244,0.1)", border: "1px solid rgba(102,192,244,0.2)", padding: "3px 9px", borderRadius: 4, color: "#66c0f4" }}>{tag}</span>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[["Genre", selectedGame.genre],["Players", selectedGame.players],["Size", selectedGame.size],["Rating", `${selectedGame.rating} / 5.0`]].map(([l,v]) => (
                    <div key={l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "9px 12px" }}>
                      <div style={{ fontSize: "0.62rem", color: "#8f98a0", textTransform: "uppercase", letterSpacing: 1 }}>{l}</div>
                      <div style={{ color: "#c7d5e0", marginTop: 3, fontSize: "0.875rem" }}>{v}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setActiveGame(selectedGame.id)}
                  style={{
                    background: `linear-gradient(180deg, ${selectedGame.color} 0%, ${selectedGame.color}bb 100%)`,
                    border: "none", color: selectedGame.color === "#ffe066" || selectedGame.color === "#ffd700" ? "#111" : "white",
                    padding: "14px 0", borderRadius: 6, fontSize: "1rem", fontWeight: 700,
                    cursor: "pointer", width: "100%", boxShadow: `0 4px 20px ${selectedGame.color}44`,
                  }}
                >▶ PLAY NOW</button>
              </div>
            )}
          </div>
        )}

        {tab === "library" && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: "0.75rem", color: "#8f98a0", letterSpacing: 2, textTransform: "uppercase" }}>Your Library</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#c7d5e0", marginTop: 4 }}>{library.length} Games</div>
            </div>
            <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12 }}>
              {GAMES.filter(g => library.includes(g.id)).map(game => (
                <div
                  key={game.id}
                  onClick={() => setActiveGame(game.id)}
                  style={{
                    background: `linear-gradient(160deg, ${game.color}22, ${game.color}08)`,
                    border: `1px solid ${game.color}33`,
                    borderRadius: 10, padding: 16, cursor: "pointer",
                    transition: "transform 0.15s, box-shadow 0.15s",
                    display: "flex", flexDirection: "column", gap: 8,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow=`0 8px 24px ${game.color}33`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}
                >
                  <div style={{ fontSize: "2.2rem", textAlign: "center" }}>{game.emoji}</div>
                  <div style={{ fontWeight: 700, color: "#c7d5e0", fontSize: "0.85rem", textAlign: "center" }}>{game.title}</div>
                  <div style={{ fontSize: "0.7rem", color: "#8f98a0", textAlign: "center" }}>{game.genre}</div>
                  <button
                    onClick={e => { e.stopPropagation(); setActiveGame(game.id); }}
                    style={{ background: game.color, border: "none", color: (game.color==="#ffe066"||game.color==="#ffd700") ? "#111" : "white", padding: "7px 0", borderRadius: 6, fontWeight: 700, cursor: "pointer", fontSize: "0.78rem" }}
                  >▶ PLAY</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
