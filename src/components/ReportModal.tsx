import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Award, CheckCircle, Copy, RefreshCw, Share2, Sparkles, User, Volume2, ArrowLeft } from 'lucide-react';
import { CharacterId, GameStats, TownReport } from '../types/game';
import { CHARACTERS, POLICIES } from '../utils/constants';
import { sounds } from '../utils/audio';

interface ReportModalProps {
  stats: GameStats;
  characterId: CharacterId;
  report: TownReport | null;
  isLoading: boolean;
  isFallback: boolean;
  onRestart: () => void;
  onSelectCharacter: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  stats,
  characterId,
  report,
  isLoading,
  isFallback,
  onRestart,
  onSelectCharacter,
}) => {
  const [copied, setCopied] = useState(false);
  const character = CHARACTERS[characterId];

  useEffect(() => {
    if (report && !isLoading) {
      sounds.playClearFanfare();
      // Burst celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#fbbf24', '#f43f5e', '#10b981', '#a855f7'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 300);
    }
  }, [report, isLoading]);

  const handleShare = () => {
    sounds.playClick();
    if (!report) return;
    const text = `【ケンタ政策ゲーム 号外】\n私が創った未来のまち：「${report.townTitle}」\n🏆 スコア: ${stats.score.toLocaleString()}点 (ランク: ${report.overallRank})\n📢 聞いた地域の声: ${stats.voicesHeard}件\n#ケンタ政策ゲーム #声を聞いて政策を届けろ #まちづくりAI`;
    const url = window.location.href;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=550,height=420');
  };

  const handleCopy = () => {
    sounds.playClick();
    if (!report) return;
    const text = `【未来まちづくり新聞 号外】
都市名: ${report.townTitle}
キャッチフレーズ: ${report.catchphrase}
総合評価ランク: ${report.overallRank}
獲得スコア: ${stats.score}点 / 最大コンボ: ${stats.maxCombo}

【概要】
${report.summary}

【注目の政策ニュース】
${report.headlineNews.map((h, i) => `${i + 1}. ${h}`).join('\n')}

【市民の喜びの声】
${report.citizenVoices.map((v) => `・${v.resident}: 「${v.quote}」`).join('\n')}

【政策シナジー効果】
${report.synergyEffect}

【ケンタからのメッセージ】
「${report.kentaComment}」
---
ケンタ政策ゲーム「声を聞いて、政策を届けろ！」より`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const rankBadgeStyles: Record<string, string> = {
    SSS: 'from-amber-300 via-pink-400 to-indigo-500 text-white shadow-amber-400/50 ring-2 ring-amber-300',
    SS: 'from-yellow-400 to-amber-600 text-slate-950 shadow-yellow-500/50',
    S: 'from-cyan-400 to-blue-600 text-white shadow-blue-500/50',
    A: 'from-emerald-400 to-teal-600 text-white shadow-emerald-500/50',
    B: 'from-sky-400 to-slate-600 text-white shadow-sky-500/50',
    C: 'from-amber-600 to-orange-700 text-white shadow-orange-500/50',
    D: 'from-slate-600 to-zinc-800 text-white shadow-zinc-600/50',
  };

  const rankLabels: Record<string, string> = {
    SSS: '奇跡の超スマートシティ (最高ランク)',
    SS: '先進モデル都市',
    S: '優良共生スマートタウン',
    A: '着実に前進する希望タウン',
    B: '課題解決に奮闘中の街',
    C: '課題山積の試行錯誤エリア',
    D: '再建挑戦中のまち',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-amber-50 text-slate-900 rounded-2xl shadow-2xl border-4 border-amber-900/30 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-300">
        
        {/* Newspaper Masthead */}
        <div className="bg-slate-900 text-amber-100 px-4 py-3 border-b-4 border-amber-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-white text-xs font-pixel px-2 py-0.5 rounded font-bold animate-pulse">
              号外 EXTRA
            </span>
            <h1 className="font-pixel text-lg sm:text-xl font-bold tracking-wider">
              未来まちづくり新聞
            </h1>
          </div>
          <div className="text-right text-xs text-slate-400 font-pixel">
            <div>第2026号・政策特別版</div>
            <div className="text-[10px] text-amber-400">Powered by Gemini AI</div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-amber-400/30 border-t-amber-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">
                🏛️
              </div>
            </div>
            <div className="font-pixel text-lg font-bold text-slate-800">
              Geminiがあなたが築いた未来のまちを分析中...
            </div>
            <p className="text-sm text-slate-600 max-w-md">
              集めた「政策カード」と「市民の声」の組み合わせから、新都市の姿と住民レポートを生成しています。
            </p>
          </div>
        )}

        {/* Report Content */}
        {!isLoading && report && (
          <div className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Score & Rank Header Banner */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-amber-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${rankBadgeStyles[report.overallRank] || rankBadgeStyles.A} flex flex-col items-center justify-center shadow-lg font-pixel font-bold`}>
                  <span className="text-[10px] opacity-90 leading-none">RANK</span>
                  <span className="text-2xl leading-tight">{report.overallRank}</span>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-pixel">TOTAL SCORE</div>
                  <div className="text-2xl font-bold font-pixel text-slate-900">
                    {stats.score.toLocaleString()} <span className="text-sm font-normal text-slate-600">pts</span>
                  </div>
                  <div className="text-[11px] font-bold text-amber-700 font-pixel">
                    {rankLabels[report.overallRank] || '評価完了'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-pixel text-slate-700 bg-amber-100/60 px-3 py-2 rounded-lg">
                <div>
                  <span className="text-slate-500">地域の声:</span> <span className="font-bold text-sky-700">{stats.voicesHeard}件</span>
                </div>
                <div>
                  <span className="text-slate-500">最大コンボ:</span> <span className="font-bold text-amber-700">{stats.maxCombo}連</span>
                </div>
                <div>
                  <span className="text-slate-500">回避した課題:</span> <span className="font-bold text-emerald-700">{stats.obstaclesAvoided}件</span>
                </div>
              </div>
            </div>

            {/* Main Newspaper Headline */}
            <div className="text-center space-y-1.5 border-b-2 border-dashed border-amber-300 pb-4">
              <div className="inline-block bg-amber-200/80 text-amber-900 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {report.catchphrase}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug font-round">
                {report.townTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-xl mx-auto pt-1">
                {report.summary}
              </p>
            </div>

            {/* Policy Realization Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 font-pixel">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  実現された重点政策実績
                </span>
                <span className="text-slate-500 text-[11px]">プレイヤー: {character.name}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(POLICIES) as (keyof typeof POLICIES)[]).map((catKey) => {
                  const pol = POLICIES[catKey];
                  const count = stats.collectedPolicies[catKey] || 0;
                  return (
                    <div
                      key={catKey}
                      className={`p-2 rounded-lg border flex items-center justify-between text-xs ${
                        count > 0 ? 'bg-white border-slate-300 shadow-sm' : 'bg-slate-100/60 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-base">{pol.icon}</span>
                        <span className="font-bold truncate text-slate-800">{pol.shortName}</span>
                      </div>
                      <span className={`font-pixel font-bold px-1.5 py-0.5 rounded text-xs ${
                        count > 0 ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {count}個
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Headline News */}
            <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-sm space-y-2">
              <div className="text-xs font-bold font-pixel text-red-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                【号外トピックス】街の最新ニュース
              </div>
              <ul className="space-y-1.5">
                {report.headlineNews.map((news, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-800">
                    <span className="bg-red-100 text-red-700 font-bold rounded px-1.5 py-0.2 text-[10px] shrink-0 font-pixel mt-0.5">
                      NEWS {idx + 1}
                    </span>
                    <span className="font-medium">{news}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Citizen Testimonials */}
            <div className="space-y-2">
              <div className="text-xs font-bold font-pixel text-slate-700 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-sky-600" />
                市民の喜びの声
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {report.citizenVoices.map((voice, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-3 rounded-xl border border-amber-200/70 shadow-sm flex flex-col justify-between text-xs space-y-2"
                  >
                    <p className="text-slate-700 italic leading-relaxed">
                      「{voice.quote}」
                    </p>
                    <div className="font-bold text-[11px] text-sky-800 text-right font-pixel">
                      — {voice.resident}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Policy Synergy Analysis */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3.5 rounded-xl border border-blue-200 text-xs space-y-1">
              <div className="font-bold text-blue-900 font-pixel flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-blue-600" />
                政策シナジー分析（政策の好循環）
              </div>
              <p className="text-slate-700 leading-relaxed">
                {report.synergyEffect}
              </p>
            </div>

            {/* Kenta's Comment */}
            <div className="bg-amber-100/80 p-3.5 rounded-xl border-l-4 border-amber-600 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg shrink-0 shadow">
                🏃
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-xs text-amber-950 font-pixel">ケンタからのメッセージ</div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  「{report.kentaComment}」
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-between items-center border-t border-amber-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg shadow transition transform active:scale-95 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Xでシェア
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition active:scale-95 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'コピー完了！' : '記事をコピー'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onSelectCharacter}
                  className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  キャラ変更
                </button>
                <button
                  onClick={onRestart}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-md transition transform active:scale-95 font-pixel cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  もう一度まちづくり！
                </button>
              </div>
            </div>

            {isFallback && (
              <div className="text-[10px] text-center text-slate-500">
                ※ ローカルエンジンにより速報生成されました。
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
