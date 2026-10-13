import React from 'react';
import { Volume2 } from 'lucide-react';
import { SignItem } from '../services/offlineTranslator';

interface CambridgeDictionaryCardProps {
  sign: SignItem;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: (sign: SignItem) => void;
  onSpeak: (text: string, rate?: number, id?: string) => void;
  playingId?: string | null;
}

/**
 * 依據類別取得劍橋字典詞性、領域與等級標記
 */
function getCategoryMeta(sign: SignItem) {
  switch (sign.category) {
    case 'dining':
      return {
        pos: 'noun',
        code: 'C/U',
        domain: 'MENU / DINING',
        level: 'B1',
        label: '餐飲品項',
      };
    case 'road_sign':
    case 'transit':
      return {
        pos: 'noun',
        code: 'C',
        domain: 'TRANSIT / SIGN',
        level: 'A2',
        label: '交通路牌',
      };
    case 'shopping':
      return {
        pos: 'noun',
        code: 'C',
        domain: 'SHOPPING / GOODS',
        level: 'A2',
        label: '商品購物',
      };
    case 'warning':
      return {
        pos: 'noun / phrase',
        code: 'NOTICE',
        domain: 'SAFETY / CAUTION',
        level: 'B1',
        label: '警示告示',
      };
    default:
      return {
        pos: 'noun / phrase',
        code: 'C',
        domain: 'TRAVEL',
        level: 'A2',
        label: '生活旅遊',
      };
  }
}

export const CambridgeDictionaryCard: React.FC<CambridgeDictionaryCardProps> = ({
  sign,
  index,
  isFavorite,
  onToggleFavorite,
  onSpeak,
  playingId,
}) => {
  const categoryMeta = getCategoryMeta(sign);
  const stdId = `${sign.id}-std`;
  const slowId = `${sign.id}-slow`;

  // 清除品項名稱中附帶的金額數字與貨幣符號，確保字卡純粹呈現菜單品項或句子
  const cleanJapanese = sign.japanese
    .replace(/[\s(（]*[¥￥]?\d+[,，\d]*\s*(円|日圓|日元)[)）]*/g, '')
    .trim() || sign.japanese;

  const cleanChinese = sign.chinese
    .replace(/[\s(（]*[¥￥]?\d+[,，\d]*\s*(円|日圓|日元)[)）]*/g, '')
    .replace(/：?[¥￥]?\d+[,，\d]*\s*(円|日圓|日元)/g, '')
    .trim() || sign.chinese;

  return (
    <div className="rounded-3xl border-2 border-slate-700/80 bg-slate-900/90 p-5 sm:p-7 shadow-xl hover:border-indigo-500/60 transition-all text-slate-100">
      {/* 1. 頂部主單字 / 句子品項名稱（純粹呈現菜單品項或句子，無金額） */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {cleanJapanese}
        </h2>
        <span className="text-xs font-mono text-slate-400">
          品項 #{index + 1}
        </span>
      </div>

      {/* 詞性標記（如：noun [C]） */}
      <div className="text-slate-400 italic text-sm mt-0.5 flex items-center gap-2 flex-wrap">
        <span>{categoryMeta.pos}</span>
        <span className="font-sans not-italic text-slate-400 font-semibold">
          [{categoryMeta.code}]
        </span>
      </div>

      {/* 音標與雙語發音按鈕（仿照劍橋字典 UK / US 雙喇叭，此處為日語標準原聲 與 慢速慢念發音） */}
      <div className="flex items-center gap-5 text-xs font-mono text-slate-300 mt-2.5 flex-wrap">
        {/* 標準日本原聲 */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
          <span className="font-extrabold text-indigo-400">JP</span>
          <button
            onClick={() => onSpeak(cleanJapanese, 0.95, stdId)}
            className="p-1 rounded-full hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 transition"
            title="點擊聆聽日本原聲標準朗讀"
          >
            <Volume2
              className={`w-4 h-4 ${
                playingId === stdId ? 'animate-pulse text-amber-400' : ''
              }`}
            />
          </button>
          <span className="text-slate-300">
            /{sign.hiragana || cleanJapanese}/
          </span>
        </div>

        {/* 慢速清晰拼音發音 */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
          <span className="font-extrabold text-rose-400">SLOW</span>
          <button
            onClick={() => onSpeak(cleanJapanese, 0.72, slowId)}
            className="p-1 rounded-full hover:bg-slate-800 text-rose-400 hover:text-rose-300 transition"
            title="點擊慢速朗讀，適合跟讀開口"
          >
            <Volume2
              className={`w-4 h-4 ${
                playingId === slowId ? 'animate-pulse text-amber-400' : ''
              }`}
            />
          </button>
          <span className="text-slate-400">
            /{sign.romaji || ''}/
          </span>
        </div>
      </div>

      {/* 2. 劍橋字典經典金黃色分隔橫線（完全對齊附圖） */}
      <div className="w-full h-[2px] bg-amber-400 my-4" />

      {/* 3. 次標題區塊與「Add to word list」黃色膠囊按鈕 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm font-bold text-indigo-400 flex items-center gap-1.5 flex-wrap">
          <span className="text-white font-extrabold">{cleanJapanese}</span>
          <span className="italic text-xs font-normal text-slate-400">
            {categoryMeta.pos} [{categoryMeta.code}]
          </span>
          <span className="text-xs text-indigo-300 font-mono font-bold">
            ({categoryMeta.domain})
          </span>
        </div>

        {/* 劍橋字典代表性的黃色 Add to word list 膠囊按鈕 */}
        <button
          onClick={() => onToggleFavorite(sign)}
          className={`px-3.5 py-1 rounded-full text-xs font-black transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
            isFavorite
              ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300'
              : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
          }`}
          title={isFavorite ? '已在單字庫中' : '加入單字庫'}
        >
          <span>{isFavorite ? '已在單字本 ✓' : 'Add to word list'}</span>
          <span className="text-[13px]">📑</span>
        </button>
      </div>

      {/* 4. 等級標章（如圖中深藍底白字的 A2 圓膠囊） */}
      <div className="mt-3 flex items-center gap-2">
        <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-700 text-white font-mono font-black text-xs flex items-center justify-center shadow-inner">
          {categoryMeta.level}
        </span>
        <span className="text-xs text-slate-400 font-medium">
          {sign.orientation === 'vertical' ? '縱書直排' : '橫排'}・{categoryMeta.label}
        </span>
      </div>

      {/* 5. ★★★ 劍橋字典經典亮藍色繁體中文翻譯（完全對齊附圖之亮藍色括號譯名，刪除多餘文字） ★★★ */}
      <div className="mt-3 text-sky-400 font-semibold text-base sm:text-lg tracking-wide leading-relaxed">
        （ {cleanChinese} ）
      </div>

      {/* 6. 旅客實用指引（若有） */}
      {sign.actionTip && (
        <div className="mt-2.5 text-xs text-slate-400 italic bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          💡 <strong>旅客實用指引：</strong>{sign.actionTip}
        </div>
      )}
    </div>
  );
};
