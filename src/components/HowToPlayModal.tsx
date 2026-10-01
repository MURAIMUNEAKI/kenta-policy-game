import React from 'react';
import { X, Trophy, Volume2, Sparkles, Shield, AlertTriangle, MessageSquare } from 'lucide-react';
import { sounds } from '../utils/audio';
import { POLICIES, OBSTACLES } from '../utils/constants';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-amber-400 rounded-2xl p-5 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <h2 className="font-pixel text-lg font-bold text-amber-300">
              あそびかた・ルール説明
            </h2>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Story & Objective */}
        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs leading-relaxed space-y-1">
          <div className="font-bold text-sky-400 font-pixel flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            「声を聞いて、政策を届けろ！」
          </div>
          <p className="text-slate-300">
            まちの現場には、市民の切実な声がたくさんあふれています。
            画面上部から落ちてくる「地域の声」や「政策カード」を左右に移動してキャッチし、
            制限時間60秒のあいだにできるだけ多くの政策を実現させましょう！
          </p>
        </div>

        {/* Items Guide */}
        <div className="space-y-2 text-xs">
          <div className="font-bold text-amber-300 font-pixel">【キャッチするアイテム】</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-slate-800 p-2.5 rounded-lg border border-sky-500/40 space-y-1">
              <div className="font-bold text-sky-300 flex items-center gap-1">
                <span>📢</span> 地域の声（吹き出し）
              </div>
              <p className="text-slate-300 text-[11px]">
                「保育園増やして！」「堤防強化を！」などの市民の声。キャッチすると信頼度とフィーバーゲージが急上昇！
              </p>
            </div>
            <div className="bg-slate-800 p-2.5 rounded-lg border border-emerald-500/40 space-y-1">
              <div className="font-bold text-emerald-300 flex items-center gap-1">
                <span>📑</span> 政策カード（6分野）
              </div>
              <p className="text-slate-300 text-[11px]">
                子育て、防災、DX、地域経済、医療福祉、グリーンの6分野。スコア加算＆未来レポートの柱になります。
              </p>
            </div>
          </div>
        </div>

        {/* Obstacles */}
        <div className="space-y-1.5 text-xs">
          <div className="font-bold text-red-400 font-pixel">【避けるべき障害物】</div>
          <div className="bg-red-950/40 border border-red-800/60 p-2.5 rounded-lg text-slate-300 text-[11px] space-y-1">
            <div className="flex items-center gap-3">
              <span>💸 無駄なコスト</span>
              <span>🪨 放置課題</span>
              <span>⚡ デマ・誹謗中傷</span>
            </div>
            <p className="text-red-200">
              当たってしまうとライフ（ハート❤️）が減少し、スコアが引かれてしまいます！上手に避けましょう。
            </p>
          </div>
        </div>

        {/* Fever Mode & Gemini */}
        <div className="space-y-2 text-xs">
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-2.5 rounded-lg border border-purple-500/40 text-[11px] space-y-1">
            <div className="font-bold text-amber-300 font-pixel flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              政策実現 FEVER TIME!
            </div>
            <p className="text-slate-300">
              ゲージが満タンになるとフィーバー発動！黄金スターが降り注ぎ、すべての得点が2倍になります！
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-900/50 to-sky-900/50 p-2.5 rounded-lg border border-sky-500/40 text-[11px] space-y-1">
            <div className="font-bold text-sky-300 font-pixel">
              📰 Gemini AI「未来のまちレポート」
            </div>
            <p className="text-slate-300">
              ゲーム終了後、あなたが集めた政策の組み合わせをGoogle Geminiが即座に分析。完成した未来都市の号外新聞（住民の声・相乗効果）を発行します！
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-xs space-y-1">
          <div className="font-bold text-amber-400 font-pixel">【操作方法】</div>
          <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px]">
            <div>
              <span className="font-bold text-white">PC:</span> ← → または A / Dキー（移動）<br/>
              <span className="font-bold text-white">ダッシュ:</span> Shift または Spaceキー
            </div>
            <div>
              <span className="font-bold text-white">スマホ / タッチ:</span><br/>
              画面下の左右ボタンまたは画面直接タップ＆スライド
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold font-pixel rounded-xl shadow-lg transition active:scale-95 cursor-pointer text-center"
        >
          閉じる
        </button>
      </div>
    </div>
  );
};
