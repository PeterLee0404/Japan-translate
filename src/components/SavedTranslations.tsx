import React from 'react';
import {
  BookmarkCheck,
  Star,
  Trash2,
  Volume2,
  Share2,
  Download,
  WifiOff,
  Database,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { SignItem, OFFLINE_DICTIONARY } from '../services/offlineTranslator';
import { useSpeech } from '../hooks/useSpeech';

interface SavedTranslationsProps {
  savedSigns: SignItem[];
  onRemoveSign: (id: string) => void;
  onClearAll: () => void;
  isOnline: boolean;
  forceOffline: boolean;
  onToggleForceOffline: () => void;
  onResetToOnline?: () => void;
}

export const SavedTranslations: React.FC<SavedTranslationsProps> = ({
  savedSigns,
  onRemoveSign,
  onClearAll,
  isOnline,
  forceOffline,
  onToggleForceOffline,
  onResetToOnline,
}) => {
  const { speak } = useSpeech();

  const handleExportText = () => {
    if (savedSigns.length === 0) return;
    const content = savedSigns
      .map(
        (s, i) =>
          `${i + 1}. ${s.japanese} (${s.hiragana || s.romaji})\n   譯文: ${s.chinese}\n   指引: ${s.actionTip || s.explanation || '無'}\n`
      )
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JapanGo_旅日收藏路牌_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Offline Status & Package Overview Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>離線旅行支援狀態</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  離線包已就緒
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                本機已離線快取超過 1,200+ 日本交通路牌、居酒屋、購物與緊急救援字庫
              </p>
            </div>
          </div>

          {/* Toggle Offline Test Switch */}
          <button
            onClick={() => {
              if (!isOnline && onResetToOnline) {
                onResetToOnline();
              } else {
                onToggleForceOffline();
              }
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
              !isOnline
                ? 'bg-amber-600 border-amber-500 text-white hover:bg-amber-500'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <WifiOff className="w-4 h-4" />
            <span>{!isOnline ? '切換回線上 AI 模式' : '測試無網路離線模式'}</span>
          </button>
        </div>

        {/* Features check grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>PWA 離線應用程式快取</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>真實日本路牌場景庫離線支援</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>收藏紀錄隨機身永久儲存</span>
          </div>
        </div>
      </div>

      {/* Bookmarked / Saved Signs List */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-bold text-white">
              我的收藏路牌與翻譯筆記 ({savedSigns.length})
            </h3>
          </div>

          {savedSigns.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportText}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
                title="匯出為文字檔"
              >
                <Download className="w-3.5 h-3.5" />
                <span>匯出筆記</span>
              </button>
              <button
                onClick={onClearAll}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-400 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清空</span>
              </button>
            </div>
          )}
        </div>

        {savedSigns.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Star className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-medium">尚未收藏任何路牌標籤</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              在相機掃描、照片辨識或日文輸入翻譯結果中，點擊星號 ★ 即可將重要標牌儲存在此，離線無網路隨時查閱！
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savedSigns.map((sign) => (
              <div
                key={sign.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-lg font-black text-white">{sign.japanese}</div>
                      {sign.hiragana && (
                        <div className="text-xs text-slate-400">{sign.hiragana}</div>
                      )}
                      {sign.romaji && (
                        <div className="text-[11px] font-mono text-amber-400">
                          {sign.romaji}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => speak(sign.japanese)}
                        className="p-1.5 text-slate-400 hover:text-white transition"
                        title="播放讀音"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onRemoveSign(sign.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                        title="移除收藏"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 text-base font-bold text-emerald-400">
                    {sign.chinese}
                  </div>

                  {sign.actionTip && (
                    <p className="mt-1 text-xs text-amber-200/90 leading-relaxed">
                      💡 {sign.actionTip}
                    </p>
                  )}
                </div>

                <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-900 flex justify-between">
                  <span>類別: {sign.category}</span>
                  <span className="text-emerald-400">✓ 支援離線查詢</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
