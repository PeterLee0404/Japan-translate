import React from 'react';
import { X, Volume2, Star, Copy, Check, Compass, AlertTriangle, ShieldCheck } from 'lucide-react';
import { SignItem } from '../services/offlineTranslator';
import { useSpeech } from '../hooks/useSpeech';

interface SignDetailModalProps {
  sign: SignItem | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (sign: SignItem) => void;
}

export const SignDetailModal: React.FC<SignDetailModalProps> = ({
  sign,
  onClose,
  isFavorite,
  onToggleFavorite,
}) => {
  const { speak, isPlaying } = useSpeech();
  const [copied, setCopied] = React.useState(false);

  if (!sign) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${sign.japanese} (${sign.hiragana}) - ${sign.chinese}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'road_sign':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">路牌標誌</span>;
      case 'transit':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">大眾交通</span>;
      case 'dining':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">美食餐廳</span>;
      case 'shopping':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">藥妝購物</span>;
      case 'warning':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">警示注意</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">公共設施</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-slate-900 border border-slate-700/80 text-slate-100 shadow-2xl p-5 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            {getCategoryBadge(sign.category)}
            {sign.orientation === 'vertical' && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                縱書・直排
              </span>
            )}
            <span className="text-xs text-slate-400 font-mono">ID: {sign.id}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Favorite */}
            <button
              onClick={() => onToggleFavorite(sign)}
              className={`p-2 rounded-xl transition ${
                isFavorite
                  ? 'text-amber-400 bg-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={isFavorite ? '取消收藏' : '加入收藏'}
            >
              <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>

            {/* Copy */}
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="複製翻譯"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="mt-4 space-y-4">
          {/* Japanese Display with Audio */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
            <div className="text-xs font-semibold text-rose-400 mb-1">
              日文原文 (漢字 / 假名)
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                  {sign.japanese}
                </div>
                {sign.hiragana && (
                  <div className="text-sm font-medium text-slate-300 mt-0.5">
                    {sign.hiragana}
                  </div>
                )}
                {sign.romaji && (
                  <div className="text-xs font-mono text-amber-300/90 mt-0.5">
                    羅馬拼音: {sign.romaji}
                  </div>
                )}
              </div>

              {/* TTS Button */}
              <button
                onClick={() => speak(sign.japanese)}
                disabled={isPlaying}
                className="flex items-center justify-center h-12 w-12 rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-900/40 hover:bg-rose-500 active:scale-95 transition shrink-0"
                title="日語真人發音"
              >
                <Volume2 className={`w-6 h-6 ${isPlaying ? 'animate-pulse text-amber-200' : ''}`} />
              </button>
            </div>
          </div>

          {/* Chinese Translation */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-800/50 border border-emerald-500/30">
            <div className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 繁體中文譯名 (台灣旅客地道說法)
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-300">
              {sign.chinese}
            </div>
          </div>

          {/* Practical Action Tip */}
          {sign.actionTip && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
              <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1 text-xs">
                <Compass className="w-4 h-4" /> 自由行旅客當下指引
              </div>
              <p className="leading-relaxed">{sign.actionTip}</p>
            </div>
          )}

          {/* Cultural / Background explanation */}
          {sign.explanation && (
            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-slate-300 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 font-bold text-slate-400 mb-1 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-blue-400" /> 日本文化與規則叮嚀
              </div>
              <p className="leading-relaxed">{sign.explanation}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 transition"
          >
            關閉檢視
          </button>
        </div>
      </div>
    </div>
  );
};
