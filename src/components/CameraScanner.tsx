import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Camera,
  CameraOff,
  RefreshCw,
  Zap,
  ZapOff,
  Sparkles,
  Layers,
  Copy,
  Check,
  Volume2,
  Star,
  MapPin,
  AlertCircle,
  FileText,
  AlignLeft,
} from 'lucide-react';
import { SignItem, PRESET_ROAD_SIGN_SCENES } from '../services/offlineTranslator';
import { deepConvertObjectToTraditional, toTraditionalChinese } from '../utils/chineseConverter';
import { optimizeImageForOcr } from '../utils/imageOptimizer';
import { SignDetailModal } from './SignDetailModal';
import { CambridgeDictionaryCard } from './CambridgeDictionaryCard';
import { parseFullTextLines, syncSignsAndFullText } from '../utils/textParser';
import { useSpeech } from '../hooks/useSpeech';

export interface SpatialCameraSignItem extends SignItem {
  spatialIndex: number;
  spatialZone: 'top' | 'middle' | 'bottom';
  spatialZoneLabel: string;
  isVertical: boolean;
}

interface CameraScannerProps {
  isOnline: boolean;
  onSaveSign: (sign: SignItem) => void;
  savedSignIds: string[];
}

/**
 * 空間排序處理（由上至下、由左至右）
 */
function sortSignsSpatially(signs: SignItem[]): SpatialCameraSignItem[] {
  const sorted = [...signs].sort((a, b) => {
    const boxA = a.box_pct || [50, 50, 60, 60];
    const boxB = b.box_pct || [50, 50, 60, 60];
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

    const centerY = (box[0] + box[2]) / 2;
    const centerX = (box[1] + box[3]) / 2;

    let vLabel = '中段';
    let zone: 'top' | 'middle' | 'bottom' = 'middle';
    if (centerY < 35) {
      vLabel = '頂部';
      zone = 'top';
    } else if (centerY > 65) {
      vLabel = '底部';
      zone = 'bottom';
    }

    let hLabel = '中央';
    if (centerX < 33) hLabel = '左側';
    else if (centerX > 66) hLabel = '右側';

    return {
      ...sign,
      spatialIndex: idx + 1,
      spatialZone: zone,
      spatialZoneLabel: isVertical ? `${vLabel}・${hLabel} (直排)` : `${vLabel}・${hLabel}`,
      isVertical,
    };
  });
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  isOnline,
  onSaveSign,
  savedSignIds,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLineRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const streamRef = useRef<MediaStream | null>(null);
  const isStartingRef = useRef(false);
  const { speak, isPlaying, playingId } = useSpeech();

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);

  // Scanning & Detection State
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedSigns, setDetectedSigns] = useState<SignItem[]>([]);
  const [selectedSign, setSelectedSign] = useState<SignItem | null>(null);
  const [overallSummary, setOverallSummary] = useState<string>('');
  const [importantNotice, setImportantNotice] = useState<string>('');
  const [fullArticleTranslation, setFullArticleTranslation] = useState<string>('');
  const [activePresetIndex, setActivePresetIndex] = useState<number | null>(null);
  const [scanErrorMsg, setScanErrorMsg] = useState<string | null>(null);

  // 全文對照專區控制
  const [textMode, setTextMode] = useState<'pure_fulltext' | 'bilingual' | 'cards'>('pure_fulltext');
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('large');
  const [copiedAll, setCopiedAll] = useState(false);
  const [activeSignId, setActiveSignId] = useState<string | null>(null);
  const [hoveredSignId, setHoveredSignId] = useState<string | null>(null);

  // 空間排序處理與 100% 絕對雙向對齊同步（確保翻譯條目數與字卡數量完全一致）
  const { spatialSigns, formattedFullTextLines } = useMemo(() => {
    const sorted = sortSignsSpatially(detectedSigns);
    const synced = syncSignsAndFullText(sorted, fullArticleTranslation);
    return {
      spatialSigns: synced.signs as SpatialCameraSignItem[],
      formattedFullTextLines: synced.lines,
    };
  }, [detectedSigns, fullArticleTranslation]);

  // Stop Camera Stream (徹底關閉相機，釋放硬體並關閉鏡頭指示燈)
  const stopCamera = useCallback(() => {
    // 1. 關閉 streamRef 中的所有音訊/視訊軌道
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    // 2. 關閉 videoRef 上的任何殘留串流，確保釋放設備
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const vs = videoRef.current.srcObject as MediaStream;
        vs.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {}
        });
      } catch {}
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setTorchOn(false);
  }, []);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setCameraError(null);

    // 先徹底清空任何已存在的軌道
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('您的裝置或瀏覽器不支援相機存取，您可以使用下方的「預設日本真實路牌場景」進行即時體驗。');
      isStartingRef.current = false;
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play error:', playErr);
        }
      }

      // 檢查手電筒補光支援
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = (track?.getCapabilities?.() || {}) as any;
      setTorchSupported(!!capabilities.torch);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      let msg = '無法開啟相機。請確認已授權攝影機權限。';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = '相機存取被拒絕。請在瀏覽器網址列左側允許使用相機。';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = '未偵測到可用的鏡頭設備。';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = '相機已被其他程式或分頁佔用，請關閉後重試。';
      }
      setCameraError(msg);
    } finally {
      isStartingRef.current = false;
    }
  }, [facingMode, stopCamera]);

  // Toggle Camera Power (On/Off)
  const toggleCameraPower = useCallback(() => {
    setIsCameraOn((prev) => {
      const next = !prev;
      if (next) {
        setActivePresetIndex(null);
        setCapturedImage(null);
      }
      return next;
    });
  }, []);

  // 單一責任的 useEffect：宣告式管理相機啟動與徹底銷毀
  useEffect(() => {
    if (isCameraOn && activePresetIndex === null) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isCameraOn, activePresetIndex, facingMode, startCamera, stopCamera]);

  // Switch Camera Facing (Front / Back)
  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  // Toggle Torch Light
  const toggleTorch = async () => {
    if (!stream || !torchSupported) return;
    const track = stream.getVideoTracks()[0];
    try {
      const nextState = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setTorchOn(nextState);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  // Capture Frame from Camera
  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.88);
  };

  // Run Translation on current frame / preset
  const handleScanNow = async () => {
    setIsScanning(true);
    setScanErrorMsg(null);
    let imageBase64 = capturedImage;

    if (!imageBase64) {
      imageBase64 = captureFrame();
      if (!imageBase64) {
        setIsScanning(false);
        return;
      }
      setCapturedImage(imageBase64);
    }

    try {
      const optimizedBase64 = await optimizeImageForOcr(imageBase64);

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
            console.warn('JSON parsing error in camera:', jsonErr);
            throw new Error('伺服器資料解析異常，請點擊「重新辨識」立即重試。');
          }
        } else {
          // 雲端閘道或代理回傳 HTML 網頁
          const rawText = await res.text();
          console.warn('Camera received non-JSON response:', rawText.slice(0, 120));
          throw new Error('AI 視覺模型連線高峰，請稍候 3 秒後點擊「重新辨識」');
        }

        if (!res.ok || data?.isError) {
          throw new Error(data?.error || `辨識服務暫時繁忙 (${res.status})，請點擊重新辨識。`);
        }

        setOverallSummary(toTraditionalChinese(data.summary || '已辨識完成畫面中的日文文字'));
        setImportantNotice(toTraditionalChinese(data.importantNotice || ''));
        setFullArticleTranslation(toTraditionalChinese(data.fullArticleTranslation || ''));
        setDetectedSigns(deepConvertObjectToTraditional(data.signs || []));
      } else {
        // 離線狀態
        if (activePresetIndex !== null) {
          const scene = PRESET_ROAD_SIGN_SCENES[activePresetIndex];
          setOverallSummary(toTraditionalChinese(scene.summary));
          setImportantNotice(toTraditionalChinese(scene.importantNotice || ''));
          setFullArticleTranslation(toTraditionalChinese(scene.fullArticleTranslation || ''));
          setDetectedSigns(deepConvertObjectToTraditional(scene.signs));
        } else {
          setOverallSummary('目前無網路連線');
          setImportantNotice('即時高精度文字辨識需網路連線，或可點選下方預設場景測試。');
          setFullArticleTranslation('');
          setDetectedSigns([]);
          setScanErrorMsg('目前無網路連線，無法進行 AI 視覺文字辨識');
        }
      }
    } catch (err: any) {
      console.warn('Scan API failed:', err);
      setScanErrorMsg(err.message || '辨識發生錯誤，請確認鏡頭清晰度後重試');
      setDetectedSigns([]);
      setFullArticleTranslation('');
    } finally {
      setIsScanning(false);
    }
  };

  // Reset Scan to return to live camera
  const handleResetScan = () => {
    setCapturedImage(null);
    setDetectedSigns([]);
    setOverallSummary('');
    setImportantNotice('');
    setFullArticleTranslation('');
    setActiveSignId(null);
    setHoveredSignId(null);
    setScanErrorMsg(null);
    if (!isCameraOn) {
      setIsCameraOn(true);
      startCamera();
    }
  };

  // Select Preset Scene
  const handleSelectPreset = (index: number) => {
    setActivePresetIndex(index);
    const scene = PRESET_ROAD_SIGN_SCENES[index];
    setCapturedImage(scene.imageUrl);
    setOverallSummary(toTraditionalChinese(scene.summary));
    setImportantNotice(toTraditionalChinese(scene.importantNotice || ''));
    setFullArticleTranslation(toTraditionalChinese(scene.fullArticleTranslation || ''));
    setDetectedSigns(deepConvertObjectToTraditional(scene.signs));
    setScanErrorMsg(null);
  };

  // Return to live camera from preset
  const handleReturnToLiveCamera = () => {
    setActivePresetIndex(null);
    handleResetScan();
  };

  // Focus sign on click
  const handleFocusSign = (id: string, signItem?: SignItem) => {
    setActiveSignId(id);
    if (signItem) {
      setSelectedSign(signItem);
    }
    const el = textLineRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // 一鍵複製全文
  const handleCopyFullText = () => {
    if (formattedFullTextLines.length === 0) return;
    const header = overallSummary ? `【畫面解析總覽】\n${overallSummary}\n\n` : '';
    const notice = importantNotice ? `【重要叮嚀】\n${importantNotice}\n\n` : '';
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Camera Viewport & Live Stream Area (保持完全乾淨，已刪除浮動字塊遮擋) */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 aspect-[4/3] sm:aspect-[16/10] max-h-[560px] border border-slate-800 shadow-2xl flex items-center justify-center">
        {/* Canvas for frame capture (hidden) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Preset Scene Mock Image */}
        {activePresetIndex !== null && capturedImage ? (
          <img
            src={capturedImage}
            alt="Preset Road Sign"
            className="w-full h-full object-contain select-none"
          />
        ) : capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured Frame"
            className="w-full h-full object-contain select-none"
          />
        ) : null}

        {/* Live Video Element - 始終保留在 DOM 中，保證 videoRef.current 永遠不為 null */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover select-none ${
            !isCameraOn || capturedImage || activePresetIndex !== null ? 'hidden' : 'block'
          }`}
        />

        {/* Camera Off Standby View (預設為關閉狀態，待使用者主動開啟) */}
        {!isCameraOn && !capturedImage && activePresetIndex === null && (
          <div className="flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 shadow-inner">
              <Camera className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-200">相機目前為關閉狀態</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                預設未啟動相機鏡頭以節省電力並保護隱私。請點擊下方按鈕開啟鏡頭開始即時辨識。
              </p>
            </div>
          </div>
        )}

        {/* Camera Permission Error Notice */}
        {cameraError && isCameraOn && activePresetIndex === null && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-rose-300 max-w-sm mb-4">
              {cameraError}
            </p>
            <button
              onClick={() => handleSelectPreset(0)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
            >
              載入日本路牌實景體驗
            </button>
          </div>
        )}

        {/* Target Guide Reticle (Shown only when in live aiming state) */}
        {!capturedImage && isCameraOn && !isScanning && (
          <div className="absolute inset-8 pointer-events-none flex flex-col justify-between z-10 opacity-70">
            <div className="flex justify-between items-start">
              <div className="w-8 h-8 border-t-3 border-l-3 border-indigo-400 rounded-tl-lg" />
              <div className="w-8 h-8 border-t-3 border-r-3 border-indigo-400 rounded-tr-lg" />
            </div>
            <div className="flex justify-between items-end">
              <div className="w-8 h-8 border-b-3 border-l-3 border-indigo-400 rounded-bl-lg" />
              <div className="w-8 h-8 border-b-3 border-r-3 border-indigo-400 rounded-br-lg" />
            </div>
          </div>
        )}

        {/* 輕量高亮邊框（已徹底刪除遮擋畫面的浮動字塊，僅在聚焦下方文字時提供乾淨的金色/藍色框線） */}
        {detectedSigns.length > 0 && !isScanning && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            {spatialSigns.map((sign) => {
              const isFocused = activeSignId === sign.id || hoveredSignId === sign.id;
              if (!isFocused) return null;

              const box = sign.box_pct || [20, 15, 34, 85];
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

        {/* Scanning Loading State */}
        {isScanning && (
          <div className="absolute inset-0 z-20 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center text-white">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <Sparkles className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <p className="mt-4 font-bold text-sm text-slate-100">
              {isOnline ? 'AI 正在精準讀取文字並整理為繁體中文全文...' : '正在從離線路牌資料庫進行快速比對...'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              自動精確對齊品項、價格與說明
            </p>
          </div>
        )}

        {/* Top Controls Bar */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          {/* Camera Power Toggle (僅在相機開啟時顯示關閉按鈕) */}
          {isCameraOn && (
            <button
              onClick={toggleCameraPower}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-xs border transition shadow-sm bg-slate-900/80 border-slate-700 text-slate-200 hover:text-rose-300 hover:bg-slate-800"
              title="關閉相機 (節電保護隱私)"
            >
              <CameraOff className="w-3.5 h-3.5 text-rose-400" />
              <span>關閉相機</span>
            </button>
          )}

          {activePresetIndex !== null ? (
            <button
              onClick={handleReturnToLiveCamera}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700 text-xs font-medium text-slate-200 hover:bg-slate-800 backdrop-blur-xs transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              返回即時鏡頭
            </button>
          ) : (
            isCameraOn && (
              <>
                {/* Flip camera */}
                <button
                  onClick={toggleCameraFacing}
                  className="p-2 rounded-full bg-slate-900/80 border border-slate-700 text-white hover:bg-slate-800 backdrop-blur-xs transition"
                  title="切換前後鏡頭"
                >
                  <RefreshCw className="w-4 h-4 text-slate-200" />
                </button>

                {/* Torch */}
                {torchSupported && (
                  <button
                    onClick={toggleTorch}
                    className={`p-2 rounded-full border backdrop-blur-xs transition ${
                      torchOn
                        ? 'bg-amber-500 border-amber-400 text-slate-950'
                        : 'bg-slate-900/80 border-slate-700 text-white hover:bg-slate-800'
                    }`}
                    title="手電筒補光"
                  >
                    {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                  </button>
                )}
              </>
            )
          )}
        </div>

        {/* Bottom Shutter Controls */}
        <div className="absolute bottom-4 inset-x-0 z-20 flex items-center justify-center gap-3 px-4">
          {capturedImage ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetScan}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold hover:bg-slate-800 backdrop-blur-xs transition shadow-lg"
              >
                <RefreshCw className="w-4 h-4 text-indigo-400" />
                重新拍攝
              </button>

              <button
                onClick={handleScanNow}
                disabled={isScanning}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-950/60 transition active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                重新辨識
              </button>
            </div>
          ) : !isCameraOn ? (
            <button
              onClick={toggleCameraPower}
              className="flex items-center gap-2.5 px-7 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-950/80 active:scale-95 transition-all duration-150"
            >
              <Camera className="w-5 h-5" />
              <span>開啟相機鏡頭</span>
            </button>
          ) : (
            <button
              onClick={handleScanNow}
              disabled={isScanning}
              className="flex items-center gap-2.5 px-7 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-indigo-950/80 active:scale-95 transition-all duration-150"
            >
              <Camera className="w-5 h-5 animate-pulse" />
              <span>拍照辨識路牌</span>
            </button>
          )}
        </div>
      </div>

      <div className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>畫面已去除浮動字塊干擾，完整翻譯成果統一呈現在下方「全文對照專區」</span>
      </div>

      {/* Error Notice */}
      {scanErrorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{scanErrorMsg}</span>
          </div>
          <button
            onClick={handleScanNow}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shrink-0 shadow-sm"
          >
            重新嘗試
          </button>
        </div>
      )}

      {/* 2. 即時相機掃描翻譯全文對照專區（完全比照相片辨識翻譯的作法與圖一樣式） */}
      {detectedSigns.length > 0 && (
        <div className="p-5 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5 animate-in fade-in duration-300">
          {/* Header: Title & Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                📜
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                  即時掃描日文翻譯全文對照專區
                </h3>
                <p className="text-xs text-slate-400">
                  依照畫面文字與標價由上而下條理排列，品項與金額一目了然
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
          {overallSummary && (
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs sm:text-sm text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>畫面摘要：{overallSummary}</span>
              </div>
              {importantNotice && (
                <div className="text-amber-300 font-medium pt-1">
                  ⚠️ <strong>重點叮嚀：</strong>{importantNotice}
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
          {textMode === 'pure_fulltext' ? (
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
      )}

      {/* 3. 劍橋字典風格品項字卡專區（如圖劍橋字典樣式，為畫面上的句子或菜單品項提供日語原聲與繁中對照） */}
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
                  即時掃描辨識出的每個句子或菜單品項，均配有標準日本原聲、慢速發音與繁體中文詳細對譯
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
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white">
              日本真實路牌與點餐機場景庫 (點擊即時測試)
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
            完全支援無網路離線
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {PRESET_ROAD_SIGN_SCENES.map((scene, idx) => (
            <button
              key={scene.id}
              onClick={() => handleSelectPreset(idx)}
              className={`p-2.5 rounded-xl text-left border transition ${
                activePresetIndex === idx
                  ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="text-[10px] text-indigo-400 font-bold mb-1 truncate">
                {scene.location}
              </div>
              <div className="text-xs font-extrabold line-clamp-1 text-white">
                {scene.title}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                <span>{scene.signs.length} 條完整全文</span>
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
