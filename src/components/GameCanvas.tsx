import React, { useEffect, useRef } from 'react';
import { CharacterId, FallingItem, FloatingEffect, GameStats, Particle } from '../types/game';
import { CANVAS_VIRTUAL_HEIGHT, CANVAS_VIRTUAL_WIDTH, CHARACTERS, OBSTACLES, POLICIES } from '../utils/constants';

interface GameCanvasProps {
  stats: GameStats;
  selectedCharacter: CharacterId;
  playerX: number;
  isDashing: boolean;
  facing: 'left' | 'right';
  invincibleTimer: number;
  items: FallingItem[];
  particles: Particle[];
  effects: FloatingEffect[];
  isScreenShaking: boolean;
  onCanvasClick?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onTouchMove?: (e: React.TouchEvent<HTMLCanvasElement>) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  stats,
  selectedCharacter,
  playerX,
  isDashing,
  facing,
  invincibleTimer,
  items,
  particles,
  effects,
  isScreenShaking,
  onCanvasClick,
  onTouchMove,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const tickRef = useRef<number>(0);

  const charConfig = CHARACTERS[selectedCharacter];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isMounted = true;

    const render = () => {
      if (!isMounted) return;
      tickRef.current++;
      const tick = tickRef.current;

      ctx.save();
      ctx.clearRect(0, 0, CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT);

      // Screen shake translation
      if (isScreenShaking) {
        const shakeX = (Math.random() - 0.5) * 12;
        const shakeY = (Math.random() - 0.5) * 8;
        ctx.translate(shakeX, shakeY);
      }

      // 1. Background Sky & Scenery
      drawBackground(ctx, stats, tick);

      // 2. Falling Items
      items.forEach((item) => {
        drawFallingItem(ctx, item, tick);
      });

      // 3. Player Sprite
      const isBlinking = invincibleTimer > 0 && Math.floor(tick / 4) % 2 === 0;
      if (!isBlinking) {
        drawPlayer(ctx, selectedCharacter, playerX, facing, isDashing, tick);
      }

      // 4. Particles
      particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 5. Floating text / combo effects
      effects.forEach((eff) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, eff.opacity);
        ctx.fillStyle = eff.color;
        ctx.font = `bold ${eff.size}px 'DotGothic16', monospace, sans-serif`;
        ctx.textAlign = 'center';
        // Dark outline for arcade contrast
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.strokeText(eff.text, eff.x, eff.y);
        ctx.fillText(eff.text, eff.x, eff.y);
        ctx.restore();
      });

      // 6. Fever Mode Border overlay
      if (stats.isFever) {
        drawFeverOverlay(ctx, tick, stats.feverTimeLeft);
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isMounted = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    stats,
    selectedCharacter,
    playerX,
    isDashing,
    facing,
    invincibleTimer,
    items,
    particles,
    effects,
    isScreenShaking,
  ]);

  return (
    <div className="relative w-full max-w-[480px] aspect-[480/680] mx-auto rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-700 bg-slate-900 select-none">
      <canvas
        ref={canvasRef}
        width={CANVAS_VIRTUAL_WIDTH}
        height={CANVAS_VIRTUAL_HEIGHT}
        className="w-full h-full block cursor-pointer"
        onClick={onCanvasClick}
        onTouchMove={onTouchMove}
      />
      <div className="scanlines absolute inset-0 pointer-events-none" />
      <div className="crt-vignette absolute inset-0 pointer-events-none" />
    </div>
  );
};

// ----------------- Drawing Helpers -----------------

function drawBackground(ctx: CanvasRenderingContext2D, stats: GameStats, tick: number) {
  // Sky gradient changes based on Fever or time remaining
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_VIRTUAL_HEIGHT);
  if (stats.isFever) {
    grad.addColorStop(0, '#581c87'); // deep purple
    grad.addColorStop(0.5, '#c026d3'); // vibrant magenta
    grad.addColorStop(1, '#f59e0b'); // golden sunset glow
  } else if (stats.timeLeft <= 15) {
    grad.addColorStop(0, '#7f1d1d'); // urgent dusk red
    grad.addColorStop(0.6, '#ea580c'); // fiery orange
    grad.addColorStop(1, '#fde047'); // yellow horizon
  } else {
    grad.addColorStop(0, '#0284c7'); // civic sky blue
    grad.addColorStop(0.5, '#38bdf8'); // light sky
    grad.addColorStop(1, '#e0f2fe'); // bright horizon
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT);

  // Pixel clouds
  const cloud1X = ((tick * 0.4) % (CANVAS_VIRTUAL_WIDTH + 140)) - 100;
  const cloud2X = (((tick * 0.25) + 260) % (CANVAS_VIRTUAL_WIDTH + 160)) - 100;
  drawPixelCloud(ctx, cloud1X, 45, 1.2);
  drawPixelCloud(ctx, cloud2X, 90, 0.9);

  // Background distant city silhouette
  ctx.fillStyle = stats.isFever ? 'rgba(76, 29, 149, 0.4)' : 'rgba(125, 211, 252, 0.45)';
  const bldgWidths = [40, 55, 35, 60, 45, 50, 70, 40, 50];
  const bldgHeights = [140, 180, 110, 210, 160, 130, 190, 150, 170];
  let curX = 0;
  bldgWidths.forEach((w, i) => {
    const h = bldgHeights[i];
    ctx.fillRect(curX, CANVAS_VIRTUAL_HEIGHT - 120 - h, w, h);
    // Rooftop antenna with blinking beacon on tallest
    if (i === 3) {
      ctx.fillRect(curX + w / 2 - 2, CANVAS_VIRTUAL_HEIGHT - 120 - h - 25, 4, 25);
      if (Math.floor(tick / 20) % 2 === 0) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(curX + w / 2, CANVAS_VIRTUAL_HEIGHT - 120 - h - 25, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = stats.isFever ? 'rgba(76, 29, 149, 0.4)' : 'rgba(125, 211, 252, 0.45)';
      }
    }
    curX += w + 6;
  });

  // Midground vibrant town buildings
  ctx.fillStyle = stats.isFever ? '#3b0764' : '#0369a1';
  curX = -10;
  const midHeights = [90, 120, 80, 130, 95, 110, 140, 85];
  midHeights.forEach((h, i) => {
    const w = 55;
    ctx.fillRect(curX, CANVAS_VIRTUAL_HEIGHT - 110 - h, w, h);
    // Glowing windows
    ctx.fillStyle = stats.isFever || stats.timeLeft <= 15 ? '#fde047' : '#bae6fd';
    for (let wy = CANVAS_VIRTUAL_HEIGHT - 110 - h + 15; wy < CANVAS_VIRTUAL_HEIGHT - 125; wy += 20) {
      for (let wx = curX + 8; wx < curX + w - 12; wx += 14) {
        if ((wx + wy + i * 7) % 3 !== 0) {
          ctx.fillRect(wx, wy, 8, 10);
        }
      }
    }
    ctx.fillStyle = stats.isFever ? '#3b0764' : '#0369a1';
    curX += w + 10;
  });

  // Street Trees and Greenery
  for (let tx = 20; tx < CANVAS_VIRTUAL_WIDTH; tx += 95) {
    // Trunk
    ctx.fillStyle = '#78350f';
    ctx.fillRect(tx + 6, CANVAS_VIRTUAL_HEIGHT - 118, 8, 20);
    // Leaves
    ctx.fillStyle = stats.isFever ? '#10b981' : '#15803d';
    ctx.beginPath();
    ctx.arc(tx + 10, CANVAS_VIRTUAL_HEIGHT - 124, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = stats.isFever ? '#34d399' : '#22c55e';
    ctx.beginPath();
    ctx.arc(tx + 10, CANVAS_VIRTUAL_HEIGHT - 128, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sidewalk & Ground
  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, CANVAS_VIRTUAL_HEIGHT - 100, CANVAS_VIRTUAL_WIDTH, 18);
  // Curb bricks
  ctx.fillStyle = '#94a3b8';
  for (let bx = 0; bx < CANVAS_VIRTUAL_WIDTH; bx += 24) {
    ctx.fillRect(bx, CANVAS_VIRTUAL_HEIGHT - 100, 22, 5);
  }

  // Road Asphalt
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, CANVAS_VIRTUAL_HEIGHT - 82, CANVAS_VIRTUAL_WIDTH, 82);

  // Road dashed lines
  ctx.fillStyle = '#f8fafc';
  const roadDashOffset = (tick * 2) % 36;
  for (let rx = -40; rx < CANVAS_VIRTUAL_WIDTH + 40; rx += 36) {
    ctx.fillRect(rx - roadDashOffset, CANVAS_VIRTUAL_HEIGHT - 42, 20, 4);
  }
}

function drawPixelCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  // Pixel puffy cloud
  ctx.fillRect(0, 10, 50, 15);
  ctx.fillRect(8, 4, 34, 20);
  ctx.fillRect(16, 0, 18, 26);
  ctx.restore();
}

function drawFallingItem(ctx: CanvasRenderingContext2D, item: FallingItem, tick: number) {
  const wobble = Math.sin(tick * item.wobbleSpeed + item.wobbleOffset) * 4;
  const cx = item.x + wobble;
  const cy = item.y;

  ctx.save();
  ctx.translate(cx, cy);

  if (item.type.kind === 'policy') {
    const pol = POLICIES[item.type.category];
    // Retro policy card
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = pol.color;
    ctx.lineWidth = 3;
    // Card background
    ctx.beginPath();
    ctx.roundRect(-item.width / 2, -item.height / 2, item.width, item.height, 8);
    ctx.fill();
    ctx.stroke();

    // Top banner color strip
    ctx.fillStyle = pol.color;
    ctx.beginPath();
    ctx.roundRect(-item.width / 2, -item.height / 2, item.width, 14, [8, 8, 0, 0]);
    ctx.fill();

    // Icon emoji
    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pol.icon, 0, 2);

    // Label tag
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 10px "DotGothic16", monospace';
    ctx.fillText(pol.shortName, 0, item.height / 2 - 7);
  } else if (item.type.kind === 'voice') {
    // Citizen Voice Speech Bubble
    const bubbleW = item.width;
    const bubbleH = item.height;

    // Glowing aura
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;

    // Bubble body
    ctx.fillStyle = '#fef08a'; // energetic warm yellow speech bubble
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.roundRect(-bubbleW / 2, -bubbleH / 2, bubbleW, bubbleH - 8, 10);
    ctx.fill();
    ctx.stroke();

    // Bubble pointer down
    ctx.beginPath();
    ctx.moveTo(-4, bubbleH / 2 - 8);
    ctx.lineTo(0, bubbleH / 2);
    ctx.lineTo(8, bubbleH / 2 - 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Voice text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 10px "DotGothic16", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`📢 ${item.type.text}`, 0, -4);
  } else if (item.type.kind === 'obstacle') {
    const obs = OBSTACLES[item.type.obstacleType];
    // Warning pulse
    const pulse = Math.sin(tick * 0.2) * 2;
    const w = item.width + pulse * 2;
    const h = item.height + pulse * 2;

    // Menacing dark red / crimson hazard aura
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;

    // Pitch black card background
    ctx.fillStyle = '#09090b';
    ctx.strokeStyle = obs.color || '#ef4444';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 8);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Top danger "− MINUS" banner
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect(-w / 2 + 4, -h / 2 + 3, w - 8, 9, 3);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7px "DotGothic16", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('− MINUS −', 0, -h / 2 + 7.5);

    // Hazard icon
    ctx.font = '20px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(obs.icon, 0, 2);

    // Obstacle name in bright warning red
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 9px "DotGothic16", monospace';
    ctx.fillText(obs.name, 0, h / 2 - 7);
  } else if (item.type.kind === 'fever_star') {
    // Golden Star during fever
    const rot = tick * 0.08;
    ctx.rotate(rot);

    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 14;

    ctx.fillStyle = '#fde047';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;

    // 8-point star
    ctx.beginPath();
    const spikes = 8;
    const outerR = 18;
    const innerR = 9;
    for (let s = 0; s < spikes * 2; s++) {
      const r = s % 2 === 0 ? outerR : innerR;
      const angle = (s * Math.PI) / spikes;
      const sx = Math.cos(angle) * r;
      const sy = Math.sin(angle) * r;
      if (s === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  charId: CharacterId,
  x: number,
  facing: 'left' | 'right',
  isDashing: boolean,
  tick: number,
) {
  const y = CANVAS_VIRTUAL_HEIGHT - 100;
  ctx.save();
  ctx.translate(x, y);

  if (facing === 'left') {
    ctx.scale(-1, 1);
  }

  // Dash ghost / speed trails
  if (isDashing) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-28, -50, 18, 48);
    ctx.fillRect(-40, -42, 12, 38);
    ctx.restore();
  }

  if (charId === 'kenta_leader') {
    drawLeaderSprite(ctx, isDashing, tick);
  } else if (charId === 'kenta_car') {
    drawCarSprite(ctx, isDashing, tick);
  } else {
    drawBikeSprite(ctx, isDashing, tick);
  }

  ctx.restore();
}

function drawLeaderSprite(ctx: CanvasRenderingContext2D, isDashing: boolean, tick: number) {
  const walkPhase = Math.sin(tick * (isDashing ? 0.4 : 0.22));
  const legOffset = walkPhase * 8;

  // Shadow on ground
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shoes
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-12 + legOffset, -6, 10, 7);
  ctx.fillRect(4 - legOffset, -6, 10, 7);

  // Trousers (Navy)
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(-11 + legOffset * 0.5, -20, 8, 15);
  ctx.fillRect(4 - legOffset * 0.5, -20, 8, 15);

  // Suit Jacket (Civic Blue)
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(-14, -44, 28, 25);

  // White Dress Shirt Collar
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-5, -44);
  ctx.lineTo(0, -33);
  ctx.lineTo(5, -44);
  ctx.closePath();
  ctx.fill();

  // Tie (Energetic Red / Orange)
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(-2, -42, 4, 12);

  // Civic Sash: "現場第一" (Gold-bordered white sash)
  ctx.save();
  ctx.fillStyle = '#fef08a';
  ctx.rotate(0.2);
  ctx.fillRect(-7, -42, 6, 26);
  ctx.restore();

  // Policy Catching Briefcase / Policy Box in front hand
  ctx.fillStyle = '#d97706';
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.5;
  ctx.fillRect(12, -34, 18, 15);
  ctx.strokeRect(12, -34, 18, 15);
  // Golden handle
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.strokeRect(17, -38, 8, 4);

  // Megaphone badge on briefcase
  ctx.fillStyle = '#ffffff';
  ctx.font = '10px serif';
  ctx.fillText('📣', 15, -22);

  // Head / Face
  ctx.fillStyle = '#fed7aa'; // skin
  ctx.beginPath();
  ctx.arc(0, -52, 13, 0, Math.PI * 2);
  ctx.fill();

  // Hair (neat dark styled hair)
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(0, -56, 13, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-13, -56, 26, 6);
  ctx.fillRect(4, -58, 8, 8); // friendly fringe

  // Friendly eyes & energetic smile
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(3, -54, 3, 4);
  ctx.fillRect(8, -54, 3, 4);
  // Warm smile
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(6, -50, 4, 0, Math.PI);
  ctx.stroke();

  // Rosy cheeks
  ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
  ctx.beginPath();
  ctx.arc(3, -48, 2.5, 0, Math.PI * 2);
  ctx.arc(10, -48, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawCarSprite(ctx: CanvasRenderingContext2D, isDashing: boolean, tick: number) {
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 32, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wheels
  const wheelRot = tick * (isDashing ? 0.5 : 0.25);
  [-18, 18].forEach((wx) => {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(wx, -8, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(wx, -8, 5, 0, Math.PI * 2);
    ctx.fill();
    // Spoke mark
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(wx + Math.cos(wheelRot) * 4, -8 + Math.sin(wheelRot) * 4);
    ctx.lineTo(wx - Math.cos(wheelRot) * 4, -8 - Math.sin(wheelRot) * 4);
    ctx.stroke();
  });

  // Car Body (Clean Green EV)
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.roundRect(-30, -28, 60, 20, 6);
  ctx.fill();

  // Cabin & Windshield
  ctx.fillStyle = '#059669';
  ctx.beginPath();
  ctx.roundRect(-18, -42, 38, 16, 5);
  ctx.fill();

  // Glass
  ctx.fillStyle = '#bae6fd';
  ctx.fillRect(-14, -39, 14, 12);
  ctx.fillRect(4, -39, 13, 12);

  // Driver silhouette
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(8, -34, 4, 0, Math.PI * 2);
  ctx.fill();

  // Rooftop Electronic Sign: "地域の声"
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-12, -52, 30, 10);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 8px "DotGothic16", monospace';
  ctx.fillText('声キャッチ', -10, -44);

  // Headlight beam
  ctx.fillStyle = 'rgba(253, 224, 71, 0.4)';
  ctx.beginPath();
  ctx.moveTo(30, -20);
  ctx.lineTo(55, -26);
  ctx.lineTo(55, -14);
  ctx.closePath();
  ctx.fill();
}

function drawBikeSprite(ctx: CanvasRenderingContext2D, isDashing: boolean, tick: number) {
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 25, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bike Wheels
  [-16, 16].forEach((wx) => {
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(wx, -10, 10, 0, Math.PI * 2);
    ctx.stroke();
    // Inner hub
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(wx, -10, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Bike Frame (Orange/Amber)
  ctx.strokeStyle = '#ea580c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-16, -10);
  ctx.lineTo(0, -12);
  ctx.lineTo(12, -26);
  ctx.lineTo(16, -10);
  ctx.stroke();

  // Front Basket with Policy Documents
  ctx.fillStyle = '#78350f';
  ctx.fillRect(15, -28, 12, 10);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(17, -33, 8, 8); // white papers
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(19, -35, 7, 7); // blue papers

  // Cyclist Kenta
  const pedalPhase = tick * (isDashing ? 0.35 : 0.2);
  const kneeY = -22 + Math.sin(pedalPhase) * 4;

  // Legs & Pedals
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-4, -30);
  ctx.lineTo(2, kneeY);
  ctx.lineTo(0, -12 + Math.cos(pedalPhase) * 6);
  ctx.stroke();

  // Torso
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(-10, -42, 16, 16);

  // Arms to handlebars
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-2, -38);
  ctx.lineTo(12, -26);
  ctx.stroke();

  // Head with Eco Helmet
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(0, -48, 8, 0, Math.PI * 2);
  ctx.fill();

  // Helmet (White & Blue)
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.arc(0, -50, 9, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-9, -51, 18, 3);
}

function drawFeverOverlay(ctx: CanvasRenderingContext2D, tick: number, timeLeft: number) {
  // Pulsing rainbow border
  const hue = (tick * 4) % 360;
  ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, CANVAS_VIRTUAL_WIDTH - 8, CANVAS_VIRTUAL_HEIGHT - 8);

  // Top Fever Banner
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.beginPath();
  ctx.roundRect(40, 16, CANVAS_VIRTUAL_WIDTH - 80, 36, 18);
  ctx.fill();
  ctx.strokeStyle = `hsl(${(hue + 60) % 360}, 100%, 60%)`;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Banner Text
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 16px "DotGothic16", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`⚡ 政策実現 FEVER! ⚡ (${Math.ceil(timeLeft)}s)`, CANVAS_VIRTUAL_WIDTH / 2, 34);
}
