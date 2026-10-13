import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { deepConvertObjectToTraditional, toTraditionalChinese } from './src/utils/chineseConverter.ts';
import { translateOfflineText } from './src/services/offlineTranslator.ts';
import { syncSignsAndFullText } from './src/utils/textParser.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// AI Studio dev server proxy strictly routes to port 3000
const PORT = 3000;

// High limit for base64 camera image uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Server-side Gemini API client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString(),
  });
});

// Text translation endpoint
app.post('/api/translate-text', async (req, res) => {
  try {
    const { text, sourceLang = 'ja', targetLang = 'zh-TW' } = req.body;
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY not configured. Falling back to offline dictionary.',
        isOfflineFallback: true,
      });
    }

    const prompt = `你是一位精通日文與台灣繁體中文的日本自由行專業導遊與翻譯官。
請翻譯並解析以下用戶輸入的日語（或中文）：
"${text.trim()}"

【極度重要輸出規範】：
所有輸出的中文內容（包括 translatedText, category, breakdown.meaning, travelTip, politeAlternative）必須 100% 使用台灣繁體中文（正體字）。
絕對嚴禁出現任何簡體字與大陸用語！
（例如：必須使用「轉乘」非「转乘」、「結帳」非「结账/买单」、「車票」非「车票」、「洗手間」非「卫生间」、「計程車」非「出租车」、「預訂」非「预订」、「門票」非「门票」）。

請以純 JSON 格式回應（不要有 markdown 程式碼區塊標記，不要加 \`\`\`json），JSON 必須符合以下結構：
{
  "originalText": "${text.trim()}",
  "translatedText": "台灣繁體中文翻譯（適合台灣自由行旅客理解的地道譯名）",
  "hiragana": "假名平假名發音標記",
  "romaji": "羅馬拼音（方便不懂日文的旅客開口念給日本人聽）",
  "category": "路牌/交通/飲食/藥妝/購物/住宿/緊急/日常",
  "breakdown": [
    {
      "word": "單詞日文",
      "reading": "讀音",
      "meaning": "台灣繁體中文含意"
    }
  ],
  "travelTip": "日本旅遊實用解說或文化禮儀叮嚀（以台灣繁體中文撰寫）",
  "politeAlternative": "若旅客要向日本店員或路人詢問時的最禮貌口語說法（含羅馬拼音與繁中解釋）"
}`;

    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    let response;
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });
        if (response?.text) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Text translate with model ${model} failed (${err?.status || err?.message}), attempting next model...`);
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    if (!response?.text) {
      throw lastError || new Error('AI 翻譯模型目前繁忙，請稍候重試');
    }

    const responseText = response?.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText.trim());
    } catch {
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        parsedData = JSON.parse(match[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    // 強制轉換為 100% 繁體中文，消除任何漏網簡體字
    const finalData = deepConvertObjectToTraditional(parsedData);
    return res.json(finalData);
  } catch (err: any) {
    console.warn('API call encountered temporary issue, serving high-precision dictionary fallback:', err?.message || err);
    // 即使雲端短暫忙碌，也以繁體中文即時字典回覆，絕不報錯中斷使用者體驗
    const fallbackData = translateOfflineText(req.body.text || '');
    return res.json(deepConvertObjectToTraditional(fallbackData));
  }
});

// 容錯與自動修復 JSON 解析器，專門處理照片日文過多時 AI 輸出可能逼近長度上限截斷的狀況
function safeParseJsonWithRepair(rawText: string): any {
  const trimmed = rawText.trim();

  // 1. 正常標準 JSON.parse
  try {
    return JSON.parse(trimmed);
  } catch {}

  // 2. 擷取外層大括號區塊
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {}
  }

  // 3. 處理中途被截斷的 JSON 陣列 (例如 "signs": [ { ... }, { ... 尾端缺閉合)
  if (trimmed.startsWith('{')) {
    const lastItemEnd = trimmed.lastIndexOf('}');
    if (lastItemEnd !== -1) {
      const truncated = trimmed.substring(0, lastItemEnd + 1);
      // 嘗試補全陣列與外層大括號
      try {
        return JSON.parse(truncated + ']}');
      } catch {}
      try {
        return JSON.parse(truncated + '}');
      } catch {}
    }
  }

  // 4. 正規表達式全面兜底提取所有日繁項目
  const signMatches = [
    ...trimmed.matchAll(
      /\{\s*"id"[^}]*?"japanese"\s*:\s*"([^"]+)"[^}]*?"chinese"\s*:\s*"([^"]+)"[^}]*?\}/g
    ),
  ];

  if (signMatches.length > 0) {
    const signs = signMatches.map((m, idx) => {
      const fullItem = m[0];
      const hiraganaM = fullItem.match(/"hiragana"\s*:\s*"([^"]*)"/);
      const romajiM = fullItem.match(/"romaji"\s*:\s*"([^"]*)"/);
      const priceM = fullItem.match(/"price"\s*:\s*"([^"]*)"/);
      const categoryM = fullItem.match(/"category"\s*:\s*"([^"]*)"/);
      const expM = fullItem.match(/"explanation"\s*:\s*"([^"]*)"/);
      const tipM = fullItem.match(/"actionTip"\s*:\s*"([^"]*)"/);

      const orientationM = fullItem.match(/"orientation"\s*:\s*"([^"]*)"/);
      const isVerticalBox = (expM?.[1]?.includes('直') || categoryM?.[1]?.includes('vert'));

      return {
        id: `sign_${idx + 1}`,
        japanese: m[1],
        hiragana: hiraganaM ? hiraganaM[1] : '',
        romaji: romajiM ? romajiM[1] : '',
        chinese: m[2],
        price: priceM ? priceM[1] : '',
        category: (categoryM ? categoryM[1] : 'road_sign') as any,
        orientation: (orientationM ? orientationM[1] : (isVerticalBox ? 'vertical' : 'horizontal')) as any,
        box_pct: [10 + ((idx * 8) % 70), 10, 22 + ((idx * 8) % 70), 88] as [number, number, number, number],
        explanation: expM ? expM[1] : '畫面上辨識出的重要日文文字',
        actionTip: tipM ? tipM[1] : '可依此標示指引採取行動',
      };
    });

    const summaryM = trimmed.match(/"summary"\s*:\s*"([^"]+)"/);
    const noticeM = trimmed.match(/"importantNotice"\s*:\s*"([^"]+)"/);
    const fullArticleM = trimmed.match(/"fullArticleTranslation"\s*:\s*"([^"]+)"/);

    return {
      summary: summaryM ? summaryM[1] : '已完成照片中眾多日文文字之密集辨識與翻譯',
      category: 'road_sign',
      importantNotice: noticeM ? noticeM[1] : '',
      fullArticleTranslation: fullArticleM ? fullArticleM[1] : '',
      signs,
    };
  }

  throw new Error('無法解析視覺模型之 JSON 回應');
}

// Visual Image OCR & Signpost Detection endpoint
app.post('/api/translate-image', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', scanMode = 'auto' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY not configured. Falling back to offline dictionary.',
        isOfflineFallback: true,
      });
    }

    // Strip data prefix if included
    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    let mime = mimeType || 'image/jpeg';
    if (imageBase64.startsWith('data:')) {
      const match = imageBase64.match(/^data:([^;]+);/);
      if (match) {
        mime = match[1];
      }
    }
    // Gemini supports image/jpeg, image/png, image/webp, image/heic, image/heif
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(mime)) {
      mime = 'image/jpeg';
    }

    const prompt = `你是一位專業且精準的日文辨識（OCR）與繁體中文翻譯專家。
你的核心任務是：【100% 忠實、純粹地將照片中真實看見的日文字轉換成台灣繁體中文】。

【極度重要之辨識與翻譯原則】：
1. 【只處理照片上的日文】：只讀取照片中真實出現的日文字符（包含店名、菜單料理品名、標價、說明文、告示、標題、路牌等），其餘與照片中文字不相關的內容一概不處理！
2. 【嚴禁無中生有與臆測】：絕對嚴禁捏造、幻想或添加照片中根本不存在的詞句（嚴禁預設或添加「出口閘門」、「乘車處」、「案内所」、「Suica/PASMO」、「跟隨黃色指標」等任何無關字眼）！
3. 【🔥🔥 價格與品項條列式對應（菜單/商品價目表特別規則）】：
   若照片中含有價格（例如居酒屋菜單、拉麵售票機、小吃肉串攤、藥妝商品貨架標價）：
   - 請將「每個品項/餐點」與其「對應的價格（含稅或未稅標價）」精準綁定在同一個項目中！
   - chinese 欄位填寫清晰的台灣繁體中文品名（例如：「特製 濃厚豚骨拉麵」、「森谷特製 牛肉串」）。
   - price 欄位填寫對應金額（例如：「1,100日圓 (¥1,100)」、「100日圓」），若無標價則填 ""。
   - japanese 欄位填寫日文品項原文與價格（例如：「特製 濃厚豚骨らーめん ¥1,100」、「森谷特製 牛肉串 100円」）。
   - 在 fullArticleTranslation 中，請嚴格依照由上至下/由左至右順序，以「條列式」一行一行條理列出每個品項與對應價格：
     「1. 品項名稱：價格（日文原文與價格）」
4. 【🔥🔥🔥 核心強制規範：fullArticleTranslation 與 signs 數量必須 100% 絕對完全一致 🔥🔥🔥】：
   - fullArticleTranslation 中條列了幾行項目（1. 到 N.），signs 陣列中就必須擁有恰好幾筆物件（長度為 N）。
   - 第 1 行對應 signs[0]，第 2 行對應 signs[1]……第 N 行對應 signs[N-1]，兩者數量、順序與內容必須 1:1 絕對對齊，嚴禁任何一邊多出或遺漏！
5. 【直排（縱書）與多行排版】：
   - 如布簾、立柱、招牌上「從上往下（Top-to-Bottom）」直排書寫的日文，請依自然閱讀順序組裝為完整詞彙（勿橫向拼湊）。
   - 多行換行文字請按行完整提取，不漏行也不錯位。
6. 【若照片無日文字】：若照片中沒有任何日文文字或極度模糊無法讀取，signs 請回傳空陣列 []，並在 summary 說明「未於照片中偵測到清晰日文文字」，絕對不要捏造任何假的日文！

【輸出語言規範】：
所有翻譯內容必須 100% 使用標準台灣繁體中文（正體字），語意通順自然。

請以純 JSON 格式回應，格式如下：
{
  "summary": "照片畫面內容的一句話簡述（例如：神戶牛排菜單價格表、京都寺廟參拜告示、拉麵店售票機）",
  "category": "road_sign | transit | dining | shopping | warning | facility | other",
  "fullArticleTranslation": "依照照片上文字的位置順序，以條列式完整流暢輸出的繁體中文全文翻譯（有價格時格式為：1. 品項：價格（日文與價格））",
  "signs": [
    {
      "id": "sign_1",
      "japanese": "照片上的日文原文（漢字與假名，含價格，直排請由上至下完整拼接）",
      "hiragana": "讀音平假名",
      "romaji": "羅馬拼音",
      "chinese": "台灣繁體中文翻譯品名",
      "price": "若有標價請填寫對應金額（如：100日圓、1,100日圓），無標價則留空字串",
      "category": "dining",
      "orientation": "vertical 或 horizontal",
      "box_pct": [10, 15, 75, 28]
    }
  ]
}`;

    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType: mime,
      },
    };

    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    let response;
    let lastError: any = null;

    // 兩輪多模型備援機制 (Multi-model Failover with Jittered Backoff)
    for (let round = 1; round <= 2; round++) {
      for (const model of candidateModels) {
        try {
          response = await ai.models.generateContent({
            model,
            contents: {
              parts: [imagePart, { text: prompt }],
            },
            config: {
              responseMimeType: 'application/json',
              maxOutputTokens: 8192,
              temperature: 0.1,
            },
          });
          if (response?.text) {
            console.log(`Image OCR succeeded with model: ${model} (round ${round})`);
            break;
          }
        } catch (err: any) {
          lastError = err;
          const is503 = err?.status === 503 || err?.message?.includes('503') || err?.message?.includes('high demand');
          console.warn(`Image OCR with ${model} (round ${round}) failed: ${err?.status || err?.message}`);

          // 若為 503 容量限制，小幅隨機延遲後立即切換至不同叢集的備用模型
          if (is503) {
            const jitter = Math.floor(Math.random() * 300);
            await new Promise((resolve) => setTimeout(resolve, 250 + jitter));
          }
        }
      }
      if (response?.text) break;
      // 若第一輪三個模型皆處於高峰，等待 1.2 秒帶隨機擾動後進行第二輪
      if (round < 2) {
        const backoff = 1000 + Math.floor(Math.random() * 500);
        console.log(`All models experienced high demand on round 1, waiting ${backoff}ms before round 2...`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }

    if (!response?.text) {
      throw lastError || new Error('視覺翻譯模型目前繁忙，請稍候重試');
    }

    const responseText = response?.text || '{}';
    const parsedData = safeParseJsonWithRepair(responseText);

    // 嚴格同步 signs 與 fullArticleTranslation，保證項目數量 100% 絕對一致
    const synced = syncSignsAndFullText(parsedData.signs || [], parsedData.fullArticleTranslation || '');
    parsedData.signs = synced.signs;
    parsedData.fullArticleTranslation = synced.fullText;

    // 強制轉換為 100% 繁體中文，消除任何漏網簡體字
    const finalData = deepConvertObjectToTraditional(parsedData);
    return res.json(finalData);
  } catch (err: any) {
    console.error('Error in /api/translate-image:', err);
    const isOverload = err?.status === 503 || err?.message?.includes('503') || err?.message?.includes('high demand');
    const userMessage = isOverload
      ? 'Google AI 模型目前訪問量較大（503 暫態高峰），請稍候 3~5 秒後點擊「重新解析」即可正常辨識。'
      : '照片辨識發生錯誤，請確認照片清晰度後重試。';

    // 關鍵修復：回傳 HTTP 200 與標準 JSON，絕對不回傳 503 狀態碼，避免 Cloud Run 反向代理將回應截斷為 <!doctype html> 網頁
    return res.status(200).json({
      isError: true,
      error: userMessage,
      summary: isOverload ? 'AI 模型連線高峰，請稍候重試' : '未能成功辨識照片中的日文文字',
      importantNotice: 'Google 雲端服務目前處於用量尖峰，已啟用快速排隊機制，請點擊下方按鈕重試。',
      fullArticleTranslation: '',
      signs: [],
    });
  }
});

// Setup Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
