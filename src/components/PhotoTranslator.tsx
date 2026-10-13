import React, { useState, useRef, useMemo } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Sparkles,
  Volume2,
  Star,
  Copy,
  Check,
  AlertCircle,
  Filter,
  MapPin,
  Trash2,
  FileText,
  AlignLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { SignItem, PRESET_ROAD_SIGN_SCENES } from '../services/offlineTranslator';
import { deepConvertObjectToTraditional, toTraditionalChinese } from '../utils/chineseConverter';
import { optimizeImageForOcr } from '../utils/imageOptimizer';
import { SignDetailModal } from './SignDetailModal';
import { CambridgeDictionaryCard } from './CambridgeDictionaryCard';
import { parseFullTextLines, syncSignsAndFullText } from '../utils/textParser';
import { useSpeech } from '../hooks/useSpeech';

export interface SpatialSignItem extends SignItem {
  spatialIndex: number;
  spatialZone: 'top' | 'middle' | 'bottom';
  spatialZoneLabel: string;
  zoneName: string;
  isVertical: boolean;
}

interface PhotoTranslatorProps {
  isOnline: boolean;
  onSaveSign: (sign: SignItem) => void;
  savedSignIds: string[];
}

/**
 * 依據圖片上的空間座標百分比（ymin, xmin）判定畫面分區與中文標籤
 */
function getSpatialZone(box?: [number, number, number, number]): {
  zone: 'top' | 'middle' | 'bottom';
  zoneName: string;
  label: string;
} {
  if (!box) {
    return { zone: 'middle', zoneName: '中段核心區域', label: '中央區域' };
  }
  const [ymin, xmin, ymax, xmax] = box;
  const centerY = (ymin + ymax) / 2;
  const centerX = (xmin + xmax) / 2;

  let vLabel = '中段';
  let zone: 'top' | 'middle' | 'bottom' = 'middle';
  let zoneName = '中段核心內容';

  if (centerY < 35) {
    vLabel = '頂部';
    zone = 'top';
    zoneName = '頂部標題與主看板';
  } else if (centerY > 65) {
    vLabel = '底部';
    zone = 'bottom';
    zoneName = '底部備註與說明告示';
  }

  let hLabel = '中央';
  if (centerX < 33) {
    hLabel = '左側';
  } else if (centerX > 66) {
    hLabel = '右側';
  }

  return {
    zone,
    zoneName,
    label: `${vLabel}・${hLabel}`,
  };
}

/**
 * 依據圖片上的幾何位置進行嚴格空間排序（由上至下、由左至右）
 */
function sortSignsSpatially(signs: SignItem[]): SpatialSignItem[] {
  const sorted = [...signs].sort((a, b) => {
    const boxA = a.box_pct || [50, 50, 60, 60];
    const boxB = b.box_pct || [50, 50, 60, 60];
    // Y 軸步進網格吸附（12% 容差，使同一排橫列文字按 X 軸由左至右排序）
    const ySnapA = Math.floor(boxA[0] / 12);
    const ySnapB = Math.floor(boxB[0] / 12);
    if (ySnapA !== ySnapB) {
      return ySnapA - ySnapB;
    }
    return boxA[1] - boxB[1];
  });

  return sorted.map((sign, idx) => {
    const box = sign.box_pct || [20, 15, 35, 85];
    const rawHeight = box[2] - box[0];
    const rawWidth = box[3] - box[1];
    const isVertical = sign.orientation === 'vertical' || rawHeight > rawWidth * 1.35;
    const { zone, zoneName, label } = getSpatialZone(sign.box_pct);

    return {
      ...sign,
      spatialIndex: idx + 1,
      spatialZone: zone,
      spatialZoneLabel: isVertical ? `${label} (直排)` : label,
      zoneName,
      isVertical,
    };
  });
}

export const PhotoTranslator: React.FC<PhotoTranslatorProps> = ({
  isOnline,
  onSaveSign,
  savedSignIds,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textLineRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { speak, isPlaying, playingId } = useSpeech();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [summary, setSummary] = useState<string>('');
  const [importantNotice, setImportantNotice] = useState<string>('');
  const [fullArticleTranslation, setFullArticleTranslation] = useState<string>('');
  const [signs, setSigns] = useState<SignItem[]>([]);
  const [selectedSign, setSelectedSign] = useState<SignItem | null>(null);
  const [activeSignId, setActiveSignId] = useState<string | null>(null);
  const [hoveredSignId, setHoveredSignId] = useState<string | null>(null);

  // 全文對照專區檢視控制
  const [textMode, setTextMode] = useState<'pure_fulltext' | 'bilingual' | 'cards'>('pure_fulltext');
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('large');
  const [copiedAll, setCopiedAll] = useState(false);

  // 空間排序處理與 100% 絕對雙向對齊同步（確保翻譯條目數與字卡數量完全一致）
  const { spatialSigns, formattedFullTextLines } = useMemo(() => {
    const sorted = sortSignsSpatially(signs);
    const synced = syncSignsAndFullText(sorted, fullArticleTranslation);
    return {
      spatialSigns: synced.signs as SpatialSignItem[],
      formattedFullTextLines: synced.lines,
    };
  }, [signs, fullArticleTranslation]);

  // 刪除目前照片
  const handleDeletePhoto = () => {
    setImageUrl(null);
    setImageBase64(null);
    setSigns([]);
    setSummary('');
    setImportantNotice('');
    setFullArticleTranslation('');
    setSelectedSign(null);
    setActiveSignId(null);
    setHoveredSignId(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 滾動連動聚焦
  const handleFocusSign = (id: string, signItem?: SignItem) => {
    setActiveSignId(id);
    if (signItem) {
      setSelectedSign(signItem);
    }
    const lineEl = textLineRefs.current[id];
    if (lineEl) {
      lineEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // 一鍵複製全文
  const handleCopyFullText = () => {
    if (formattedFullTextLines.length === 0) return;
    const header = summary ? `【照片解析總覽】\n${summary}\n\n` : '';
    const notice = importantNotice ? `【重要提示】\n${importantNotice}\n\n` : '';
    const body = formattedFullTextLines.join('\n\n');
    navigator.clipboard.writeText(`${header}${notice}【翻譯全文】\n${body}`);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2200);
  };

  // 朗讀全文日語
  const handleSpeakFullText = () => {
    if (spatialSigns.length === 0) return;
    const textToSpeak = spatialSigns.map((s) => s.japanese).join('。 ');
    speak(textToSpeak);
  };

  // 選擇檔案
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('請選擇標準圖片檔案 (JPG、PNG、WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const rawResult = reader.result as string;
      const optimized = await optimizeImageForOcr(rawResult);
      setImageUrl(optimized);
      setImageBase64(optimized);
      processImage(optimized);
    };
    reader.readAsDataURL(file);
  };

  // 拖曳上傳
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async () => {
        const rawResult = reader.result as string;
        const optimized = await optimizeImageForOcr(rawResult);
        setImageUrl(optimized);
        setImageBase64(optimized);
        processImage(optimized);
      };
      reader.readAsDataURL(file);
    }
  };

  // 執行影像解析與翻譯
  const processImage = async (base64Input: string) => {
    setLoading(true);
    setErrorMsg(null);
    setSigns([]);
    setSummary('');
    setFullArticleTranslation('');

    try {
      const optimizedBase64 = await optimizeImageForOcr(base64Input);

      if (isOnline) {
        const res = await fetch('/api/translate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: optimizedBase64,
            mimeType: 'image/jpeg',
          }),
        });

        const contentType = res.headers.get('content-type') || '';
        let data: any = null;

        if (contentType.includes('application/json')) {
          try {
            data = await res.json();
          } catch (jsonErr) {
            console.warn('JSON parsing error:', jsonErr);
            throw new Error('伺服器資料解析異常，請點擊「重新解析」立即重試。');
          }
        } else {
          // 雲端閘道或代理回傳 HTML 網頁
          const rawText = await res.text();
          console.warn('Server returned non-JSON response:', rawText.slice(0, 120));
          throw new Error('AI 視覺模型連線高峰，請稍候 3 秒後點擊「重新解析」');
        }

        if (!res.ok || data?.isError) {
          throw new Error(data?.error || `辨識服務暫時繁忙 (${res.status})，請點擊重新解析。`);
        }

        setSummary(toTraditionalChinese(data.summary || '已辨識完成照片中的日文字'));
        setImportantNotice(toTraditionalChinese(data.importantNotice || ''));
        setFullArticleTranslation(toTraditionalChinese(data.fullArticleTranslation || ''));
        setSigns(deepConvertObjectToTraditional(data.signs || []));
      } else {
        // 離線狀態
        setSummary('目前無網路連線');
        setImportantNotice('照片高精度辨識翻譯需連接網路，請連線後重試。');
        setFullArticleTranslation('');
        setSigns([]);
        setErrorMsg('目前無網路連線，無法進行 AI 視覺文字辨識');
      }
    } catch (err: any) {
      console.warn('Image translation error:', err);
      setErrorMsg(err.message || '辨識發生錯誤，請確認照片清晰度後重試');
      setSigns([]);
      setFullArticleTranslation('');
    } finally {
      setLoading(false);
    }
  };

  // 載入預設場景
  const handleLoadSample = (index: number) => {
    const scene = PRESET_ROAD_SIGN_SCENES[index];
    setImageUrl(scene.imageUrl);
    setImageBase64(scene.imageUrl);
    setSummary(toTraditionalChinese(scene.summary));
    setImportantNotice(toTraditionalChinese(scene.importantNotice || ''));
    setFullArticleTranslation(toTraditionalChinese(scene.fullArticleTranslation || ''));
    setSigns(deepConvertObjectToTraditional(scene.signs));
    setErrorMsg(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Upload Zone (shown when no image is loaded) */}
      {!imageUrl ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="relative rounded-3xl border-2 border-dashed border-slate-700 hover:border-indigo-400 bg-slate-900/60 p-8 sm:p-14 text-center cursor-pointer transition-all duration-200 group shadow-xl"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition duration-200 border border-indigo-500/20">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-xl font-bold text-white mb-2">
            點擊此處上傳 或 拖曳日本街景照片至此
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mb-5 leading-relaxed">
            支援居酒屋菜單、路牌、地鐵看板！照片上將保持乾淨無字塊阻擋，完整翻譯成果將統一於照片下方以清晰全文專區呈現。
          </p>
          <button className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-950/50 transition">
            選擇照片檔案
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Action Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center gap-2 flex-wrap">
              {/* 刪除照片按鈕 */}
              <button
                onClick={handleDeletePhoto}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-300 border border-rose-500/40 hover:border-rose-400 transition shadow-sm"
                title="刪除目前照片並返回上傳區"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>刪除照片</span>
              </button>

              {/* 更換照片按鈕 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
              >
                <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
                <span>更換照片</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>已解析 {spatialSigns.length} 處日文語句</span>
              </div>
              <button
                onClick={() => imageBase64 && processImage(imageBase64)}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-400 border border-slate-700 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>重新解析</span>
              </button>
            </div>
          </div>

          {/* 1. 照片展示區：保持完全乾淨，已刪除類似圖二之遮擋字塊 */}
          <div className="space-y-2">
            <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center max-h-[560px]">
              <img
                src={imageUrl}
                alt="Uploaded signage"
                className="max-h-[560px] w-auto max-w-full object-contain select-none"
              />

              {/* Loading state */}
              {loading && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center text-white z-30">
                  <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <p className="mt-3 text-sm font-bold text-center px-4">
                    {isOnline
                      ? 'AI 正在精準讀取文字並整理為繁體中文全文...'
                      : '離線比對日本路牌字庫...'}
                  </p>
                </div>
              )}

              {/* 精簡非侵入式邊框高亮（僅在點選或懸停下方全文句子時顯示輕量細線框，絕無遮擋文字塊） */}
              {!loading && (
                <div className="absolute inset-0 pointer-events-none">
                  {spatialSigns.map((sign) => {
                    const box = sign.box_pct || [20, 15, 32, 85];
                    const isFocused = activeSignId === sign.id || hoveredSignId === sign.id;
                    if (!isFocused) return null;

                    const top = Math.max(0, Math.min(95, box[0]));
                    const left = Math.max(0, Math.min(95, box[1]));
                    const height = Math.max(4, Math.min(100 - top, box[2] - box[0]));
                    const width = Math.max(4, Math.min(100 - left, box[3] - box[1]));

                    return (
                      <div
                        key={sign.id}
                        style={{
                          top: `${top}%`,
                          left: `${left}%`,
                          width: `${width}%`,
                          height: `${height}%`,
                        }}
                        className="absolute border-2 border-amber-400 bg-amber-400/10 rounded-md shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse"
                      />
                    );
                  })}
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>照片已去除浮動字塊遮擋，完整翻譯成果請查閱下方「全文對照專區」</span>
            </div>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
              {imageBase64 && (
                <button
                  onClick={() => processImage(imageBase64)}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shrink-0 shadow-sm"
                >
                  重新嘗試
                </button>
              )}
            </div>
          )}

          {/* 2. 放在照片正下方的「全文對照專區」（完全比照圖一之乾淨篇章文字框呈現） */}
          <div className="p-5 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
            {/* Header: Title & Action Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  📜
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                    照片日文翻譯全文對照專區
                  </h3>
                  <p className="text-xs text-slate-400">
                    依照照片上的日文語句由上而下條理排列，清晰明瞭好讀
                  </p>
                </div>
              </div>

              {/* Quick Actions: 複製全文 / 朗讀 / 字級 */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setFontSize(fontSize === 'normal' ? 'large' : 'normal')}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition border border-slate-700"
                  title="切換字體大小"
                >
                  {fontSize === 'large' ? '字體：大' : '字體：標準'}
                </button>
                <button
                  onClick={handleCopyFullText}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition shadow-sm"
                  title="複製整篇繁體中文翻譯全文"
                >
                  {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAll ? '已複製全文' : '複製全文'}</span>
                </button>
                <button
                  onClick={handleSpeakFullText}
                  disabled={isPlaying}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-950/40 transition"
                  title="朗讀全篇日語"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>全文朗讀</span>
                </button>
              </div>
            </div>

            {/* 場景說明與重點提示 */}
            {summary && (
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs sm:text-sm text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>畫面說明：{summary}</span>
                </div>
                {importantNotice && (
                  <div className="text-amber-300 font-medium pt-1">
                    ⚠️ <strong>重要叮嚀：</strong>{importantNotice}
                  </div>
                )}
              </div>
            )}

            {/* 檢視模式切換 */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-fit">
              <button
                onClick={() => setTextMode('pure_fulltext')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  textMode === 'pure_fulltext'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                繁中全文框（如圖一樣式）
              </button>
              <button
                onClick={() => setTextMode('bilingual')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  textMode === 'bilingual'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                日繁雙語逐句對照
              </button>
              <button
                onClick={() => setTextMode('cards')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  textMode === 'cards'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                詳細解說卡片
              </button>
            </div>

            {/* ★★★ 全文框本體（精確比照圖一之紫色框線、端點控制節點與連續純文字呈現） ★★★ */}
            {formattedFullTextLines.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                尚無翻譯全文，請於上方上傳照片
              </div>
            ) : textMode === 'pure_fulltext' ? (
              /* 模式 A：如圖一樣式的純文字全文框 */
              <div className="relative rounded-2xl border-2 border-indigo-500/80 bg-slate-950/80 p-5 sm:p-7 shadow-xl select-text transition-all">
                {/* 四角白色端點節點 (完全還原圖一之標註框特徵) */}
                <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs shadow-sm" />
                <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs shadow-sm" />
                <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs shadow-sm" />
                <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs shadow-sm" />

                {/* 條理化全文文字內容 */}
                <div className="space-y-3 font-sans">
                  {formattedFullTextLines.map((line, idx) => {
                    const matchedSign = spatialSigns[idx];
                    const isFocused = matchedSign && (activeSignId === matchedSign.id || hoveredSignId === matchedSign.id);

                    return (
                      <div
                        key={idx}
                        ref={(el) => {
                          if (matchedSign) {
                            textLineRefs.current[matchedSign.id] = el;
                          }
                        }}
                        onClick={() => matchedSign && handleFocusSign(matchedSign.id, matchedSign)}
                        onMouseEnter={() => matchedSign && setHoveredSignId(matchedSign.id)}
                        onMouseLeave={() => setHoveredSignId(null)}
                        className={`p-2.5 rounded-xl transition duration-150 cursor-pointer ${
                          isFocused
                            ? 'bg-indigo-500/20 text-white ring-1 ring-indigo-400'
                            : 'hover:bg-slate-900/60 text-slate-100'
                        }`}
                      >
                        <p
                          className={`leading-relaxed tracking-wide font-medium ${
                            fontSize === 'large' ? 'text-base sm:text-lg font-bold' : 'text-sm sm:text-base'
                          }`}
                        >
                          {line}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : textMode === 'bilingual' ? (
              /* 模式 B：日繁雙語逐句對照 */
              <div className="relative rounded-2xl border-2 border-indigo-500/70 bg-slate-950/80 p-4 sm:p-6 shadow-xl divide-y divide-slate-800/80">
                {spatialSigns.map((sign, idx) => {
                  const isFocused = activeSignId === sign.id || hoveredSignId === sign.id;
                  return (
                    <div
                      key={sign.id}
                      ref={(el) => {
                        textLineRefs.current[sign.id] = el;
                      }}
                      onClick={() => handleFocusSign(sign.id, sign)}
                      onMouseEnter={() => setHoveredSignId(sign.id)}
                      onMouseLeave={() => setHoveredSignId(null)}
                      className={`py-3 first:pt-0 last:pb-0 px-3 rounded-xl transition cursor-pointer ${
                        isFocused ? 'bg-indigo-500/20' : 'hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-800">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                          {sign.spatialZoneLabel}
                        </span>
                        {sign.isVertical && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 font-mono">
                            直排
                          </span>
                        )}
                      </div>

                      {/* 日文原文 */}
                      <div className="text-xs sm:text-sm text-slate-400 font-medium">
                        <span>{sign.japanese}</span>
                        {sign.hiragana && <span className="ml-1 text-slate-500">({sign.hiragana})</span>}
                      </div>

                      {/* 繁體中文全譯與價格 */}
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span
                          className={`font-black text-emerald-400 ${
                            fontSize === 'large' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
                          }`}
                        >
                          {sign.chinese}
                        </span>
                        {sign.price && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-bold text-xs border border-amber-500/40">
                            💰 {sign.price}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* 模式 C：詳細卡片模式 */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {spatialSigns.map((sign, idx) => {
                  const isFav = savedSignIds.includes(sign.id);
                  const isFocused = activeSignId === sign.id || hoveredSignId === sign.id;
                  return (
                    <div
                      key={sign.id}
                      onClick={() => handleFocusSign(sign.id, sign)}
                      onMouseEnter={() => setHoveredSignId(sign.id)}
                      onMouseLeave={() => setHoveredSignId(null)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-2.5 ${
                        isFocused
                          ? 'bg-slate-850 border-amber-400 shadow-md ring-1 ring-amber-400'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-slate-800/80">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-300 font-mono font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-[11px] text-slate-400">{sign.spatialZoneLabel}</span>
                          </div>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => speak(sign.japanese)}
                              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                              title="朗讀"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onSaveSign(sign)}
                              className={`p-1 rounded-lg ${isFav ? 'text-amber-400' : 'text-slate-400 hover:text-white'}`}
                              title="收藏"
                            >
                              <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap mt-2">
                          <span className="text-base font-extrabold text-emerald-400">
                            {sign.chinese}
                          </span>
                          {sign.price && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-bold text-xs border border-amber-500/40">
                              💰 {sign.price}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-300 font-bold mt-0.5">
                          {sign.japanese}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. 劍橋字典風格品項字卡專區（如圖劍橋字典樣式，為相片上的句子或菜單品項提供日語原聲與繁中對照） */}
      {spatialSigns.length > 0 && (
        <div className="p-5 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold text-lg">
                📖
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                  劍橋字典風・日語原聲與繁中品項字卡
                </h3>
                <p className="text-xs text-slate-400">
                  相片上辨識出的每個句子或菜單品項，均配有標準日本原聲、慢速發音與繁體中文詳細對譯
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full w-fit">
              共 {spatialSigns.length} 個字卡項目
            </span>
          </div>

          <div className="space-y-4">
            {spatialSigns.map((sign, idx) => (
              <CambridgeDictionaryCard
                key={sign.id || idx}
                sign={sign}
                index={idx}
                isFavorite={savedSignIds.includes(sign.id)}
                onToggleFavorite={onSaveSign}
                onSpeak={speak}
                playingId={playingId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Preset Road Signs Gallery for quick test */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm sm:text-base font-bold text-white">
              沒有照片？立即載入日本自由行實景範例體驗
            </h3>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">點擊任一場景即可載入</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PRESET_ROAD_SIGN_SCENES.map((scene, idx) => (
            <button
              key={scene.id}
              onClick={() => handleLoadSample(idx)}
              className="p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/60 text-left transition group"
            >
              <div className="aspect-[16/10] rounded-xl overflow-hidden mb-2 bg-slate-950 flex items-center justify-center border border-slate-800">
                <img
                  src={scene.imageUrl}
                  alt={scene.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                />
              </div>
              <div className="text-[10px] font-bold text-indigo-400 truncate">
                {scene.location}
              </div>
              <div className="text-xs font-extrabold text-white line-clamp-1">
                {scene.title}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {scene.signs.length} 條完整全文對譯
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      <SignDetailModal
        sign={selectedSign}
        onClose={() => setSelectedSign(null)}
        isFavorite={selectedSign ? savedSignIds.includes(selectedSign.id) : false}
        onToggleFavorite={onSaveSign}
      />
    </div>
  );
};
