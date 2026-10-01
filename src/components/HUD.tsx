import React from 'react';
import { GameStats } from '../types/game';
import { Heart, Clock, Zap, MessageSquare, Pause, Play, Volume2, VolumeX, Music } from 'lucide-react';
import { sounds } from '../utils/audio';

interface HUDProps {
  stats: GameStats;
  isPaused: boolean;
  isBgmActive: boolean;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onToggleBgm: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  isPaused,
  isBgmActive,
  onTogglePause,
  onToggleMute,
  onToggleBgm,
}) => {
  const isUrgent = stats.timeLeft <= 15;

  return (
    <div className="w-full max-w-[480px] mx-auto mb-2 space-y-1 select-none">
      
      {/* Top Bar: Hearts, Timer, Pause & Sound */}
      <div className="flex items-center justify-between bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl shadow-md">
        
        {/* Hearts / Lives */}
        <div className="flex items-center gap-1">
          {Array.from({ length: stats.maxHearts }).map((_, i) => (
            <span
              key={i}
              className={`text-base transition-transform ${
                i < stats.hearts ? 'text-red-500 scale-100' : 'text-slate-600 scale-90 opacity-40'
              }`}
            >
              ❤️
            </span>
          ))}
        </div>

        {/* Time Remaining */}
        <div
          className={`flex items-center gap-1 font-pixel font-bold px-2.5 py-0.5 rounded-lg border ${
            isUrgent
              ? 'bg-red-950/80 text-red-400 border-red-500 animate-pulse'
              : 'bg-slate-900 text-sky-300 border-slate-700'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span className="text-sm">{Math.max(0, Math.ceil(stats.timeLeft))}s</span>
        </div>

        {/* Controls: Mute, BGM, Pause */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleBgm}
            title={isBgmActive ? 'BGM Off' : 'BGM On'}
            className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
              isBgmActive
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-500'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onToggleMute}
            title={sounds.isMuted ? 'Unmute' : 'Mute'}
            className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
              sounds.isMuted
                ? 'bg-red-950/60 border-red-800 text-red-400'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            {sounds.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onTogglePause}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Middle Bar: Score & Combo & Voices */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl shadow-inner">
        <div>
          <div className="text-[10px] text-slate-400 font-pixel">SCORE</div>
          <div className="text-lg font-pixel font-bold text-amber-400 tracking-wider">
            {stats.score.toLocaleString()}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-pixel">
          {stats.combo > 1 && (
            <div className="bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-md animate-bounce shadow">
              {stats.combo} COMBO!
            </div>
          )}

          <div className="flex items-center gap-1 text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-800/50">
            <MessageSquare className="w-3 h-3" />
            <span>声: {stats.voicesHeard}</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Fever Gauge */}
      <div className="space-y-0.5">
        <div className="flex items-center justify-between text-[10px] font-pixel px-1 text-slate-400">
          <span className="flex items-center gap-1 text-amber-400 font-bold">
            <Zap className="w-3 h-3 text-amber-400" />
            政策実現 FEVER GAUGE
          </span>
          <span>{stats.isFever ? '🔥 FEVER ACTIVE!!' : `${Math.floor(stats.feverGauge)}%`}</span>
        </div>

        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-150 ${
              stats.isFever
                ? 'bg-gradient-to-r from-yellow-400 via-pink-500 to-amber-400 animate-pulse'
                : 'bg-gradient-to-r from-sky-500 to-amber-400'
            }`}
            style={{ width: `${stats.feverGauge}%` }}
          />
        </div>
      </div>
    </div>
  );
};
