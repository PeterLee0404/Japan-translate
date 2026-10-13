/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, TabType } from './components/Header';
import { CameraScanner } from './components/CameraScanner';
import { PhotoTranslator } from './components/PhotoTranslator';
import { TextTranslator } from './components/TextTranslator';
import { TravelPhrasebook } from './components/TravelPhrasebook';
import { SavedTranslations } from './components/SavedTranslations';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { SignItem } from './services/offlineTranslator';
import { ShieldAlert, PhoneCall, WifiOff, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('camera');
  const { isOnline, browserOnline, forceOffline, toggleForceOffline, resetToOnline } = useOnlineStatus();
  const [toastDismissed, setToastDismissed] = useState(false);

  // Saved signs from localStorage
  const [savedSigns, setSavedSigns] = useState<SignItem[]>(() => {
    try {
      const stored = localStorage.getItem('japango_saved_signs');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse saved signs:', e);
    }
    // Initial helpful signs
    return [
      {
        id: 'init_1',
        japanese: '非常口',
        hiragana: 'ひじょうぐち',
        romaji: 'hijouguchi',
        chinese: '緊急逃生出口',
        category: 'warning',
        explanation: '法定逃生出口標示，綠色小綠人標誌。',
        actionTip: '進入飯店或地下街請先確認最近的非常口位置。',
      },
      {
        id: 'init_2',
        japanese: '改札口',
        hiragana: 'かいさつぐち',
        romaji: 'kaisatsuguchi',
        chinese: '剪票口 / 驗票閘門',
        category: 'transit',
        explanation: '進出地鐵或JR之刷卡閘門。',
        actionTip: '持 Suica / PASMO / IC 卡輕觸右側感應區。',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('japango_saved_signs', JSON.stringify(savedSigns));
    } catch (e) {
      console.warn('Failed to save signs:', e);
    }
  }, [savedSigns]);

  const handleToggleSaveSign = (sign: SignItem) => {
    setSavedSigns((prev) => {
      const exists = prev.some((s) => s.id === sign.id || s.japanese === sign.japanese);
      if (exists) {
        return prev.filter((s) => s.id !== sign.id && s.japanese !== sign.japanese);
      } else {
        return [sign, ...prev];
      }
    });
  };

  const handleRemoveSign = (id: string) => {
    setSavedSigns((prev) => prev.filter((s) => s.id !== id));
  };

  const handleClearAllSaved = () => {
    setSavedSigns([]);
  };

  const savedSignIds = savedSigns.map((s) => s.id);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOnline={isOnline}
        forceOffline={forceOffline}
        onToggleForceOffline={toggleForceOffline}
        onResetToOnline={resetToOnline}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 pb-24">
        {activeTab === 'camera' && (
          <CameraScanner
            isOnline={isOnline}
            onSaveSign={handleToggleSaveSign}
            savedSignIds={savedSignIds}
          />
        )}

        {activeTab === 'photo' && (
          <PhotoTranslator
            isOnline={isOnline}
            onSaveSign={handleToggleSaveSign}
            savedSignIds={savedSignIds}
          />
        )}

        {activeTab === 'text' && (
          <TextTranslator
            isOnline={isOnline}
            onSaveSign={handleToggleSaveSign}
            savedSignIds={savedSignIds}
          />
        )}

        {activeTab === 'phrasebook' && <TravelPhrasebook />}

        {activeTab === 'saved' && (
          <SavedTranslations
            savedSigns={savedSigns}
            onRemoveSign={handleRemoveSign}
            onClearAll={handleClearAllSaved}
            isOnline={isOnline}
            forceOffline={forceOffline}
            onToggleForceOffline={toggleForceOffline}
            onResetToOnline={resetToOnline}
          />
        )}
      </main>

      {/* Offline Toast Notification when offline */}
      {!isOnline && !toastDismissed && (
        <div className="fixed bottom-4 left-4 right-4 sm:right-auto z-50 flex items-center justify-between gap-3 rounded-2xl bg-amber-600/95 backdrop-blur-md px-4 py-3 text-xs font-semibold text-white shadow-2xl border border-amber-400/40 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0 animate-pulse text-amber-200" />
            <span>目前處於離線辭典模式</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => resetToOnline()}
              className="px-2.5 py-1 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100 transition shadow-sm"
            >
              切換回線上 AI
            </button>
            <button
              onClick={() => setToastDismissed(true)}
              className="p-1 text-amber-200 hover:text-white transition"
              title="關閉提示"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Japan Travel Emergency Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>日本自由行緊急專線：警察 <strong>110</strong> ｜ 消防救護 <strong>119</strong> ｜ JNTO外國旅客熱線 <strong>050-3816-2720</strong></span>
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <span>JapanGo 旅日隨身通 • 繁中對照支援</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
