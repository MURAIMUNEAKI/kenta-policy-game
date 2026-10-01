import React, { useState } from 'react';
import { Play, Sparkles, Zap, Shield, HelpCircle, MapPin, Music } from 'lucide-react';
import { CharacterId } from '../types/game';
import { CHARACTERS } from '../utils/constants';
import { sounds } from '../utils/audio';

interface CharacterSelectProps {
  selectedCharacter: CharacterId;
  onSelectCharacter: (id: CharacterId) => void;
  onStartGame: (townName: string) => void;
  onOpenHowToPlay: () => void;
  isBgmActive: boolean;
  onToggleBgm: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  selectedCharacter,
  onSelectCharacter,
  onStartGame,
  onOpenHowToPlay,
  isBgmActive,
  onToggleBgm,
}) => {
  const [townName, setTownName] = useState('');

  const charList: CharacterId[] = ['kenta_leader', 'kenta_car', 'kenta_bike'];

  const handleStart = () => {
    sounds.playClick();
    onStartGame(townName.trim());
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 px-3 py-4 text-slate-100">
      
      {/* Title Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-400/40 rounded-full text-amber-300 text-xs font-pixel">
          <Sparkles className="w-3.5 h-3.5" />
          政策キャッチ・アクション
        </div>
        <h1 className="text-2xl sm:text-3xl font-black font-round tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-sky-300 to-emerald-300 drop-shadow">
          ケンタ政策ゲーム
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 font-pixel">
          「声を聞いて、政策を届けろ！」
        </p>

        {/* Title Screen BGM indicator & toggle */}
        <div className="pt-0.5 flex items-center justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleBgm();
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-pixel border transition shadow-sm cursor-pointer ${
              isBgmActive
                ? 'bg-amber-500/20 border-amber-400/60 text-amber-300 shadow-amber-500/10 hover:bg-amber-500/30'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
            title={isBgmActive ? 'BGMをOFFにする' : 'BGMをONにする'}
          >
            <Music className={`w-3.5 h-3.5 ${isBgmActive ? 'animate-bounce text-amber-400' : ''}`} />
            <span>タイトルBGM: {isBgmActive ? '♪ 再生中 (ON)' : '停止中 (OFF)'}</span>
          </button>
        </div>
      </div>

      {/* Town Name Input Field */}
      <div className="bg-slate-800/90 border border-slate-700 p-3 rounded-xl space-y-1.5 shadow-md">
        <label className="text-xs font-bold text-sky-300 font-pixel flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          あなたのまちの名前（任意）
        </label>
        <input
          type="text"
          value={townName}
          onChange={(e) => setTownName(e.target.value)}
          placeholder="例：泉みらい市、ひかり町、希望ヶ丘..."
          maxLength={20}
          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-950 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 shadow-inner"
        />
        <p className="text-[10px] text-slate-400">
          ※ 空欄の場合は集めた政策に合わせた名前をGeminiが自動命名します！
        </p>
      </div>

      {/* Character Selection Cards */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-amber-300 font-pixel flex items-center justify-between">
          <span>キャラクターを選んでください</span>
          <button
            onClick={() => {
              sounds.playClick();
              onOpenHowToPlay();
            }}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            ルールを見る
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {charList.map((id) => {
            const char = CHARACTERS[id];
            const isSelected = selectedCharacter === id;

            return (
              <div
                key={id}
                onClick={() => {
                  sounds.playClick();
                  onSelectCharacter(id);
                }}
                className={`relative p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-900/60 border-amber-400 shadow-lg shadow-amber-500/20 scale-[1.02]'
                    : 'bg-slate-800/70 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                }`}
              >
                {isSelected && (
                  <span className="absolute -top-2.5 right-3 bg-amber-400 text-slate-950 font-bold text-[10px] font-pixel px-2 py-0.5 rounded-full shadow">
                    SELECTED
                  </span>
                )}

                <div className="space-y-1.5">
                  {/* Sprite Preview Icon */}
                  <div className="w-12 h-12 mx-auto rounded-lg bg-slate-900/80 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                    {id === 'kenta_leader' && '🏃'}
                    {id === 'kenta_car' && '🚗'}
                    {id === 'kenta_bike' && '🚲'}
                  </div>

                  <div className="text-center">
                    <h3 className="font-bold text-sm text-white font-round">
                      {char.name}
                    </h3>
                    <p className="text-[10px] text-amber-300/90 font-pixel">
                      {char.subtitle}
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-tight">
                    {char.description}
                  </p>
                </div>

                {/* Special Ability Pill */}
                <div className="mt-2 pt-2 border-t border-slate-700/60 text-[10px] text-sky-300 font-pixel flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">{char.specialAbility}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-base font-black font-pixel rounded-2xl shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 transition transform active:scale-95 cursor-pointer"
      >
        <Play className="w-5 h-5 fill-current" />
        現場へ出発！ゲームスタート
      </button>

      {/* Quick Tips */}
      <div className="text-center text-[11px] text-slate-400 font-pixel">
        操作: ← → キーで移動 / Spaceでダッシュ（スマホは画面タップ＆ボタン操作）
      </div>
    </div>
  );
};
