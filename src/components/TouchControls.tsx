import React from 'react';
import { ArrowLeft, ArrowRight, Zap } from 'lucide-react';

interface TouchControlsProps {
  onLeftStart: () => void;
  onLeftEnd: () => void;
  onRightStart: () => void;
  onRightEnd: () => void;
  onDashStart: () => void;
  onDashEnd: () => void;
  isDashing: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onLeftStart,
  onLeftEnd,
  onRightStart,
  onRightEnd,
  onDashStart,
  onDashEnd,
  isDashing,
}) => {
  return (
    <div className="w-full max-w-[480px] mx-auto mt-2 flex items-center justify-between px-3 select-none touch-none">
      {/* Left Arrow Button (Left edge) */}
      <button
        type="button"
        onTouchStart={(e) => {
          e.preventDefault();
          onLeftStart();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          onLeftEnd();
        }}
        onTouchCancel={(e) => {
          e.preventDefault();
          onLeftEnd();
        }}
        onMouseDown={onLeftStart}
        onMouseUp={onLeftEnd}
        onMouseLeave={onLeftEnd}
        className="w-16 sm:w-20 h-16 bg-slate-800 active:bg-blue-600 border-2 border-slate-600 active:border-blue-400 rounded-2xl flex items-center justify-center text-white shadow-xl active:scale-95 transition-transform cursor-pointer shrink-0"
        aria-label="左へ移動"
      >
        <ArrowLeft className="w-8 h-8" />
      </button>

      {/* Dash Button (Center) */}
      <button
        type="button"
        onTouchStart={(e) => {
          e.preventDefault();
          onDashStart();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          onDashEnd();
        }}
        onTouchCancel={(e) => {
          e.preventDefault();
          onDashEnd();
        }}
        onMouseDown={onDashStart}
        onMouseUp={onDashEnd}
        onMouseLeave={onDashEnd}
        className={`flex-1 max-w-[170px] mx-2 h-16 rounded-2xl border-2 font-pixel font-bold flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all cursor-pointer ${
          isDashing
            ? 'bg-amber-500 border-amber-300 text-slate-950 scale-95 shadow-amber-500/30'
            : 'bg-slate-800 border-amber-500/70 text-amber-300 active:bg-amber-500 active:text-slate-950'
        }`}
        aria-label="ダッシュ"
      >
        <Zap className={`w-5 h-5 fill-current ${isDashing ? 'animate-bounce' : ''}`} />
        <span className="text-sm sm:text-base tracking-wider">DASH</span>
      </button>

      {/* Right Arrow Button (Right edge) */}
      <button
        type="button"
        onTouchStart={(e) => {
          e.preventDefault();
          onRightStart();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          onRightEnd();
        }}
        onTouchCancel={(e) => {
          e.preventDefault();
          onRightEnd();
        }}
        onMouseDown={onRightStart}
        onMouseUp={onRightEnd}
        onMouseLeave={onRightEnd}
        className="w-16 sm:w-20 h-16 bg-slate-800 active:bg-blue-600 border-2 border-slate-600 active:border-blue-400 rounded-2xl flex items-center justify-center text-white shadow-xl active:scale-95 transition-transform cursor-pointer shrink-0"
        aria-label="右へ移動"
      >
        <ArrowRight className="w-8 h-8" />
      </button>
    </div>
  );
};
