import React, { useState } from 'react';
import {
  Search,
  Volume2,
  Maximize2,
  X,
  Star,
  BookOpen,
  Filter,
  Train,
  Utensils,
  ShoppingBag,
  Hotel,
  AlertOctagon
} from 'lucide-react';
import { TRAVEL_PHRASES, PhraseItem } from '../services/phrasebook';
import { useSpeech } from '../hooks/useSpeech';

export const TravelPhrasebook: React.FC = () => {
  const { speak, isPlaying } = useSpeech();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [largeDisplayPhrase, setLargeDisplayPhrase] = useState<PhraseItem | null>(null);

  const categories = [
    { id: 'all', label: '全部', icon: BookOpen },
    { id: 'transit', label: '交通路牌', icon: Train },
    { id: 'dining', label: '餐廳居酒屋', icon: Utensils },
    { id: 'shopping', label: '購物藥妝', icon: ShoppingBag },
    { id: 'hotel', label: '飯店住宿', icon: Hotel },
    { id: 'emergency', label: '緊急求助', icon: AlertOctagon },
  ];

  const filteredPhrases = TRAVEL_PHRASES.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchCat;
    const matchSearch =
      p.japanese.toLowerCase().includes(q) ||
      p.chinese.toLowerCase().includes(q) ||
      p.romaji.toLowerCase().includes(q) ||
      p.situation.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-900/40 via-slate-900 to-slate-900 border border-rose-500/20 shadow-xl">
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <span>🇯🇵 自由行急用應急手冊</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
          精選日本自由行 100% 用得到的交通路牌、餐廳點餐、退稅購物與緊急會話。支援離線真人發音與<strong>「全螢幕展示給店員看」</strong>功能！
        </p>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋日文、羅馬拼音或中文（例如：新宿、加值、結帳、護照、退稅）..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500 transition text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                  selectedCategory === c.id
                    ? 'bg-rose-600 border-rose-500 text-white shadow-md'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Phrase Cards Grid */}
      <div className="space-y-3">
        {filteredPhrases.length === 0 ? (
          <div className="p-8 text-center text-slate-400 rounded-3xl bg-slate-900 border border-slate-800">
            找不到符合「{searchQuery}」的會話句子，請嘗試更換關鍵字。
          </div>
        ) : (
          filteredPhrases.map((phrase) => (
            <div
              key={phrase.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-base sm:text-lg font-black text-white">
                    {phrase.japanese}
                  </div>
                  <div className="text-xs font-medium text-slate-300">
                    假名: {phrase.hiragana}
                  </div>
                  <div className="text-xs font-mono text-amber-400">
                    拼音: {phrase.romaji}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* TTS */}
                  <button
                    onClick={() => speak(phrase.japanese)}
                    className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md transition"
                    title="朗讀日語"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  {/* Fullscreen Flash to clerk */}
                  <button
                    onClick={() => setLargeDisplayPhrase(phrase)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                    title="放大給日本人看"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chinese Translation & Situation */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-bold text-emerald-400">
                  {phrase.chinese}
                </div>
                <div className="text-[11px] text-slate-400 bg-slate-800/70 px-2 py-0.5 rounded-md">
                  💡 {phrase.situation}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Large Screen Presentation Modal (for flashing to Japanese locals/staff) */}
      {largeDisplayPhrase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border-2 border-rose-500 p-6 sm:p-8 text-center text-white space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center text-xs text-rose-400 font-bold">
              <span>出示給站務員或店員查看 (Show to staff)</span>
              <button
                onClick={() => setLargeDisplayPhrase(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Giant Japanese Text */}
            <div className="py-4">
              <div className="text-3xl sm:text-5xl font-black text-amber-300 leading-tight tracking-wide">
                {largeDisplayPhrase.japanese}
              </div>
              <div className="text-lg sm:text-xl font-medium text-slate-300 mt-3">
                {largeDisplayPhrase.hiragana}
              </div>
            </div>

            {/* Chinese Translation */}
            <div className="p-4 rounded-2xl bg-slate-800 text-emerald-400 text-base sm:text-lg font-bold">
              {largeDisplayPhrase.chinese}
            </div>

            {/* Audio Button */}
            <div className="flex justify-center gap-3">
              <button
                onClick={() => speak(largeDisplayPhrase.japanese)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-base shadow-lg shadow-rose-950/60 transition"
              >
                <Volume2 className="w-5 h-5" />
                <span>大聲朗讀日文</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
