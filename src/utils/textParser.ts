import type { SignItem } from '../services/offlineTranslator';

/**
 * 安全解析並切分全文翻譯清單，避免兩位數以上的編號（如 10., 11., 20. 等）被正則錯誤切分斷行
 */
export function parseFullTextLines(fullText: string): string[] {
  if (!fullText || !fullText.trim()) return [];

  // 1. 優先依換行符號（\r?\n+）精準拆分各行
  const rawLines = fullText
    .split(/\r?\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // 2. 若有單一行內擠入多個編號（例如「1. xxx 2. yyy 10. zzz」），使用嚴格的前綴邊界正則切分
  //    關鍵：(?<=\s|^)(?=\d+[\.、])
  //    因為在「10.」中，「0.」前方是數字「1」（非空白亦非行首），所以絕不會將「10.」誤切為「1」和「0.」！
  const lines = rawLines.flatMap((line) => {
    // 檢查行內是否含有「空白 + 數字 + 點/頓號」等多個連續條目
    if (/\s+\d+[\.、]/.test(line)) {
      return line
        .split(/(?<=\s|^)(?=\d+[\.、])/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [line];
  });

  return lines;
}

/**
 * 將單行條目文字（例如 "10. 鐵火卷：2,400日圓 (鉄火巻 2,400円)"）安全解析為 SignItem 字卡項目
 */
export function parseLineToSign(line: string, index: number): SignItem {
  // 移除最前端的編號（如 "10. ", "1、"）
  const clean = line.replace(/^\d+[\.、\s]+/, '').trim();

  // 嘗試解析後方的括號（日文原文或日文+價格）
  // 支援全形與半形括號： (鉄火巻 2,400円) 或 （鉄火巻 2,400円）
  const parenMatch = clean.match(/^(.*?)\s*[(（]([^()（）]+)[)）]\s*$/);
  let beforeParen = clean;
  let insideParen = '';

  if (parenMatch) {
    beforeParen = parenMatch[1].trim();
    insideParen = parenMatch[2].trim();
  }

  // 從 beforeParen 解析中文品名與價格（例如 "鐵火卷：2,400日圓"）
  const colonMatch = beforeParen.match(/^(.*?)\s*[：:]\s*(.+)$/);
  let chinese = beforeParen;
  let price = '';

  if (colonMatch) {
    chinese = colonMatch[1].trim();
    price = colonMatch[2].trim();
  } else {
    // 檢查是否有日圓/円標記在中文品名後端
    const priceSuffixMatch = beforeParen.match(/^(.*?)\s+([¥￥]?\d+[,，\d]*\s*(日圓|日元|円))\s*$/);
    if (priceSuffixMatch) {
      chinese = priceSuffixMatch[1].trim();
      price = priceSuffixMatch[2].trim();
    }
  }

  // 決定日文原文
  let japanese = insideParen || clean;
  if (!japanese || japanese === chinese) {
    japanese = clean;
  }

  // 若 price 仍為空，但 insideParen 或 clean 有價格
  if (!price) {
    const pMatch = clean.match(/([¥￥]?\d+[,，\d]*\s*(日圓|日元|円))/);
    if (pMatch) {
      price = pMatch[1];
    }
  }

  return {
    id: `sign_synced_${index + 1}`,
    japanese: japanese || chinese,
    hiragana: '',
    romaji: '',
    chinese: chinese || japanese,
    price: price || undefined,
    category: 'dining',
    orientation: 'horizontal',
    box_pct: [
      Math.min(85, 10 + ((index * 8) % 75)),
      10,
      Math.min(95, 22 + ((index * 8) % 75)),
      90,
    ],
    explanation: '',
    actionTip: '',
  };
}

/**
 * 格式化單個 SignItem 為標準全文條列式文字
 */
export function formatSignToFullTextLine(sign: SignItem, index: number): string {
  const hasPrice = sign.price && sign.price.trim().length > 0;
  const alreadyHasPrice =
    hasPrice &&
    (sign.chinese.includes(sign.price!) ||
      sign.chinese.includes('日圓') ||
      sign.chinese.includes('円') ||
      sign.chinese.includes('¥'));
  const priceSuffix = hasPrice && !alreadyHasPrice ? `：${sign.price}` : '';
  return `${index + 1}. ${sign.chinese}${priceSuffix}（${sign.japanese}）`;
}

/**
 * 雙向同步：保證翻譯行數 (lines) 與字卡項目 (signs) 100% 數量與索引絕對一致！
 */
export function syncSignsAndFullText(
  signsInput: SignItem[],
  fullTextRaw: string
): {
  signs: SignItem[];
  lines: string[];
  fullText: string;
} {
  const rawLines = parseFullTextLines(fullTextRaw);
  const signs = [...signsInput];

  // 情況 1：若兩者皆為空
  if (signs.length === 0 && rawLines.length === 0) {
    return { signs: [], lines: [], fullText: '' };
  }

  // 情況 2：若純粹只有 signs，無全文文字
  if (rawLines.length === 0) {
    const generatedLines = signs.map((s, idx) => formatSignToFullTextLine(s, idx));
    return {
      signs,
      lines: generatedLines,
      fullText: generatedLines.join('\n'),
    };
  }

  // 情況 3：若純粹只有全文文字，無 signs
  if (signs.length === 0) {
    const generatedSigns = rawLines.map((line, idx) => parseLineToSign(line, idx));
    return {
      signs: generatedSigns,
      lines: rawLines,
      fullText: rawLines.join('\n'),
    };
  }

  // 情況 4：若全文文字行數 > 字卡數量 (rawLines.length > signs.length)
  // 將多出來的全文行補充生成為字卡，確保每條翻譯都有專屬字卡！
  if (rawLines.length > signs.length) {
    const mergedSigns = [...signs];
    for (let i = signs.length; i < rawLines.length; i++) {
      mergedSigns.push(parseLineToSign(rawLines[i], i));
    }
    return {
      signs: mergedSigns,
      lines: rawLines,
      fullText: rawLines.join('\n'),
    };
  }

  // 情況 5：若字卡數量 > 全文文字行數 (signs.length > rawLines.length)
  // 將多出來的字卡補充產生全文行，確保每張字卡在全文都有對應編號！
  if (signs.length > rawLines.length) {
    const mergedLines = [...rawLines];
    for (let i = rawLines.length; i < signs.length; i++) {
      mergedLines.push(formatSignToFullTextLine(signs[i], i));
    }
    return {
      signs,
      lines: mergedLines,
      fullText: mergedLines.join('\n'),
    };
  }

  // 情況 6：兩者數量恰好相等
  return {
    signs,
    lines: rawLines,
    fullText: rawLines.join('\n'),
  };
}
