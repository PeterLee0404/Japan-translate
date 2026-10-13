import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  if (isInstalled) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 rounded-full">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
        已安裝 PWA
      </span>
    );
  }

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setJustInstalled(true);
      setTimeout(() => setJustInstalled(false), 4000);
    }
  };

  if (isInstallable) {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:from-rose-500 hover:to-amber-500 active:scale-95 transition-all duration-200"
          title="安裝為手機/電腦桌面 App，支援無網路離線翻譯"
        >
          <Download className="w-4 h-4 animate-bounce" />
          <span>安裝 App (支援離線)</span>
        </button>

        {justInstalled && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white text-sm rounded-xl shadow-2xl">
            <CheckCircle className="w-5 h-5" />
            應用程式已成功安裝至您的裝置！離線亦可使用。
          </div>
        )}
      </>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
        >
          <Smartphone className="w-3.5 h-3.5 text-rose-400" />
          <span>iOS 安裝</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 text-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 font-bold text-rose-400 text-base">
                  <Smartphone className="w-5 h-5" />
                  安裝 JapanGo 至 iPhone / iPad
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-xs font-bold text-rose-400">
                    1
                  </span>
                  <div>
                    在 Safari 瀏覽器底部點擊 <Share className="inline w-4 h-4 text-blue-400 mx-1" /> <strong>「分享」</strong> 按鈕
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-xs font-bold text-rose-400">
                    2
                  </span>
                  <div>
                    往下滑動選單並點選 <strong>「加入主畫面」</strong> (Add to Home Screen)
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-xs font-bold text-rose-400">
                    3
                  </span>
                  <div>
                    在右上角點擊 <strong>「新增」</strong>。隨後即可在無網路飛航模式下直接開啟使用！
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 transition active:scale-98"
              >
                我知道了
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  const [showInfo, setShowInfo] = useState(false);

  // Fallback info button
  return (
    <>
      <button
        onClick={() => setShowInfo(true)}
        className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
        title="支援離線安裝 PWA"
      >
        <Download className="w-3.5 h-3.5 text-slate-400" />
        <span>離線 PWA</span>
      </button>

      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 text-slate-100 shadow-2xl">
            <h4 className="font-bold text-base text-rose-400 mb-2">安裝 JapanGo 離線使用</h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              請在瀏覽器網址列點擊「安裝」或「新增至主畫面」圖示，即可將本應用程式安裝至桌面或手機，在無網路環境下也能順暢使用！
            </p>
            <button
              onClick={() => setShowInfo(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-white transition"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </>
  );
};
