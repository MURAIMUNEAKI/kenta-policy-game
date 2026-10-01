import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CharacterId, FallingItem, FloatingEffect, GameState, GameStats, Particle, PolicyCategory, TownRank, TownReport } from './types/game';
import { CANVAS_VIRTUAL_HEIGHT, CANVAS_VIRTUAL_WIDTH, CHARACTERS, CITIZEN_VOICES, FEVER_DURATION, INITIAL_TIME_LIMIT, OBSTACLES, POLICIES } from './utils/constants';
import { sounds } from './utils/audio';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { TouchControls } from './components/TouchControls';
import { CharacterSelect } from './components/CharacterSelect';
import { ReportModal } from './components/ReportModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { Trophy, HelpCircle, RotateCcw, Volume2, VolumeX, Music } from 'lucide-react';

const createInitialStats = (): GameStats => ({
  score: 0,
  combo: 0,
  maxCombo: 0,
  hearts: 3,
  maxHearts: 3,
  timeLeft: INITIAL_TIME_LIMIT,
  feverGauge: 0,
  isFever: false,
  feverTimeLeft: 0,
  collectedPolicies: {
    child_care: 0,
    disaster_prep: 0,
    digital_dx: 0,
    local_economy: 0,
    healthcare: 0,
    green_energy: 0,
  },
  voicesHeard: 0,
  obstaclesAvoided: 0,
  obstaclesHit: 0,
});

export default function App() {
  const [gameState, setGameState] = useState<GameState>('CHAR_SELECT');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>('kenta_leader');
  const [customTownName, setCustomTownName] = useState<string>('');
  const [stats, setStats] = useState<GameStats>(createInitialStats());
  const [isPaused, setIsPaused] = useState(false);
  const [isBgmActive, setIsBgmActive] = useState(true);
  const [highScore, setHighScore] = useState<number>(0);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // Gemini Report state
  const [report, setReport] = useState<TownReport | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [isFallbackReport, setIsFallbackReport] = useState(false);

  // Canvas visual entities
  const [playerX, setPlayerX] = useState<number>(CANVAS_VIRTUAL_WIDTH / 2);
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [isDashing, setIsDashing] = useState<boolean>(false);
  const [invincibleTimer, setInvincibleTimer] = useState<number>(0);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [effects, setEffects] = useState<FloatingEffect[]>([]);
  const [isScreenShaking, setIsScreenShaking] = useState<boolean>(false);

  // Refs for smooth 60fps game loop
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const touchMovement = useRef<'left' | 'right' | null>(null);
  const touchDashing = useRef<boolean>(false);
  const nextItemId = useRef<number>(1);
  const spawnTimer = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const statsRef = useRef<GameStats>(createInitialStats());
  const playerXRef = useRef<number>(CANVAS_VIRTUAL_WIDTH / 2);
  const itemsRef = useRef<FallingItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const effectsRef = useRef<FloatingEffect[]>([]);
  const gameStateRef = useRef<GameState>('CHAR_SELECT');
  const isPausedRef = useRef<boolean>(false);

  // Sync refs
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Synchronize BGM track with current gameState and pause state
  useEffect(() => {
    if (!isBgmActive) {
      sounds.stopBGM();
      return;
    }

    if (gameState === 'CHAR_SELECT') {
      sounds.startBGM('title');
    } else if (gameState === 'PLAYING') {
      if (!isPaused) {
        sounds.startBGM('game');
      } else {
        sounds.stopBGM();
      }
    } else if (gameState === 'REPORT') {
      sounds.stopBGM();
    }
  }, [gameState, isBgmActive, isPaused]);

  // Modern browsers require a user gesture before Web Audio can output sound.
  // Listen for the first touch/click/key interaction to resume AudioContext and start Title BGM.
  useEffect(() => {
    const handleFirstGesture = () => {
      sounds.resumeContext();
      if (isBgmActive) {
        if (gameStateRef.current === 'CHAR_SELECT') {
          sounds.startBGM('title');
        } else if (gameStateRef.current === 'PLAYING' && !isPausedRef.current) {
          sounds.startBGM('game');
        }
      }
    };

    window.addEventListener('pointerdown', handleFirstGesture, { passive: true });
    window.addEventListener('keydown', handleFirstGesture, { passive: true });
    window.addEventListener('touchstart', handleFirstGesture, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, [isBgmActive]);

  // Load high score from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kenta_policy_high_score');
      if (saved) setHighScore(parseInt(saved, 10));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Keyboard input handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'Space', 'ShiftLeft', 'ShiftRight', 'KeyA', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }
      keysPressed.current[e.code] = true;
      if (e.code === 'KeyP' && gameStateRef.current === 'PLAYING') {
        setIsPaused((p) => !p);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // End Game & Trigger Gemini Report Generation
  const finishGame = useCallback(async (finalStats: GameStats) => {
    setGameState('REPORT');
    setIsReportLoading(true);
    sounds.stopBGM();

    // Save high score
    if (finalStats.score > highScore) {
      setHighScore(finalStats.score);
      try {
        localStorage.setItem('kenta_policy_high_score', finalStats.score.toString());
      } catch (e) {
        console.error(e);
      }
    }

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: finalStats.score,
          collectedPolicies: finalStats.collectedPolicies,
          voicesHeard: finalStats.voicesHeard,
          obstaclesAvoided: finalStats.obstaclesAvoided,
          obstaclesHit: finalStats.obstaclesHit,
          heartsLeft: finalStats.hearts,
          maxCombo: finalStats.maxCombo,
          townName: customTownName,
          character: CHARACTERS[selectedCharacter].name,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setReport(data.report);
      setIsFallbackReport(Boolean(data.isFallback));
    } catch (err) {
      console.error('Failed to generate report from API:', err);
      // Strict fallback rank calculator
      const polEntries = Object.entries(finalStats.collectedPolicies).sort((a, b) => b[1] - a[1]);
      const top1 = POLICIES[polEntries[0][0] as PolicyCategory]?.name || '政策';

      let clientRank: TownRank = 'B';
      if (finalStats.hearts <= 0) clientRank = 'D';
      else if (finalStats.score >= 6000 && finalStats.obstaclesHit <= 1 && finalStats.maxCombo >= 20) clientRank = 'SSS';
      else if (finalStats.score >= 4800 && finalStats.obstaclesHit <= 3 && finalStats.maxCombo >= 15) clientRank = 'SS';
      else if (finalStats.score >= 3600 && finalStats.obstaclesHit <= 5) clientRank = 'S';
      else if (finalStats.score >= 2600) clientRank = 'A';
      else if (finalStats.score >= 1700) clientRank = 'B';
      else if (finalStats.score >= 900) clientRank = 'C';
      else clientRank = 'D';

      setReport({
        townTitle: customTownName || `${top1}が咲き誇る共生スマートタウン`,
        catchphrase: 'みんなの声がカタチになる！希望あふれる未来都市',
        overallRank: clientRank,
        summary: `市民の声を丁寧につかみ、${top1}を軸とした先進的なまちづくりが前進！笑顔あふれる住みよい街が誕生しました。`,
        headlineNews: [
          `【号外】${top1}の満足度が急上昇！市民満足度95%突破`,
          `現場の声${finalStats.voicesHeard}件を即座に政策へ反映！スピード対応に高評価`,
          `未来の持続可能なまちづくり計画が承認`,
        ],
        citizenVoices: [
          { resident: '子育て中の保護者', quote: '声がまっすぐ届いて安心感が段違いです！' },
          { resident: '商店街振興会長', quote: '街に明るい活気が戻ってきました！' },
          { resident: '地域のシニア住民', quote: '温かい見守りと安心の基盤が整いました。' },
        ],
        synergyEffect: '集まった政策と市民の声が連動し、地域の課題を素早く解決する好循環が生まれています。',
        kentaComment: '皆さんの温かい声こそがまちづくりの一番の原動力です！これからも全力で走ります！',
      });
      setIsFallbackReport(true);
    } finally {
      setIsReportLoading(false);
    }
  }, [customTownName, highScore, selectedCharacter]);

  // Main 60FPS Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      // Schedule next frame right away so loop never halts across restarts or state changes
      animId = requestAnimationFrame(loop);

      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      if (gameStateRef.current === 'PLAYING' && !isPausedRef.current) {
        frameCount.current++;
        const currentStats = { ...statsRef.current };
        const charConfig = CHARACTERS[selectedCharacter];

        // 1. Time countdown (60s)
        currentStats.timeLeft -= dt;
        if (currentStats.timeLeft <= 0) {
          currentStats.timeLeft = 0;
          setStats(currentStats);
          statsRef.current = currentStats;
          gameStateRef.current = 'REPORT';
          finishGame(currentStats);
          return;
        }

        // 2. Fever countdown
        if (currentStats.isFever) {
          currentStats.feverTimeLeft -= dt;
          if (currentStats.feverTimeLeft <= 0) {
            currentStats.isFever = false;
            currentStats.feverTimeLeft = 0;
            currentStats.feverGauge = 0;
          } else {
            currentStats.feverGauge = (currentStats.feverTimeLeft / FEVER_DURATION) * 100;
          }
        }

        // 3. Player Movement & Dashing
        const movingLeft = keysPressed.current['ArrowLeft'] || keysPressed.current['KeyA'] || touchMovement.current === 'left';
        const movingRight = keysPressed.current['ArrowRight'] || keysPressed.current['KeyD'] || touchMovement.current === 'right';
        const dashing = keysPressed.current['ShiftLeft'] || keysPressed.current['ShiftRight'] || keysPressed.current['Space'] || touchDashing.current;

        setIsDashing(dashing);
        const speed = (dashing ? charConfig.dashSpeed : charConfig.speed) * (dt * 60);

        let newX = playerXRef.current;
        if (movingLeft) {
          newX -= speed;
          setFacing('left');
        }
        if (movingRight) {
          newX += speed;
          setFacing('right');
        }

        // Clamp to virtual canvas bounds
        const halfW = charConfig.width / 2;
        newX = Math.max(halfW + 8, Math.min(CANVAS_VIRTUAL_WIDTH - halfW - 8, newX));
        playerXRef.current = newX;
        setPlayerX(newX);

        // Invincibility countdown
        setInvincibleTimer((t) => Math.max(0, t - 1));

        // 4. Item Spawning
        spawnTimer.current++;
        const spawnInterval = currentStats.isFever ? 20 : (currentStats.timeLeft < 25 ? 28 : 36);

        if (spawnTimer.current >= spawnInterval) {
          spawnTimer.current = 0;

          // Determine item type
          let itemType: FallingItem['type'];
          const rand = Math.random();

          if (currentStats.isFever) {
            // In fever mode: golden stars & policies, with 12% obstacles to keep players alert!
            if (rand < 0.38) {
              itemType = { kind: 'fever_star' };
            } else if (rand < 0.70) {
              const polCategories = Object.keys(POLICIES) as PolicyCategory[];
              const chosen = polCategories[Math.floor(Math.random() * polCategories.length)];
              itemType = { kind: 'policy', category: chosen };
            } else if (rand < 0.88) {
              const chosenVoice = CITIZEN_VOICES[Math.floor(Math.random() * CITIZEN_VOICES.length)];
              itemType = { kind: 'voice', text: chosenVoice.text, category: chosenVoice.category };
            } else {
              const obsTypes: ('waste_cost' | 'neglect_task' | 'fake_rumor')[] = ['waste_cost', 'neglect_task', 'fake_rumor'];
              const chosenObs = obsTypes[Math.floor(Math.random() * obsTypes.length)];
              itemType = { kind: 'obstacle', obstacleType: chosenObs };
            }
          } else {
            // Normal mode: high obstacle proportion (38% ~ 42% when timeLeft < 25)
            const obstacleRatio = currentStats.timeLeft < 25 ? 0.42 : 0.38;
            const remainingRatio = 1 - obstacleRatio;
            const policyCutoff = remainingRatio * 0.52; // ~31-32%

            if (rand < policyCutoff) {
              const polCategories = Object.keys(POLICIES) as PolicyCategory[];
              const chosen = polCategories[Math.floor(Math.random() * polCategories.length)];
              itemType = { kind: 'policy', category: chosen };
            } else if (rand < remainingRatio) {
              const chosenVoice = CITIZEN_VOICES[Math.floor(Math.random() * CITIZEN_VOICES.length)];
              itemType = { kind: 'voice', text: chosenVoice.text, category: chosenVoice.category };
            } else {
              const obsTypes: ('waste_cost' | 'neglect_task' | 'fake_rumor')[] = ['waste_cost', 'neglect_task', 'fake_rumor'];
              const chosenObs = obsTypes[Math.floor(Math.random() * obsTypes.length)];
              itemType = { kind: 'obstacle', obstacleType: chosenObs };
            }
          }

          // Item dimension & speed
          let w = 44;
          let h = 48;
          let baseSpeed = 2.4 + Math.random() * 1.6;
          if (itemType.kind === 'voice') {
            w = 120;
            h = 32;
            baseSpeed = 2.2 + Math.random() * 1.4;
          } else if (itemType.kind === 'fever_star') {
            w = 36;
            h = 36;
            baseSpeed = 3.2 + Math.random() * 1.8;
          } else if (itemType.kind === 'obstacle') {
            w = 46;
            h = 50;
            // Obstacles fall faster and with high variation to create real challenge
            baseSpeed = 2.8 + Math.random() * 2.2;
          }

          const newItem: FallingItem = {
            id: nextItemId.current++,
            x: Math.floor(w / 2 + 10 + Math.random() * (CANVAS_VIRTUAL_WIDTH - w - 20)),
            y: -35,
            speed: baseSpeed,
            vy: baseSpeed,
            width: w,
            height: h,
            type: itemType,
            wobbleOffset: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.05 + Math.random() * 0.05,
          };

          itemsRef.current.push(newItem);
        }

        // 5. Update Falling Items & Collision Detection
        const currentItems = [...itemsRef.current];
        const survivingItems: FallingItem[] = [];
        const playerY = CANVAS_VIRTUAL_HEIGHT - 100;
        const playerHitbox = {
          left: newX - (charConfig.width * (selectedCharacter === 'kenta_car' ? 0.65 : 0.5)),
          right: newX + (charConfig.width * (selectedCharacter === 'kenta_car' ? 0.65 : 0.5)),
          top: playerY - charConfig.height,
          bottom: playerY + 5,
        };

        for (const item of currentItems) {
          item.y += item.speed * (dt * 60);

          // Check collision with player
          const itemLeft = item.x - item.width / 2;
          const itemRight = item.x + item.width / 2;
          const itemTop = item.y - item.height / 2;
          const itemBottom = item.y + item.height / 2;

          const isColliding =
            itemRight >= playerHitbox.left &&
            itemLeft <= playerHitbox.right &&
            itemBottom >= playerHitbox.top &&
            itemTop <= playerHitbox.bottom;

          if (isColliding) {
            // Handle catch based on kind
            if (item.type.kind === 'policy') {
              const cat = item.type.category;
              const pol = POLICIES[cat];
              let pts = pol.points;
              if (currentStats.isFever) pts *= 2;
              pts += currentStats.combo * 10;

              currentStats.score += pts;
              currentStats.collectedPolicies[cat] = (currentStats.collectedPolicies[cat] || 0) + 1;
              currentStats.combo += 1;
              currentStats.maxCombo = Math.max(currentStats.maxCombo, currentStats.combo);

              // Fever gauge increase
              const gaugeInc = selectedCharacter === 'kenta_bike' ? 12 : 8;
              currentStats.feverGauge = Math.min(100, currentStats.feverGauge + gaugeInc);
              if (currentStats.feverGauge >= 100 && !currentStats.isFever) {
                currentStats.isFever = true;
                currentStats.feverTimeLeft = FEVER_DURATION;
                sounds.playFeverStart();
              } else {
                sounds.playPolicyCatch();
              }

              // Visual floating effect & particles
              spawnFloatingEffect(`+${pts} ${pol.shortName}!`, item.x, item.y, pol.color, 14);
              spawnParticles(item.x, item.y, pol.color, 8);
            } else if (item.type.kind === 'voice') {
              let pts = 120;
              // Kenta Leader bonus: +30% score for citizen voices
              if (selectedCharacter === 'kenta_leader') pts = Math.floor(pts * 1.3);
              if (currentStats.isFever) pts *= 2;
              pts += currentStats.combo * 15;

              currentStats.score += pts;
              currentStats.voicesHeard += 1;
              currentStats.combo += 1;
              currentStats.maxCombo = Math.max(currentStats.maxCombo, currentStats.combo);

              // Fever gauge jumps on voice catch!
              const gaugeInc = selectedCharacter === 'kenta_bike' ? 24 : 16;
              currentStats.feverGauge = Math.min(100, currentStats.feverGauge + gaugeInc);
              if (currentStats.feverGauge >= 100 && !currentStats.isFever) {
                currentStats.isFever = true;
                currentStats.feverTimeLeft = FEVER_DURATION;
                sounds.playFeverStart();
              } else {
                sounds.playVoiceCatch();
              }

              spawnFloatingEffect(`+${pts} 地域の声GET!`, item.x, item.y, '#f59e0b', 14);
              spawnParticles(item.x, item.y, '#38bdf8', 10);
            } else if (item.type.kind === 'fever_star') {
              const pts = 300;
              currentStats.score += pts;
              currentStats.combo += 1;
              currentStats.maxCombo = Math.max(currentStats.maxCombo, currentStats.combo);
              sounds.playFeverStar();

              spawnFloatingEffect(`+${pts} FEVER STAR!`, item.x, item.y, '#fbbf24', 16);
              spawnParticles(item.x, item.y, '#fde047', 12);
            } else if (item.type.kind === 'obstacle') {
              // Obstacle hit: stronger penalty (-150 pts, combo reset, heart loss)
              currentStats.obstaclesHit += 1;
              currentStats.hearts -= 1;
              currentStats.combo = 0;
              currentStats.score = Math.max(0, currentStats.score - 150);

              sounds.playObstacleHit();
              setInvincibleTimer(50);
              triggerScreenShake();

              spawnFloatingEffect('-150 課題衝突!', item.x, item.y, '#ef4444', 16);
              spawnParticles(item.x, item.y, '#ef4444', 14);

              if (currentStats.hearts <= 0) {
                currentStats.hearts = 0;
                setStats(currentStats);
                statsRef.current = currentStats;
                gameStateRef.current = 'REPORT';
                finishGame(currentStats);
                return;
              }
            }
          } else if (item.y > CANVAS_VIRTUAL_HEIGHT + 30) {
            // Item fell off screen
            if (item.type.kind === 'obstacle') {
              currentStats.obstaclesAvoided += 1;
            }
          } else {
            survivingItems.push(item);
          }
        }

        itemsRef.current = survivingItems;
        setItems(survivingItems);
        setStats(currentStats);

        // 6. Update Particles
        const currentParticles = [...particlesRef.current];
        const survivingParticles: Particle[] = [];
        for (const p of currentParticles) {
          p.x += p.vx;
          p.y += p.vy;
          p.opacity -= 0.025;
          p.life -= 1;
          if (p.opacity > 0 && p.life > 0) {
            survivingParticles.push(p);
          }
        }
        particlesRef.current = survivingParticles;
        setParticles(survivingParticles);

        // 7. Update Floating Effects
        const currentEffects = [...effectsRef.current];
        const survivingEffects: FloatingEffect[] = [];
        for (const eff of currentEffects) {
          eff.y += eff.vy;
          eff.opacity -= 0.02;
          eff.life -= 1;
          if (eff.opacity > 0 && eff.life > 0) {
            survivingEffects.push(eff);
          }
        }
        effectsRef.current = survivingEffects;
        setEffects(survivingEffects);
      }
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [finishGame, selectedCharacter]);

  // Visual Effect Spawners
  const spawnFloatingEffect = (text: string, x: number, y: number, color: string, size = 14) => {
    effectsRef.current.push({
      id: Math.random(),
      x,
      y,
      text,
      color,
      size,
      opacity: 1,
      vy: -1.8,
      life: 45,
    });
  };

  const spawnParticles = (x: number, y: number, color: string, count = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 1.5 + Math.random() * 3.5;
      particlesRef.current.push({
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 3,
        opacity: 1,
        life: 25 + Math.floor(Math.random() * 15),
      });
    }
  };

  const triggerScreenShake = () => {
    setIsScreenShaking(true);
    setTimeout(() => setIsScreenShaking(false), 300);
  };

  // Start / Restart Game
  const handleStartGame = (townName?: string) => {
    sounds.resumeContext();
    if (townName !== undefined && townName !== '') {
      setCustomTownName(townName);
    }
    const freshStats = createInitialStats();
    setStats(freshStats);
    statsRef.current = freshStats;
    playerXRef.current = CANVAS_VIRTUAL_WIDTH / 2;
    setPlayerX(CANVAS_VIRTUAL_WIDTH / 2);
    setInvincibleTimer(0);
    spawnTimer.current = 0;
    frameCount.current = 0;

    // Seed 2 initial items so items start falling right from the start
    const polCategories = Object.keys(POLICIES) as PolicyCategory[];
    const chosenPol = polCategories[Math.floor(Math.random() * polCategories.length)];
    const chosenVoice = CITIZEN_VOICES[Math.floor(Math.random() * CITIZEN_VOICES.length)];
    const initialItems: FallingItem[] = [
      {
        id: nextItemId.current++,
        x: 130 + Math.random() * 70,
        y: -30,
        speed: 2.6,
        vy: 2.6,
        width: 44,
        height: 48,
        type: { kind: 'policy', category: chosenPol },
        wobbleOffset: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.06,
      },
      {
        id: nextItemId.current++,
        x: 270 + Math.random() * 70,
        y: -75,
        speed: 2.3,
        vy: 2.3,
        width: 120,
        height: 32,
        type: { kind: 'voice', text: chosenVoice.text, category: chosenVoice.category },
        wobbleOffset: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.05,
      },
    ];

    itemsRef.current = initialItems;
    setItems(initialItems);
    particlesRef.current = [];
    setParticles([]);
    effectsRef.current = [];
    setEffects([]);
    setReport(null);
    setIsPaused(false);
    isPausedRef.current = false;
    gameStateRef.current = 'PLAYING';
    setGameState('PLAYING');
    if (isBgmActive) {
      sounds.startBGM('game');
    }
  };

  const handleToggleBgm = () => {
    sounds.resumeContext();
    if (isBgmActive) {
      sounds.stopBGM();
      setIsBgmActive(false);
    } else {
      setIsBgmActive(true);
      if (gameState === 'CHAR_SELECT') {
        sounds.startBGM('title');
      } else if (gameState === 'PLAYING' && !isPaused) {
        sounds.startBGM('game');
      }
    }
  };

  const handleToggleMute = () => {
    sounds.resumeContext();
    const isMuted = sounds.toggleMute();
    if (isMuted) {
      setIsBgmActive(false);
    } else {
      setIsBgmActive(true);
      if (gameState === 'CHAR_SELECT') {
        sounds.startBGM('title');
      } else if (gameState === 'PLAYING' && !isPaused) {
        sounds.startBGM('game');
      }
    }
  };

  // Touch on Canvas directly moves player toward touch X
  const handleCanvasInteraction = (clientX: number, target: HTMLCanvasElement) => {
    const rect = target.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const scale = CANVAS_VIRTUAL_WIDTH / rect.width;
    const targetVirtualX = relativeX * scale;
    playerXRef.current = Math.max(30, Math.min(CANVAS_VIRTUAL_WIDTH - 30, targetVirtualX));
    setPlayerX(playerXRef.current);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-2 sm:p-4 select-none">
      
      {/* Top Header / Status bar */}
      <header className="w-full max-w-xl flex items-center justify-between py-1.5 px-3 bg-slate-900/80 border border-slate-800 rounded-2xl mb-2 shadow-lg backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏃‍♂️</span>
          <div>
            <h1 className="font-pixel text-xs sm:text-sm font-bold text-amber-300 tracking-wide">
              ケンタ政策ゲーム
            </h1>
            <p className="text-[10px] text-slate-400 font-pixel hidden sm:block">
              「声を聞いて、政策を届けろ！」
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-pixel">
          {highScore > 0 && (
            <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-1 rounded-lg border border-amber-500/30">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>HI: {highScore.toLocaleString()}</span>
            </div>
          )}

          {/* BGM Toggle button in header */}
          <button
            onClick={handleToggleBgm}
            title={isBgmActive ? 'BGMをOFFにする' : 'BGMをONにする'}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition cursor-pointer ${
              isBgmActive
                ? 'bg-amber-500/20 border-amber-400/60 text-amber-300 shadow-sm shadow-amber-500/10'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className={`w-3.5 h-3.5 ${isBgmActive ? 'animate-pulse text-amber-400' : ''}`} />
            <span className="hidden sm:inline">BGM {isBgmActive ? 'ON' : 'OFF'}</span>
          </button>

          {/* Mute Toggle button in header */}
          <button
            onClick={handleToggleMute}
            title={sounds.isMuted ? 'ミュート解除' : 'ミュート'}
            className={`p-1 sm:px-2.5 sm:py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
              sounds.isMuted
                ? 'bg-red-950/60 border-red-800 text-red-400'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {sounds.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setIsHowToPlayOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">あそびかた</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-xl flex-1 flex flex-col items-center justify-center">
        {gameState === 'CHAR_SELECT' && (
          <CharacterSelect
            selectedCharacter={selectedCharacter}
            onSelectCharacter={setSelectedCharacter}
            onStartGame={handleStartGame}
            onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
            isBgmActive={isBgmActive}
            onToggleBgm={handleToggleBgm}
          />
        )}

        {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
          <div className="w-full flex flex-col items-center">
            {/* Top HUD */}
            <HUD
              stats={stats}
              isPaused={isPaused}
              isBgmActive={isBgmActive}
              onTogglePause={() => setIsPaused((p) => !p)}
              onToggleMute={handleToggleMute}
              onToggleBgm={handleToggleBgm}
            />

            {/* Game Canvas */}
            <div className="relative w-full max-w-[480px]">
              <GameCanvas
                stats={stats}
                selectedCharacter={selectedCharacter}
                playerX={playerX}
                isDashing={isDashing}
                facing={facing}
                invincibleTimer={invincibleTimer}
                items={items}
                particles={particles}
                effects={effects}
                isScreenShaking={isScreenShaking}
                onCanvasClick={(e) => handleCanvasInteraction(e.clientX, e.currentTarget)}
                onTouchMove={(e) => {
                  if (e.touches.length > 0) {
                    handleCanvasInteraction(e.touches[0].clientX, e.currentTarget);
                  }
                }}
              />

              {/* Pause Overlay */}
              {isPaused && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-4 z-30">
                  <div className="font-pixel text-2xl font-bold text-amber-400 animate-pulse">
                    ⏸ 一時停止中
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsPaused(false)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 font-pixel font-bold text-white text-xs rounded-xl shadow cursor-pointer"
                    >
                      再開する
                    </button>
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setIsPaused(false);
                        setGameState('CHAR_SELECT');
                      }}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 font-pixel text-slate-200 text-xs rounded-xl cursor-pointer"
                    >
                      タイトルへ
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Touch Controls */}
            <TouchControls
              onLeftStart={() => {
                touchMovement.current = 'left';
              }}
              onLeftEnd={() => {
                if (touchMovement.current === 'left') touchMovement.current = null;
              }}
              onRightStart={() => {
                touchMovement.current = 'right';
              }}
              onRightEnd={() => {
                if (touchMovement.current === 'right') touchMovement.current = null;
              }}
              onDashStart={() => {
                touchDashing.current = true;
              }}
              onDashEnd={() => {
                touchDashing.current = false;
              }}
              isDashing={isDashing}
            />
          </div>
        )}

        {/* Report Modal */}
        {gameState === 'REPORT' && (
          <ReportModal
            stats={stats}
            characterId={selectedCharacter}
            report={report}
            isLoading={isReportLoading}
            isFallback={isFallbackReport}
            onRestart={() => handleStartGame(customTownName)}
            onSelectCharacter={() => setGameState('CHAR_SELECT')}
          />
        )}
      </main>

      {/* How to Play Modal */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      {/* Footer Branding */}
      <footer className="w-full text-center py-2 text-[10px] text-slate-500 font-pixel">
        ケンタ政策ゲーム「声を聞いて、政策を届けろ！」 © 2026 Powered by Google Gemini AI
      </footer>
    </div>
  );
}
