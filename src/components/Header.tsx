import React from 'react';
import { Camera, Image as ImageIcon, Keyboard, BookOpen, BookmarkCheck, Wifi, WifiOff, Sparkles } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export type TabType = 'camera' | 'photo' | 'text' | 'phrasebook' | 'saved';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isOnline: boolean;
  forceOffline: boolean;
  onToggleForceOffline: () => void;
  onResetToOnline?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isOnline,
  forceOffline,
  onToggleForceOffline,
  onResetToOnline,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      {/* Top Brand Bar */}
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 shadow-md shadow-rose-950/40 text-white font-black text-lg">
            <span>日</span>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] text-slate-900 font-bold border border-slate-900">
              繁
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">
                JapanGo
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                旅日路牌翻譯
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              即時相機辨識 • 照片繁中翻譯 • 離線隨身字典
            </p>
          </div>
        </div>

        {/* Right Actions: Offline Toggle + PWA Install */}
        <div className="flex items-center gap-2">
          {/* Force Offline / Online Indicator Button */}
          <button
            onClick={() => {
              if (!isOnline && onResetToOnline) {
                onResetToOnline();
              } else {
                onToggleForceOffline();
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              !isOnline
                ? 'bg-amber-950/70 border-amber-600/80 text-amber-300 hover:bg-amber-900/70'
                : 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/50'
            }`}
            title={!isOnline ? "目前為離線模式，點擊立即切換為線上 AI 模式" : "點擊可手動模擬無網路離線狀態，測試離線翻譯功能"}
          >
            {!isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>離線模式</span>
                <span className="text-[10px] text-amber-400/90 underline font-bold ml-0.5">切換回線上</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xs:inline">線上模式</span>
                <span className="flex items-center text-[10px] text-rose-300 bg-rose-950/60 px-1 py-0.2 rounded border border-rose-800/60">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" /> AI
                </span>
              </>
            )}
          </button>

          {/* PWA Install */}
          <PWAInstallButton />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-2 border-t border-slate-800/80 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 py-1.5" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
              activeTab === 'camera'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>即時相機掃描</span>
          </button>

          <button
            onClick={() => setActiveTab('photo')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
              activeTab === 'photo'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>相片辨識翻譯</span>
          </button>

          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
              activeTab === 'text'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>日文輸入翻譯</span>
          </button>

          <button
            onClick={() => setActiveTab('phrasebook')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
              activeTab === 'phrasebook'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>自由行急用手冊</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
              activeTab === 'saved'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>收藏與紀錄</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
