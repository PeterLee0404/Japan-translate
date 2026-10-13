import React, { useState } from 'react';
import {
  Keyboard,
  ArrowRightLeft,
  Sparkles,
  Volume2,
  Copy,
  Check,
  Star,
  Compass,
  X,
  BookOpen,
  Send,
  MessageSquare
} from 'lucide-react';
import { COMMON_SIGN_KANJI } from '../services/phrasebook';
import { translateOfflineText, SignItem } from '../services/offlineTranslator';
import { deepConvertObjectToTraditional } from '../utils/chineseConverter';
import { useSpeech } from '../hooks/useSpeech';

interface TextTranslatorProps {
  isOnline: boolean;
  onSaveSign: (sign: SignItem) => void;
  savedSignIds: string[];
}

export const TextTranslator: React.FC<TextTranslatorProps> = ({
  isOnline,
  onSaveSign,
  savedSignIds,
}) => {
  const { speak, isPlaying } = useSpeech();

  const [inputMode, setInputMode] = useState<'ja-to-zh' | 'zh-to-ja'>('ja-to-zh');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Translation Result
  const [result, setResult] = useState<{
    originalText: string;
    translatedText: string;
    hiragana: string;
    romaji: string;
    category?: string;
    breakdown?: { word: string; reading: string; meaning: string }[];
    travelTip?: string;
    politeAlternative?: string;
  } | null>(null);

  // Quick Kanji keyboard
  const handleInsertKanji = (kanji: string) => {
    setInputText((prev) => prev + kanji);
  };

  const handleTranslate = async (textToTranslate?: string) => {
    const text = (textToTranslate || inputText).trim();
    if (!text) return;

    setLoading(true);
    setCopied(false);

    try {
      if (isOnline) {
        const res = await fetch('/api/translate-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            sourceLang: inputMode === 'ja-to-zh' ? 'ja' : 'zh-TW',
            targetLang: inputMode === 'ja-to-zh' ? 'zh-TW' : 'ja',
          }),
        });

        if (!res.ok) {
          throw new Error('API request failed');
        }

        const data = await res.json();
        setResult(deepConvertObjectToTraditional(data));
      } else {
        // Offline translation
        const offlineData = translateOfflineText(text, inputMode);
        setResult(deepConvertObjectToTraditional(offlineData));
      }
    } catch (err) {
      console.warn('Online translation failed, using offline fallback:', err);
      const offlineData = translateOfflineText(text, inputMode);
      setResult(deepConvertObjectToTraditional(offlineData));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert current result to SignItem for saving
  const handleSaveCurrent = () => {
    if (!result) return;
    const signItem: SignItem = {
      id: `text_${Date.now()}`,
      japanese: inputMode === 'ja-to-zh' ? result.originalText : result.translatedText,
      hiragana: result.hiragana || '',
      romaji: result.romaji || '',
      chinese: inputMode === 'ja-to-zh' ? result.translatedText : result.originalText,
      category: 'other',
      explanation: result.travelTip,
      actionTip: result.politeAlternative,
    };
    onSaveSign(signItem);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Input Card */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        {/* Header: Mode Selector & Clear */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setInputMode(inputMode === 'ja-to-zh' ? 'zh-to-ja' : 'ja-to-zh');
                setInputText('');
                setResult(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-rose-400 border border-slate-700 transition"
            >
              <span>{inputMode === 'ja-to-zh' ? '日文 ➔ 繁體中文' : '中文 ➔ 日文'}</span>
              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {!isOnline && (
              <span className="text-[10px] text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-800/60">
                離線對照模式
              </span>
            )}
          </div>

          {inputText && (
            <button
              onClick={() => {
                setInputText('');
                setResult(null);
              }}
              className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> 清除
            </button>
          )}
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleTranslate();
              }
            }}
            placeholder={
              inputMode === 'ja-to-zh'
                ? '請輸入或貼上日文路牌、站名或菜單文字（例：非常口、改札口、おすすめ、お会計、きっぷうりば）...'
                : '請輸入您想用日語詢問的中文句子（例：請問洗手間在哪裡？可以刷卡嗎？有中文菜單嗎？）...'
            }
            rows={3}
            className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-4 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition resize-none"
          />
        </div>

        {/* Quick Sign Kanji Keyboard (For travelers who see Kanji on a sign) */}
        {inputMode === 'ja-to-zh' && (
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold flex items-center gap-1 text-slate-300">
                <Keyboard className="w-3.5 h-3.5 text-rose-400" /> 日本路牌高頻漢字鍵盤（點擊快速輸入）：
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-thin">
              {COMMON_SIGN_KANJI.map((k) => (
                <button
                  key={k.kanji}
                  onClick={() => handleInsertKanji(k.kanji)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm border border-slate-700/60 hover:border-rose-500/60 transition active:scale-95 group relative"
                  title={`${k.reading} (${k.meaning})`}
                >
                  <span>{k.kanji}</span>
                  <span className="ml-1 text-[10px] text-slate-400 group-hover:text-amber-300 font-normal">
                    {k.meaning}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Submit Translate Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={() => handleTranslate()}
            disabled={loading || !inputText.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-rose-950/60 transition active:scale-95"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                <span>翻譯中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>即時翻譯</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Translation Result Card */}
      {result && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-2xl animate-in fade-in duration-300">
          {/* Top: Japanese with pronunciation */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-xs font-semibold text-rose-400 mb-1 flex items-center justify-between">
              <span>日語表達與假名讀音</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(result.translatedText || result.originalText)}
                  className="p-1.5 text-slate-400 hover:text-white transition"
                  title="複製"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleSaveCurrent}
                  className="p-1.5 text-slate-400 hover:text-amber-400 transition"
                  title="收藏至離線本"
                >
                  <Star className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {inputMode === 'ja-to-zh' ? result.originalText : result.translatedText}
                </div>
                {result.hiragana && (
                  <div className="text-sm font-medium text-slate-300 mt-1">
                    假名: {result.hiragana}
                  </div>
                )}
                {result.romaji && (
                  <div className="text-xs font-mono text-amber-400 mt-0.5">
                    羅馬拼音 (開口念): {result.romaji}
                  </div>
                )}
              </div>

              {/* TTS */}
              <button
                onClick={() =>
                  speak(inputMode === 'ja-to-zh' ? result.originalText : result.translatedText)
                }
                disabled={isPlaying}
                className="flex items-center justify-center h-12 w-12 rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-950/60 hover:bg-rose-500 active:scale-95 transition shrink-0"
                title="日語真人發音朗讀"
              >
                <Volume2 className={`w-6 h-6 ${isPlaying ? 'animate-pulse text-amber-200' : ''}`} />
              </button>
            </div>
          </div>

          {/* Chinese Translation */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
            <div className="text-xs font-semibold text-emerald-400 mb-1">
              繁體中文意思 (台灣地道慣用)
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-300">
              {inputMode === 'ja-to-zh' ? result.translatedText : result.originalText}
            </div>
          </div>

          {/* Vocabulary breakdown */}
          {result.breakdown && result.breakdown.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400">單詞拆解剖析：</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.breakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white text-sm mr-2">{item.word}</span>
                      <span className="text-slate-400 font-mono">({item.reading})</span>
                    </div>
                    <span className="text-emerald-400 font-semibold">{item.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Practical Tourist Advice & Tips */}
          {result.travelTip && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1 text-xs">
                <Compass className="w-4 h-4" /> 日本自由行實用指引與文化叮嚀
              </div>
              <p className="leading-relaxed">{result.travelTip}</p>
            </div>
          )}

          {/* Polite Speech Alternative */}
          {result.politeAlternative && (
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-slate-200 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 font-bold text-rose-400 mb-1 text-xs">
                <MessageSquare className="w-4 h-4" /> 開口問日本人最禮貌口語說法
              </div>
              <p className="leading-relaxed text-white font-medium">
                {result.politeAlternative}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Common Quick Phrases Shortcuts */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-white">常見路牌與情境快速輸入</h3>
          </div>
          <span className="text-xs text-slate-400">點擊直接翻譯</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            '非常口',
            '出口はどこですか？',
            '改札口',
            '精算機',
            'きっぷうりば',
            'おすすめは何ですか？',
            'お会計お願いします',
            '免税できますか？',
            '荷物を預かってもらえますか？',
            '助けてください',
            '一時停止',
            '立入禁止'
          ].map((phrase) => (
            <button
              key={phrase}
              onClick={() => {
                setInputText(phrase);
                handleTranslate(phrase);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700/60 transition active:scale-95"
            >
              {phrase}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
