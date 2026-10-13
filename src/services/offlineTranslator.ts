import { toTraditionalChinese } from '../utils/chineseConverter';
import { OFFLINE_LEXICON, ZH_TO_JA_MAP, LexiconItem } from './offlineLexicon';

export interface SignItem {
  id: string;
  japanese: string;
  hiragana: string;
  romaji: string;
  chinese: string;
  price?: string; // 價格資訊（例如：100日圓、¥1,150）
  category: 'road_sign' | 'transit' | 'dining' | 'shopping' | 'warning' | 'facility' | 'other';
  orientation?: 'horizontal' | 'vertical';
  box_pct?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-100%
  explanation?: string;
  actionTip?: string;
}

export interface PresetSignScene {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  category: 'road_sign' | 'transit' | 'dining' | 'warning';
  summary: string;
  importantNotice?: string;
  fullArticleTranslation?: string;
  imageUrl: string; // SVG data uri or generated representation
  signs: SignItem[];
}

export interface OfflineEntry {
  japanese: string;
  hiragana: string;
  romaji: string;
  chinese: string;
  category: 'road_sign' | 'transit' | 'dining' | 'shopping' | 'warning' | 'facility' | 'other';
  explanation: string;
  actionTip: string;
  tags?: string[];
}

// 豐富的日本自由行離線辭典 (超過 150+ 核心路牌與必備單詞短語)
export const OFFLINE_DICTIONARY: OfflineEntry[] = [
  // --- 道路與路牌 ---
  {
    japanese: '非常口',
    hiragana: 'ひじょうぐち',
    romaji: 'hijouguchi',
    chinese: '緊急逃生出口',
    category: 'warning',
    explanation: '綠色背景小綠人奔跑標誌。發生火災或地震時的法定逃生通道。',
    actionTip: '進入飯店或地下街請先確認最近的非常口位置。'
  },
  {
    japanese: '出口',
    hiragana: 'でぐち',
    romaji: 'deguchi',
    chinese: '出口',
    category: 'road_sign',
    explanation: '車站、商場、地下街最常見的路牌標示，通常會附帶編號（如 A1, 西口）。',
    actionTip: '跟隨黃色/綠色出口指示燈前進即可到達地面。'
  },
  {
    japanese: '入口',
    hiragana: 'いりぐち',
    romaji: 'iriguchi',
    chinese: '入口',
    category: 'road_sign',
    explanation: '建築物、車站或店家的進入通道。',
    actionTip: '若有自動門請站在感應線後方。'
  },
  {
    japanese: '一時停止',
    hiragana: 'いちじていし',
    romaji: 'ichiji teishi',
    chinese: '暫停（停車再開）',
    category: 'road_sign',
    explanation: '倒三角形紅色道路標誌，刻有「止まれ」字樣。',
    actionTip: '自駕或騎自行車必須在白線前完全停下車輪，左右確認安全後才能前進。'
  },
  {
    japanese: '歩行者専用',
    hiragana: 'ほこうしゃせんよう',
    romaji: 'hokousha senyou',
    chinese: '行人專用道（步行者專用）',
    category: 'road_sign',
    explanation: '藍色底白色親子步行圖案，車輛禁止駛入。',
    actionTip: '自由行遊客可放心在此步道散步拍照。'
  },
  {
    japanese: '進入禁止',
    hiragana: 'しんにゅうきんし',
    romaji: 'shinnyuu kinshi',
    chinese: '禁止進入（單行道逆向）',
    category: 'warning',
    explanation: '紅色圓底中間有一道白色粗橫線的國際標準標誌。',
    actionTip: '自駕或騎單車切勿逆向行駛，違者重罰。'
  },
  {
    japanese: '駐輪禁止',
    hiragana: 'ちゅうりんきんし',
    romaji: 'chuurin kinshi',
    chinese: '禁止停放自行車',
    category: 'warning',
    explanation: '日本街頭嚴格管制腳踏車亂停，違停會被拖吊並收取數千日幣保管費。',
    actionTip: '租借腳踏車者請務必尋找專用收費駐輪場。'
  },
  {
    japanese: '駐車禁止',
    hiragana: 'ちゅうしゃきんし',
    romaji: 'chuusha kinshi',
    chinese: '禁止停車',
    category: 'warning',
    explanation: '藍底紅斜線或紅叉圓形標誌。',
    actionTip: '租車自駕請停在投幣式停車場（コインパーキング）。'
  },
  {
    japanese: '歩行者天国',
    hiragana: 'ほこうしゃてんごく',
    romaji: 'hokousha tengoku',
    chinese: '步行者天國（封街徒步區）',
    category: 'road_sign',
    explanation: '週末或假日時（如銀座、秋葉原）將主要幹道封閉，僅供行人逛街。',
    actionTip: '可走在大馬路正中間拍照打卡，但注意腳踏車也不得騎乘。'
  },
  {
    japanese: '案内所',
    hiragana: 'あんないじょ',
    romaji: 'annaijo',
    chinese: '旅客服務中心 / 詢問處',
    category: 'facility',
    explanation: '觀光旅遊詢問處，通常有英中文地圖與優惠票券諮詢。',
    actionTip: '找路、買周遊券或詢問行李寄放的好去處。'
  },
  {
    japanese: '交番',
    hiragana: 'こうばん',
    romaji: 'kouban',
    chinese: '派出所 / 警察巡邏亭',
    category: 'facility',
    explanation: '日本街頭到處可見的小型警亭，上面有金色警徽。',
    actionTip: '迷路問路、遺失物品（落とし物）或緊急求助時請直接敲門。'
  },
  {
    japanese: '消火器',
    hiragana: 'しょうかき',
    romaji: 'shoukaki',
    chinese: '滅火器',
    category: 'facility',
    explanation: '紅色消防專用標示。',
    actionTip: '遇初期火災時破箱取用。'
  },

  // --- 大眾交通與轉乘 ---
  {
    japanese: '改札口',
    hiragana: 'かいさつぐち',
    romaji: 'kaisatsuguchi',
    chinese: '剪票口 / 驗票閘門',
    category: 'transit',
    explanation: '搭乘地鐵、JR 或私鐵進出月台的閘口。',
    actionTip: '右手持 Suica / PASMO / IC卡輕觸感應區，或投入磁條車票。'
  },
  {
    japanese: 'のりば',
    hiragana: 'のりば',
    romaji: 'noriba',
    chinese: '乘車處 / 月台 / 站牌（幾號線）',
    category: 'transit',
    explanation: '指引公車、計程車或電車第幾月台的關鍵詞。',
    actionTip: '例如「1番のりば」即代表 1 號乘車處。'
  },
  {
    japanese: 'きっぷうりば',
    hiragana: 'きっぷうりば',
    romaji: 'kippu uriba',
    chinese: '售票處 / 自動售票機區',
    category: 'transit',
    explanation: '自動售票機上方會有龐大的路線票價圖。',
    actionTip: '螢幕右上角多可切換繁體中文介面。'
  },
  {
    japanese: '精算機',
    hiragana: 'せいさんき',
    romaji: 'seisanki',
    chinese: '補票機 / 車資調整機',
    category: 'transit',
    explanation: '出閘門若因餘額不足無法出站時，閘門前會設立精算機。',
    actionTip: '插入車票或 IC 卡補足差額，即可取得出場券順利出站。'
  },
  {
    japanese: '乗り換え',
    hiragana: 'のりかえ',
    romaji: 'norikae',
    chinese: '轉乘 / 換車',
    category: 'transit',
    explanation: '指引更換其他路線（如由 JR 轉乘地下鐵）的通道標示。',
    actionTip: '請注意地面標線與路線顏色（如銀座線是橘色、山手線是綠色）。'
  },
  {
    japanese: '指定席',
    hiragana: 'していせき',
    romaji: 'shiteiseki',
    chinese: '對號座 / 指定席',
    category: 'transit',
    explanation: '新幹線與特急電車已預約號碼的專用車廂。',
    actionTip: '上車請對照車票上的車廂號碼（号車）與座位號碼（如 7号車 12A）。'
  },
  {
    japanese: '自由席',
    hiragana: 'じゆうせき',
    romaji: 'jiyuuseki',
    chinese: '自由座（非對號座）',
    category: 'transit',
    explanation: '持有自由席車票的乘客可任意挑選空位入座。',
    actionTip: '通常位於新幹線第 1 到 3 或 5 節車廂，尖峰時段建議提早到月台排隊。'
  },
  {
    japanese: '運休',
    hiragana: 'うんきゅう',
    romaji: 'unkyuu',
    chinese: '停駛 / 暫停運行',
    category: 'warning',
    explanation: '因颱風、大雪、人身事故導致該班列車取消。',
    actionTip: '請至車站窗口詢問替代路線（振替輸送）或辦理退票。'
  },
  {
    japanese: '遅延',
    hiragana: 'ちえん',
    romaji: 'chien',
    chinese: '延誤 / 誤點',
    category: 'warning',
    explanation: '列車比預定時刻晚到達，通常電子看板會顯示晚點分鐘數。',
    actionTip: '趕飛機者請及早評估是否改搭巴士或計程車。'
  },
  {
    japanese: '女性専用車両',
    hiragana: 'じょせいせんようしゃりょう',
    romaji: 'josei senyou sharyou',
    chinese: '女性專用車廂',
    category: 'transit',
    explanation: '平日早晚通勤高峰時段僅限女性、幼兒及身障乘客搭乘。',
    actionTip: '地面與車身會貼粉紅色醒目標示，男士旅客請避開該車廂以防尷尬。'
  },
  {
    japanese: '優先席',
    hiragana: 'ゆうせんせき',
    romaji: 'yuusenseki',
    chinese: '博愛座 / 優先座',
    category: 'transit',
    explanation: '提供給老人、孕婦、抱幼兒者及身心障礙人士。',
    actionTip: '日本文化中，優先席附近請將手機切換成靜音模式，人潮擁擠時請關閉手機電源。'
  },
  {
    japanese: '降車ボタン',
    hiragana: 'こうしゃぼたん',
    romaji: 'kousha botan',
    chinese: '下車鈴',
    category: 'transit',
    explanation: '搭乘公車時，即將到站前按下下車按鈕。',
    actionTip: '在日本搭公車請等車輛完全停穩再起身投幣或刷卡，公車司機會廣播宣導。'
  },
  {
    japanese: '回送',
    hiragana: 'かいそう',
    romaji: 'kaisou',
    chinese: '回送車 / 不載客',
    category: 'transit',
    explanation: '公車或電車車頭顯示回送，表示正前往車庫或休息，不對外開放上車。',
    actionTip: '請等待下一班正班車。'
  },

  // --- 居酒屋與美食 ---
  {
    japanese: 'お会計 / 会計',
    hiragana: 'おかいけい',
    romaji: 'okaikei',
    chinese: '買單 / 結帳',
    category: 'dining',
    explanation: '用餐完畢要結帳時的說法，雙手食指比叉也是通用手勢。',
    actionTip: '對店員說：「お会計お願いします（O-kaikei onegaishimasu）」。'
  },
  {
    japanese: 'おすすめ',
    hiragana: 'おすすめ',
    romaji: 'osusume',
    chinese: '主廚推薦 / 店長推薦',
    category: 'dining',
    explanation: '餐廳菜單中最受歡迎或當季特色招牌餐點。',
    actionTip: '不知吃什麼時，指著菜單問：「おすすめはどれですか？」'
  },
  {
    japanese: '定食',
    hiragana: 'ていしょく',
    romaji: 'teishoku',
    chinese: '套餐（附白飯、味噌湯、小菜）',
    category: 'dining',
    explanation: '日本標準正餐組合，通常白飯可以免費續加（おかわり自由）。',
    actionTip: 'CP值最高的平民點餐選擇。'
  },
  {
    japanese: '替玉',
    hiragana: 'かえだま',
    romaji: 'kaedama',
    chinese: '加麵（拉麵續麵）',
    category: 'dining',
    explanation: '博多豚骨拉麵店專用，湯底不要喝完，可加點一份純麵條加入。',
    actionTip: '可選擇麵條硬度（かため=偏硬, ふつう=普通）。'
  },
  {
    japanese: '大盛り',
    hiragana: 'おおもり',
    romaji: 'oomori',
    chinese: '大份 / 飯量加大',
    category: 'dining',
    explanation: '標準份量為「並盛り（なみもり）」，加大則說大盛り。',
    actionTip: '有些店大盛免費（大盛り無料）。'
  },
  {
    japanese: '税込',
    hiragana: 'ぜいこみ',
    romaji: 'zeikomi',
    chinese: '含稅價（結帳實際金額）',
    category: 'dining',
    explanation: '日本消費稅為 10%（外帶食品為 8%），税込即最終付款金額。',
    actionTip: '若標示「税抜（ぜいぬき）」則需額外加收消費稅。'
  },
  {
    japanese: '禁煙',
    hiragana: 'きんえん',
    romaji: 'kin-en',
    chinese: '全面禁菸',
    category: 'warning',
    explanation: '全室禁煙或禁菸席。日本多數餐廳室內禁止吸菸。',
    actionTip: '違者可能面臨店家驅離或市府罰鍰。'
  },
  {
    japanese: '喫煙所',
    hiragana: 'きつえんじょ',
    romaji: 'kitsuyenjo',
    chinese: '指定吸菸室 / 吸菸區',
    category: 'facility',
    explanation: '合法吸菸的專用密閉隔間。',
    actionTip: '日本街頭嚴禁邊走邊抽菸，請務必進入吸菸所。'
  },
  {
    japanese: 'お通し',
    hiragana: 'おとおし',
    romaji: 'otooshi',
    chinese: '居酒屋基本開胃小菜（座位低消費）',
    category: 'dining',
    explanation: '入座居酒屋後店員未點餐即送上的小菜，此為日本居酒屋傳統桌費（約300~600円/人）。',
    actionTip: '這是正常收費文化，結帳會列在帳單明細中，並非店家坑錢。'
  },
  {
    japanese: 'お冷 / 水',
    hiragana: 'おひや',
    romaji: 'ohiya',
    chinese: '冰開水（免費提供）',
    category: 'dining',
    explanation: '日本餐廳一年四季皆預設提供加冰塊的冰水，這在日本代表最崇高的敬意。',
    actionTip: '若要常溫水可說：「常温（じょうおん）のお水をお願いします」。'
  },
  {
    japanese: '持ち帰り',
    hiragana: 'もちかえり',
    romaji: 'mochikaeri',
    chinese: '外帶（Take out）',
    category: 'dining',
    explanation: '日文外帶也可說テイクアウト（teiku auto）。外帶食品享有 8% 輕減稅率。',
    actionTip: '若在店內吃（店内飲食）則是 10% 稅率。'
  },
  {
    japanese: '食べ放題',
    hiragana: 'たべほうだい',
    romaji: 'tabehoudai',
    chinese: '吃到飽 / 自助無限續盤',
    category: 'dining',
    explanation: '通常限時 90~120 分鐘，如燒肉吃到飽、火鍋吃到飽。',
    actionTip: '通常要求同桌全員必須點同種方案，最後加點為結束前 20 分鐘（ラストオーダー）。'
  },
  {
    japanese: '飲み放題',
    hiragana: 'のみほうだい',
    romaji: 'nomihoudai',
    chinese: '酒類飲料無限暢飲',
    category: 'dining',
    explanation: '居酒屋常見超值方案，啤酒、清酒、沙瓦在時限內無限喝。',
    actionTip: '空杯才能交換續杯（グラス交換制）。'
  },

  // --- 藥妝與購物 ---
  {
    japanese: '免税',
    hiragana: 'めんぜい',
    romaji: 'menzei',
    chinese: '免稅（Tax Free）',
    category: 'shopping',
    explanation: '外國旅客單筆消費達 5,000 日圓（未稅）以上可辦理退消費稅 10%。',
    actionTip: '結帳時請主動出示實體護照本（手機照片無效），且消耗品免稅袋在日本境內切勿拆封。'
  },
  {
    japanese: '割引',
    hiragana: 'わりびき',
    romaji: 'waribiki',
    chinese: '折扣 / 打折',
    category: 'shopping',
    explanation: '日本折數計算：1割引 = 9折，2割引 = 8折，5割引 = 半價（半額）。',
    actionTip: '看清楚前面的數字：例如「3割引」代表扣掉三成，即 7 折！'
  },
  {
    japanese: '半額',
    hiragana: 'はんがく',
    romaji: 'hangaku',
    chinese: '半價（5折）',
    category: 'shopping',
    explanation: '日本超市晚上 7~8 點後熟食便當便會貼上黃色「半額」貼紙。',
    actionTip: '省錢自由行背包客搶購宵夜生魚片與炸物便當的最佳時機！'
  },
  {
    japanese: 'レジ',
    hiragana: 'れじ',
    romaji: 'reji',
    chinese: '收銀台 / 結帳櫃檯',
    category: 'shopping',
    explanation: '排隊結帳的位置，地上通常會貼腳印引導動線。',
    actionTip: '請依指示在「等待線」後依序排隊，不要直接貼在櫃檯前。'
  },
  {
    japanese: '袋いりません',
    hiragana: 'ふくろいりません',
    romaji: 'fukuro irimasen',
    chinese: '我不需要塑膠袋',
    category: 'shopping',
    explanation: '日本便利商店與超市塑膠袋均需自費（約 3~5 円）。',
    actionTip: '自備環保袋者在結帳時可直接說這句話，或指收銀台上的「不要袋子」小牌。'
  },
  {
    japanese: '現金のみ',
    hiragana: 'げんきんのみ',
    romaji: 'genkin nomi',
    chinese: '僅限現金付款（不可刷卡）',
    category: 'shopping',
    explanation: '傳統老店、拉麵自動售票機、部分神社多標示僅收日幣現金。',
    actionTip: '自由行身上務必隨時備妥數千至上萬日圓紙鈔與硬幣。'
  },
  {
    japanese: '売り切れ',
    hiragana: 'うりきれ',
    romaji: 'urikire',
    chinese: '售完 / 售罄（Sold Out）',
    category: 'shopping',
    explanation: '商品已售完，自動販賣機亮紅燈也是此字。',
    actionTip: '只能明日請早或挑選其他品項。'
  },
  {
    japanese: '限定',
    hiragana: 'げんてい',
    romaji: 'gentei',
    chinese: '限定商品（期間/地區限定）',
    category: 'shopping',
    explanation: '如「季節限定」、「東京限定」、「數量限定」，為日本商戰特色。',
    actionTip: '送禮伴手禮的最佳首選，錯過這家店或季節就買不到。'
  },

  // --- 飯店與住宿 ---
  {
    japanese: 'チェックイン',
    hiragana: 'ちぇっくいん',
    romaji: 'chekku in',
    chinese: '辦理入住（Check-in）',
    category: 'facility',
    explanation: '飯店下午通常於 15:00 開始受理入住手續。',
    actionTip: '請主動準備好所有入住者的護照正本以供櫃檯複印存檔。'
  },
  {
    japanese: 'チェックアウト',
    hiragana: 'ちぇっくあうと',
    romaji: 'chekku auto',
    chinese: '辦理退房（Check-out）',
    category: 'facility',
    explanation: '退房時間多為上午 10:00 或 11:00，逾時會收取延遲費用。',
    actionTip: '歸還房卡，若無額外消費即可迅速離開。'
  },
  {
    japanese: '荷物預かり',
    hiragana: 'にもつあずかり',
    romaji: 'nimotsu azukari',
    chinese: '寄放行李',
    category: 'facility',
    explanation: '入住前或退房當天，絕大多數日本飯店皆提供免費當日寄放行李服務。',
    actionTip: '對櫃檯說：「荷物を預かっていただけますか？（Nimotsu o azukatte itadakemasuka?）」。'
  },
  {
    japanese: '清掃不要',
    hiragana: 'せいそうふよう',
    romaji: 'seisou fuyou',
    chinese: '不需清掃房間（請勿打擾）',
    category: 'facility',
    explanation: '掛在門把上的磁鐵牌，通常飯店會將乾淨毛巾裝袋掛在門口把手。',
    actionTip: '連住想睡晚一點時可貼在房門外。'
  },
  {
    japanese: '露天風呂',
    hiragana: 'ろてんぶろ',
    romaji: 'rotenburo',
    chinese: '露天溫泉池',
    category: 'facility',
    explanation: '溫泉飯店內設於室外露天的溫泉，可邊泡湯邊看雪景或庭園山景。',
    actionTip: '進溫泉池前必須在沖洗區（洗い場）坐著將全身徹底洗淨，大毛巾不可浸入溫泉池水中。'
  },
  {
    japanese: '男湯 / 女湯',
    hiragana: 'おとこゆ / おんなゆ',
    romaji: 'otokoyu / onnayu',
    chinese: '男湯（藍色布簾） / 女湯（紅色布簾）',
    category: 'facility',
    explanation: '大浴場門口的門簾標示。男湯多為藍色「男」字，女湯多為紅色「女」字。',
    actionTip: '注意部分溫泉飯店早晚會將男女湯互相調換，進門前務必看清標籤！'
  },

  // --- 緊急求助與警示 ---
  {
    japanese: '助けてください',
    hiragana: 'たすけてください',
    romaji: 'tasukete kudasai',
    chinese: '救命！請幫幫我！',
    category: 'warning',
    explanation: '遭遇危險、受傷或緊急災難時呼救的關鍵句。',
    actionTip: '大聲呼喊會立刻引起周遭日本民眾與巡警注意並提供協助。'
  },
  {
    japanese: '落とし物',
    hiragana: 'おとしもの',
    romaji: 'otoshimono',
    chinese: '失物招領 / 遺失物',
    category: 'facility',
    explanation: '車站失物招領處（忘れ物取扱所）或交番登記遺失物品。',
    actionTip: '日本尋回遺失物機率極高，遺失手機皮夾請儘快向最近車站失物處詢問。'
  },
  {
    japanese: '病院 / 救急',
    hiragana: 'びょういん / きゅうきゅう',
    romaji: 'byouin / kyuukyuu',
    chinese: '醫院 / 緊急救護',
    category: 'warning',
    explanation: '日本緊急救護車撥打電話為 119（報警為 110）。',
    actionTip: '若身體極度不適可請飯店櫃檯代叫救護車（きゅうきゅうしゃ）。'
  },
  {
    japanese: '立入禁止',
    hiragana: 'たちいりきんし',
    romaji: 'tachiiri kinshi',
    chinese: '嚴禁進入（非工作人員禁止入內）',
    category: 'warning',
    explanation: '常見於鐵道月台盡頭、施工工區、私人土地或神社未開放區域。',
    actionTip: '絕對不可擅自跨越黃線或圍欄，否則可能觸犯日本刑法輕犯罪。'
  },
  {
    japanese: '防犯カメラ作動中',
    hiragana: 'ぼうはんかめらさどうちゅう',
    romaji: 'bouhan kamera sadouchuu',
    chinese: '監視錄影中',
    category: 'warning',
    explanation: '表示該區域設有高解析度監視器全年無休錄影。',
    actionTip: '請注意個人言行舉止，遵守當地規矩。'
  }
];

// 預設的真實日本街頭路牌場景庫（完全離線可測試與 AR 示範）
export const PRESET_ROAD_SIGN_SCENES: PresetSignScene[] = [
  {
    id: 'scene_shinjuku_exit',
    title: '新宿車站地鐵轉乘與出口看板',
    subtitle: '世界最繁忙車站的經典路牌標示',
    location: 'JR 新宿駅 西口改札前',
    category: 'transit',
    summary: '此看板為典型日本大型轉乘站的路牌指示，涵蓋出口、轉乘私鐵、公車站與洗手間。',
    importantNotice: '新宿站地下出口超過200個，請認明英文字母編號（如西口/南口）。',
    // High-contrast stylized visual representation
    imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
        <rect width="800" height="500" fill="#1e293b"/>
        <!-- Signboard Border -->
        <rect x="30" y="30" width="740" height="440" rx="16" fill="#0f172a" stroke="#334155" stroke-width="6"/>
        
        <!-- Yellow Exit Header -->
        <rect x="50" y="50" width="700" height="110" rx="10" fill="#facc15"/>
        <text x="80" y="125" fill="#000000" font-family="sans-serif" font-weight="900" font-size="52">出口</text>
        <text x="210" y="125" fill="#000000" font-family="sans-serif" font-weight="700" font-size="34">Exit</text>
        <text x="310" y="125" fill="#000000" font-family="sans-serif" font-weight="900" font-size="52">西口</text>
        <text x="440" y="125" fill="#000000" font-family="sans-serif" font-weight="700" font-size="32">West Exit</text>
        <circle cx="680" cy="105" r="35" fill="#000000"/>
        <text x="668" y="120" fill="#facc15" font-family="sans-serif" font-weight="900" font-size="44">➔</text>

        <!-- Transit Transfer Rows -->
        <!-- Row 1: Odakyu Line -->
        <rect x="50" y="180" width="700" height="75" rx="8" fill="#1e3a8a"/>
        <text x="80" y="232" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="32">小田急線 のりば</text>
        <text x="380" y="232" fill="#93c5fd" font-family="sans-serif" font-size="24">Odakyu Line (箱根方面)</text>
        <text x="690" y="234" fill="#ffffff" font-size="34">⮡</text>

        <!-- Row 2: Keio Line -->
        <rect x="50" y="270" width="700" height="75" rx="8" fill="#831843"/>
        <text x="80" y="322" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="32">京王線 改札口</text>
        <text x="360" y="322" fill="#fbcfe8" font-size="24">Keio Line Gates</text>
        <text x="690" y="324" fill="#ffffff" font-size="34">⬆</text>

        <!-- Row 3: Facilities -->
        <rect x="50" y="360" width="700" height="85" rx="8" fill="#064e3b"/>
        <text x="80" y="415" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="30">きっぷうりば / 精算機</text>
        <text x="440" y="415" fill="#6ee7b7" font-size="22">Tickets / Fare Adjustment</text>
        <text x="680" y="418" fill="#ffffff" font-size="30">◀</text>
      </svg>
    `),
    signs: [
      {
        id: 'sn_1',
        japanese: '出口 (西口)',
        hiragana: 'でぐち (にしぐち)',
        romaji: 'deguchi (nishiguchi)',
        chinese: '出口（西口）',
        category: 'road_sign',
        box_pct: [10, 6, 32, 94],
        explanation: '通往新宿西側都廳、京王百貨、小田急百貨及各大超高層飯店群。',
        actionTip: '跟隨黃底黑字西口箭頭向右側直行即可抵達地面。'
      },
      {
        id: 'sn_2',
        japanese: '小田急線 のりば',
        hiragana: 'おだきゅうせん のりば',
        romaji: 'odakyuu-sen noriba',
        chinese: '小田急線 乘車處',
        category: 'transit',
        box_pct: [36, 6, 51, 94],
        explanation: '前往箱根（浪漫特快 Romancecar）、江之島、鎌倉之熱門觀光私鐵。',
        actionTip: '持有箱根周遊券的旅客請順此箭頭右轉進閘門。'
      },
      {
        id: 'sn_3',
        japanese: '京王線 改札口',
        hiragana: 'けいおうせん かいさつぐち',
        romaji: 'keiou-sen kaisatsuguchi',
        chinese: '京王線 驗票閘口',
        category: 'transit',
        box_pct: [54, 6, 69, 94],
        explanation: '通往調布、高尾山方向的私鐵路線。',
        actionTip: '搭車爬高尾山或賞楓請由此閘口持 IC 卡感應進站。'
      },
      {
        id: 'sn_4',
        japanese: 'きっぷうりば / 精算機',
        hiragana: 'きっぷうりば / せいさんき',
        romaji: 'kippu uriba / seisanki',
        chinese: '自動售票機 / 補票調整機',
        category: 'facility',
        box_pct: [72, 6, 89, 94],
        explanation: '若持有的車票或 IC 卡出站刷不開，表示餘額不足，需至此機器補足金額。',
        actionTip: '向左走即可看見一排補票機，插入卡片投入硬幣即可。'
      }
    ]
  },
  {
    id: 'scene_kyoto_street',
    title: '京都祇園歷史街道警示路牌',
    subtitle: '觀光古都特殊文化禮儀與禁止事項',
    location: '京都市東山區 祇園花見小路',
    category: 'warning',
    summary: '此告示牌嚴格規範觀光客在歷史景觀保存區的拍照與行走禮儀。',
    importantNotice: '私道未經許可拍攝舞妓藝伎，最高罰款 1 萬日圓！',
    imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
        <rect width="800" height="500" fill="#451a03"/>
        <rect x="30" y="30" width="740" height="440" rx="12" fill="#fef3c7" stroke="#78350f" stroke-width="8"/>
        
        <!-- Red Warning Header -->
        <rect x="60" y="50" width="680" height="80" rx="8" fill="#b91c1c"/>
        <text x="140" y="105" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="44">⚠ 私道につき撮影禁止</text>

        <!-- Rule 1: No Photo -->
        <circle cx="120" cy="200" r="40" fill="#ffffff" stroke="#dc2626" stroke-width="8"/>
        <line x1="90" y1="230" x2="150" y2="170" stroke="#dc2626" stroke-width="8"/>
        <text x="100" y="210" font-size="30">📷</text>
        <text x="190" y="195" fill="#78350f" font-family="sans-serif" font-weight="bold" font-size="28">無断撮影は 罰金1万円</text>
        <text x="190" y="225" fill="#92400e" font-size="20">No photography on private street. Fine 10,000 yen.</text>

        <!-- Rule 2: Walk Eating -->
        <circle cx="120" cy="300" r="40" fill="#ffffff" stroke="#dc2626" stroke-width="8"/>
        <line x1="90" y1="330" x2="150" y2="270" stroke="#dc2626" stroke-width="8"/>
        <text x="100" y="310" font-size="30">🍦</text>
        <text x="190" y="295" fill="#78350f" font-family="sans-serif" font-weight="bold" font-size="28">歩き食い禁止・ゴミ持ち帰り</text>
        <text x="190" y="325" fill="#92400e" font-size="20">Please do not eat while walking. Take your trash home.</text>

        <!-- Rule 3: Smoking -->
        <circle cx="120" cy="400" r="40" fill="#ffffff" stroke="#dc2626" stroke-width="8"/>
        <line x1="90" y1="430" x2="150" y2="370" stroke="#dc2626" stroke-width="8"/>
        <text x="100" y="410" font-size="30">🚬</text>
        <text x="190" y="395" fill="#78350f" font-family="sans-serif" font-weight="bold" font-size="28">路上喫煙禁止区域</text>
        <text x="190" y="425" fill="#92400e" font-size="20">No smoking on streets. (京都市過料 1,000円)</text>
      </svg>
    `),
    signs: [
      {
        id: 'ky_1',
        japanese: '私道につき撮影禁止 (罰金1万円)',
        hiragana: 'しどうにつき さつえいきんし (ばっきん いちまんえん)',
        romaji: 'shidou ni tsuki satsuei kinshi',
        chinese: '私人巷道嚴禁拍照（違者罰款一萬日圓）',
        category: 'warning',
        box_pct: [10, 7, 46, 92],
        explanation: '祇園花見小路內許多窄巷為私有土地，為維護藝伎隱私與居民生活，已立法禁止遊客拍攝。',
        actionTip: '請將相機鏡頭收起，勿圍堵拍照，尊重當地工作者。'
      },
      {
        id: 'ky_2',
        japanese: '歩き食い禁止・ゴミ持ち帰り',
        hiragana: 'あるきぐいきんし・ごみもちかえり',
        romaji: 'arukigui kinshi / gomi mochikaeri',
        chinese: '禁止邊走邊吃・請自行帶走垃圾',
        category: 'warning',
        box_pct: [48, 7, 72, 92],
        explanation: '在京都老街邊走邊吃容易弄髒他人和服或古蹟，且街上沒有公共垃圾桶。',
        actionTip: '購買小吃請在店家門口專用用餐區吃完，並將竹籤與包裝紙還給店員回收。'
      },
      {
        id: 'ky_3',
        japanese: '路上喫煙禁止区域',
        hiragana: 'ろじょうきつえんきんしくいき',
        romaji: 'rojou kitsuyen kinshi kuiki',
        chinese: '路上吸菸全面禁止區域',
        category: 'warning',
        box_pct: [74, 7, 95, 92],
        explanation: '京都市全區嚴禁在室外道路上抽菸，巡查員查獲當場開罰。',
        actionTip: '吸菸者請尋找附設排氣設備的指定喫煙所。'
      }
    ]
  },
  {
    id: 'scene_ramen_ticket',
    title: '日本拉麵店食券自動販賣機',
    subtitle: '排隊人氣名店點餐按鈕翻譯',
    location: '東京上野 一蘭/麵屋武藏前',
    category: 'dining',
    summary: '日本點餐機以日語漢字為主，熟悉關鍵字即可輕鬆自助購票。',
    imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
        <rect width="800" height="500" fill="#334155"/>
        <rect x="40" y="30" width="720" height="440" rx="16" fill="#1e293b" stroke="#64748b" stroke-width="6"/>

        <!-- Money Slot and Screen -->
        <rect x="70" y="60" width="660" height="50" rx="6" fill="#0f172a"/>
        <text x="100" y="94" fill="#38bdf8" font-family="sans-serif" font-weight="bold" font-size="24">投入金額: ¥1,000  (現金を入れてからボタンを押してください)</text>

        <!-- Button 1: Ramen -->
        <rect x="70" y="130" width="310" height="90" rx="10" fill="#dc2626"/>
        <text x="90" y="170" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="28">特製 濃厚豚骨らーめん</text>
        <text x="90" y="202" fill="#fecaca" font-size="20">¥1,100 (当店おすすめ)</text>

        <!-- Button 2: Tsukemen -->
        <rect x="420" y="130" width="310" height="90" rx="10" fill="#ea580c"/>
        <text x="440" y="170" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="28">魚介 濃厚つけ麺</text>
        <text x="440" y="202" fill="#fed7aa" font-size="20">¥1,150 (大盛り無料)</text>

        <!-- Button 3: Kaedama (Extra noodles) -->
        <rect x="70" y="240" width="310" height="90" rx="10" fill="#0284c7"/>
        <text x="90" y="280" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="28">替玉 (麺おかわり)</text>
        <text x="90" y="312" fill="#bae6fd" font-size="20">¥150 (半替玉 ¥100)</text>

        <!-- Button 4: Gyoza -->
        <rect x="420" y="240" width="310" height="90" rx="10" fill="#16a34a"/>
        <text x="440" y="280" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="28">黒豚 焼き餃子 (6個)</text>
        <text x="440" y="312" fill="#bbf7d0" font-size="20">¥450 (自家製タレ付)</text>

        <!-- Row 3: Drinks & Rice -->
        <rect x="70" y="350" width="310" height="90" rx="10" fill="#d97706"/>
        <text x="90" y="390" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="28">生ビール (中ジョッキ)</text>
        <text x="90" y="422" fill="#fde68a" font-size="20">¥550 (アサヒスーパードライ)</text>

        <rect x="420" y="350" width="310" height="90" rx="10" fill="#475569"/>
        <text x="440" y="390" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="28">領収書 (領収証ボタン)</text>
        <text x="440" y="422" fill="#cbd5e1" font-size="20">Receipt Button / おつり</text>
      </svg>
    `),
    signs: [
      {
        id: 'rm_1',
        japanese: '特製 濃厚豚骨らーめん (¥1,100)',
        hiragana: 'とくせい のうこうとんこつらーめん',
        romaji: 'tokusei noukou tonkotsu raamen',
        chinese: '特製 濃厚豚骨拉麵（招牌人氣）',
        category: 'dining',
        box_pct: [26, 8, 44, 48],
        explanation: '包含叉燒、溏心蛋、海苔與蔥花的全套招牌豚骨拉麵。',
        actionTip: '先投幣入鈔後按下此按鈕，領取掉落的小食券交給吧台師傅。'
      },
      {
        id: 'rm_2',
        japanese: '魚介 濃厚つけ麺 (大盛り無料)',
        hiragana: 'ぎょかい のうこうつけめん (おおもりむりょう)',
        romaji: 'gyokai noukou tsukemen (oomori muryou)',
        chinese: '魚介海鮮 濃厚沾麵（可免費升級大碗）',
        category: 'dining',
        box_pct: [26, 52, 44, 92],
        explanation: '冷麵條沾取高濃縮溫熱魚介高湯食用。麵條加大份量不加價。',
        actionTip: '吃完麵後可跟店員說「スープ割りお願いします」將沾醬稀釋成熱湯喝完。'
      },
      {
        id: 'rm_3',
        japanese: '替玉 (麺おかわり)',
        hiragana: 'かえだま (めんおかわり)',
        romaji: 'kaedama',
        chinese: '加麵 / 續麵一份',
        category: 'dining',
        box_pct: [48, 8, 66, 48],
        explanation: '麵條吃完但湯底還剩下時，可以加點純麵條放進去。',
        actionTip: '切勿把湯全部喝光才點替玉，否則沒有湯底可以泡麵。'
      },
      {
        id: 'rm_4',
        japanese: '黒豚 焼き餃子',
        hiragana: 'くろぶた やきぎょうざ',
        romaji: 'kurobuta yaki gyouza',
        chinese: '黑豬肉 煎餃（6顆）',
        category: 'dining',
        box_pct: [48, 52, 66, 92],
        explanation: '拉麵店的最佳配角配菜，底層煎得金黃酥脆。',
        actionTip: '桌上有醬油、醋與辣油，可自行調製沾醬。'
      },
      {
        id: 'rm_5',
        japanese: '生ビール (中ジョッキ)',
        hiragana: 'なまびーる (ちゅうじょっき)',
        romaji: 'nama biiru',
        chinese: '生啤酒（中杯生啤）',
        category: 'dining',
        box_pct: [70, 8, 88, 48],
        explanation: '現壓冰涼生啤酒，搭配熱騰騰拉麵的日本道地吃法。',
        actionTip: '日本法定飲酒年齡為 20 歲。'
      }
    ]
  },
  {
    id: 'scene_shinkansen_board',
    title: '新幹線月台電子發車看板',
    subtitle: '列車番號、自由席與指定席車廂對照',
    location: 'JR 東京駅 新幹線 14-15番ホーム',
    category: 'transit',
    summary: '日本新幹線電子翻頁看板，顯示發車時間、車種、停靠站與車廂編組。',
    imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
        <rect width="800" height="500" fill="#020617"/>
        <rect x="30" y="30" width="740" height="440" rx="10" fill="#0f172a" stroke="#1e293b" stroke-width="4"/>

        <!-- Header -->
        <rect x="50" y="50" width="700" height="50" fill="#1e293b"/>
        <text x="70" y="84" fill="#94a3b8" font-family="monospace" font-size="20">発車時刻  列車名 (Train)    行先 (Destination)   自由席 (Non-Reserved)</text>

        <!-- Line 1: Nozomi -->
        <rect x="50" y="110" width="700" height="100" fill="#172554"/>
        <text x="70" y="155" fill="#facc15" font-family="monospace" font-weight="900" font-size="34">10:30</text>
        <text x="180" y="155" fill="#38bdf8" font-family="monospace" font-weight="900" font-size="30">のぞみ 25号</text>
        <text x="400" y="155" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="30">新大阪</text>
        <rect x="560" y="125" width="160" height="46" rx="6" fill="#2563eb"/>
        <text x="580" y="157" fill="#ffffff" font-family="monospace" font-weight="bold" font-size="24">1-3号車</text>
        <text x="70" y="195" fill="#93c5fd" font-size="18">停車駅: 品川、新横浜、名古屋、京都、新大阪</text>

        <!-- Line 2: Hikari -->
        <rect x="50" y="230" width="700" height="100" fill="#14532d"/>
        <text x="70" y="275" fill="#facc15" font-family="monospace" font-weight="900" font-size="34">10:45</text>
        <text x="180" y="275" fill="#4ade80" font-family="monospace" font-weight="900" font-size="30">ひかり 509号</text>
        <text x="400" y="275" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="30">岡山</text>
        <rect x="560" y="245" width="160" height="46" rx="6" fill="#16a34a"/>
        <text x="580" y="277" fill="#ffffff" font-family="monospace" font-weight="bold" font-size="24">1-5号車</text>
        <text x="70" y="315" fill="#86efac" font-size="18">停車駅: 静岡・浜松・名古屋・京都・新大阪・新神戸</text>

        <!-- Line 3: Notice -->
        <rect x="50" y="350" width="700" height="90" fill="#7f1d1d"/>
        <text x="70" y="405" fill="#fef08a" font-family="sans-serif" font-weight="bold" font-size="26">⚠ 特急券・指定席券をお確かめの上、ご乗車ください</text>
      </svg>
    `),
    signs: [
      {
        id: 'sh_1',
        japanese: 'のぞみ 25号 (新大阪行)',
        hiragana: 'のぞみ にじゅうごごう',
        romaji: 'nozomi nijuugogou (Shin-Osaka)',
        chinese: '希望號（Nozomi）25號 往新大阪',
        category: 'transit',
        box_pct: [22, 6, 42, 94],
        explanation: '東海道新幹線速度最快、停靠站最少之旗艦列車。東京至京都只需2小時15分。',
        actionTip: 'JR 全國 PASS 需補差價才能搭乘 Nozomi，持 JR PASS 者建議搭乘 Hikari 號。'
      },
      {
        id: 'sh_2',
        japanese: '自由席 1-3号車',
        hiragana: 'じゆうせき いちからさんごうしゃ',
        romaji: 'jiyuuseki 1-3 gousha',
        chinese: '自由座車廂：第1至第3節車廂',
        category: 'transit',
        box_pct: [25, 70, 35, 92],
        explanation: '未購買指定席票券的旅客，只能前往月台地面標記的 1~3 號車廂排隊上車。',
        actionTip: '尖峰出發請在發車前 15~20 分鐘至月台自由席地貼前排隊以取得靠窗或連號座位。'
      },
      {
        id: 'sh_3',
        japanese: 'ひかり 509号 (自由席 1-5号車)',
        hiragana: 'ひかり ごひゃくきゅうごう',
        romaji: 'hikari gohyakukyuugou',
        chinese: '光號（Hikari）509號（自由席為1-5號車）',
        category: 'transit',
        box_pct: [46, 6, 66, 94],
        explanation: '速度僅次於 Nozomi，中途停靠靜岡、濱松等較大站，持 JR PASS 可免費預約搭乘。',
        actionTip: '若持 JR Pass，到綠色窗口（みどりの窓口）免費劃指定席即可保證有座位。'
      }
    ]
  },
  {
    id: 'scene_vertical_signs',
    title: '京都神社・傳統居酒屋木札門簾（直排縱書・行排標示）',
    subtitle: '直行豎排文字、門面柱子木牌與行書書法',
    location: '京都祇園 / 淺草傳統街區',
    category: 'road_sign',
    summary: '日本傳統建築、神社與居酒屋經典直行縱書（縦書き）招牌與立柱警示告示。',
    importantNotice: '直排（縱書）日文是由上至下、由右至左閱讀，本系統已全面支援直行文字高精準度偵測。',
    imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
        <!-- Background: Traditional Japanese Wood & Stone -->
        <rect width="800" height="500" fill="#18181b"/>
        <rect x="20" y="20" width="760" height="460" rx="12" fill="#27272a" stroke="#3f3f46" stroke-width="4"/>

        <!-- Roof Eaves -->
        <path d="M 10 60 L 800 60 L 760 30 L 50 30 Z" fill="#09090b"/>

        <!-- Column 1 (Left Pillar): 立入禁止 (Vertical Warning Sign) -->
        <rect x="60" y="90" width="130" height="350" rx="8" fill="#7f1d1d" stroke="#b91c1c" stroke-width="3"/>
        <text x="125" y="160" fill="#ffffff" font-family="serif" font-weight="900" font-size="44" text-anchor="middle">立</text>
        <text x="125" y="225" fill="#ffffff" font-family="serif" font-weight="900" font-size="44" text-anchor="middle">入</text>
        <text x="125" y="290" fill="#ffffff" font-family="serif" font-weight="900" font-size="44" text-anchor="middle">禁</text>
        <text x="125" y="355" fill="#ffffff" font-family="serif" font-weight="900" font-size="44" text-anchor="middle">止</text>
        <text x="125" y="410" fill="#fecaca" font-family="sans-serif" font-weight="bold" font-size="16" text-anchor="middle">KEEP OUT</text>

        <!-- Column 2 (Center Wooden Plank): 本日のおすすめ (Izakaya Vertical Menu) -->
        <rect x="240" y="90" width="150" height="350" rx="8" fill="#78350f" stroke="#b45309" stroke-width="4"/>
        <text x="315" y="145" fill="#fef3c7" font-family="serif" font-weight="bold" font-size="34" text-anchor="middle">本</text>
        <text x="315" y="195" fill="#fef3c7" font-family="serif" font-weight="bold" font-size="34" text-anchor="middle">日</text>
        <text x="315" y="245" fill="#fef3c7" font-family="serif" font-weight="bold" font-size="34" text-anchor="middle">の</text>
        <text x="315" y="295" fill="#fde68a" font-family="serif" font-weight="bold" font-size="32" text-anchor="middle">お</text>
        <text x="315" y="340" fill="#fde68a" font-family="serif" font-weight="bold" font-size="32" text-anchor="middle">す</text>
        <text x="315" y="385" fill="#fde68a" font-family="serif" font-weight="bold" font-size="32" text-anchor="middle">す</text>
        <text x="315" y="425" fill="#fde68a" font-family="serif" font-weight="bold" font-size="32" text-anchor="middle">め</text>

        <!-- Column 3 (Right Noren Curtain): 営業中 (Vertical Entrance Banner) -->
        <rect x="440" y="90" width="140" height="300" rx="4" fill="#1e3a8a" stroke="#3b82f6" stroke-width="3"/>
        <text x="510" y="180" fill="#ffffff" font-family="serif" font-weight="900" font-size="50" text-anchor="middle">営</text>
        <text x="510" y="260" fill="#ffffff" font-family="serif" font-weight="900" font-size="50" text-anchor="middle">業</text>
        <text x="510" y="340" fill="#ffffff" font-family="serif" font-weight="900" font-size="50" text-anchor="middle">中</text>

        <!-- Column 4 (Far Right Door Sign): 定休日 (Vertical Closed Day) -->
        <rect x="625" y="110" width="120" height="260" rx="6" fill="#1e293b" stroke="#475569" stroke-width="2"/>
        <text x="685" y="170" fill="#e2e8f0" font-family="sans-serif" font-weight="bold" font-size="32" text-anchor="middle">定</text>
        <text x="685" y="225" fill="#e2e8f0" font-family="sans-serif" font-weight="bold" font-size="32" text-anchor="middle">休</text>
        <text x="685" y="280" fill="#e2e8f0" font-family="sans-serif" font-weight="bold" font-size="32" text-anchor="middle">日</text>
        <text x="685" y="340" fill="#cbd5e1" font-size="18" text-anchor="middle">月曜日</text>
      </svg>
    `),
    signs: [
      {
        id: 'vt_1',
        japanese: '立入禁止',
        hiragana: 'たちいりきんし',
        romaji: 'tachiiri kinshi',
        chinese: '嚴禁進入（非工作人員禁止入內）',
        category: 'warning',
        orientation: 'vertical',
        box_pct: [18, 7, 88, 24],
        explanation: '傳統紅色立柱直排縱書警示。私有地、施工區或神社祭祀神域常見。',
        actionTip: '切勿跨越繩索或穿越此門柱，以免觸犯法規。'
      },
      {
        id: 'vt_2',
        japanese: '本日のおすすめ',
        hiragana: 'ほんじつのおすすめ',
        romaji: 'honjitsu no osusume',
        chinese: '今日主廚推薦料理 / 本日招牌',
        category: 'dining',
        orientation: 'vertical',
        box_pct: [18, 30, 88, 50],
        explanation: '居酒屋木札懸掛直排菜單，通常為當天新鮮漁獲或季節限定食材。',
        actionTip: '點餐時可對店員說「おすすめをお願いします」。'
      },
      {
        id: 'vt_3',
        japanese: '営業中',
        hiragana: 'えいぎょうちゅう',
        romaji: 'eigyou chuu',
        chinese: '營業中（歡迎光臨）',
        category: 'road_sign',
        orientation: 'vertical',
        box_pct: [18, 55, 78, 72],
        explanation: '傳統日式店家掛於暖簾上的直排大字，代表正在營業可以進店。',
        actionTip: '直接掀開暖簾推門入內即可就座。'
      },
      {
        id: 'vt_4',
        japanese: '定休日 (月曜日)',
        hiragana: 'ていきゅうび (げつようび)',
        romaji: 'teikyuubi (getsuyoubi)',
        chinese: '固定公休日：每週一公休',
        category: 'facility',
        orientation: 'vertical',
        box_pct: [22, 78, 74, 93],
        explanation: '門扉旁的直行營業時間公告，月曜日即代表星期一休息。',
        actionTip: '行前規劃造訪老店請避開每週公休日。'
      }
    ]
  }
];

// 核心離線快速翻譯引擎 (支援日繁雙向、分詞、文法句型解析與保證 100% 繁體中文)
export function translateOfflineText(
  input: string,
  direction: 'ja-to-zh' | 'zh-to-ja' = 'ja-to-zh'
): {
  originalText: string;
  translatedText: string;
  hiragana: string;
  romaji: string;
  category: string;
  breakdown: { word: string; reading: string; meaning: string }[];
  travelTip: string;
  politeAlternative: string;
} {
  const rawQuery = input.trim();
  if (!rawQuery) {
    return {
      originalText: '',
      translatedText: '',
      hiragana: '',
      romaji: '',
      category: '日常',
      breakdown: [],
      travelTip: '',
      politeAlternative: ''
    };
  }

  // ==========================================
  // 分支 A: 中文 ➔ 日文 (zh-to-ja)
  // ==========================================
  if (direction === 'zh-to-ja') {
    const cleanZh = toTraditionalChinese(rawQuery);
    // 1. 精確搜尋
    const match = OFFLINE_LEXICON.find(
      (item) => item.zh === cleanZh || cleanZh.includes(item.zh) || item.zh.includes(cleanZh)
    );

    if (match) {
      return {
        originalText: rawQuery,
        translatedText: match.ja,
        hiragana: match.kana,
        romaji: match.romaji,
        category: match.cat,
        breakdown: [
          {
            word: match.ja,
            reading: match.kana,
            meaning: toTraditionalChinese(match.zh)
          }
        ],
        travelTip: toTraditionalChinese(match.tip || '點擊語音按鈕可播放真人發音，或直接出示手機螢幕給日本人看。'),
        politeAlternative: `「すみません、${match.ja}をお願いします。」（不好意思，請給我${match.zh}。）`
      };
    }

    // 常用問路中文轉換
    if (cleanZh.includes('在哪裡') || cleanZh.includes('在哪') || cleanZh.includes('怎走')) {
      const targetWord = cleanZh.replace(/在哪裡|在哪|怎麼走|怎走|請問|請教/g, '').trim();
      const targetMatch = OFFLINE_LEXICON.find((item) => cleanZh.includes(item.zh) || item.zh.includes(targetWord));
      const jaTarget = targetMatch ? targetMatch.ja : targetWord;
      const jaKana = targetMatch ? targetMatch.kana : targetWord;
      const jaRomaji = targetMatch ? targetMatch.romaji : '';
      return {
        originalText: rawQuery,
        translatedText: `${jaTarget}はどこですか？`,
        hiragana: `${jaKana}は どこですか？`,
        romaji: `${jaRomaji} wa doko desu ka?`,
        category: 'transit',
        breakdown: [
          {
            word: jaTarget,
            reading: jaKana,
            meaning: toTraditionalChinese(targetMatch ? targetMatch.zh : targetWord)
          },
          {
            word: 'どこですか',
            reading: 'どこですか',
            meaning: '在哪裡？'
          }
        ],
        travelTip: toTraditionalChinese('問路時請先鞠躬並說「すみません（不好意思）」，然後出示此畫面。'),
        politeAlternative: `「すみません、${jaTarget}はどこですか？」（不好意思，請問${targetMatch ? targetMatch.zh : targetWord}在哪裡？）`
      };
    }

    return {
      originalText: rawQuery,
      translatedText: `「${cleanZh}」をお願いします`,
      hiragana: 'おねがいします',
      romaji: 'onegaishimasu',
      category: 'general',
      breakdown: [
        {
          word: cleanZh,
          reading: '-',
          meaning: cleanZh
        }
      ],
      travelTip: toTraditionalChinese('此為離線速查模式。連線時將由 Google Gemini 進行更豐富的情境語意翻譯。'),
      politeAlternative: `「すみません、これ（${cleanZh}）をお願いします。」`
    };
  }

  // ==========================================
  // 分支 B: 日文 ➔ 繁體中文 (ja-to-zh)
  // ==========================================
  const cleanJa = rawQuery.replace(/[！!？?。、\s]+$/g, '');

  // 1. 先檢驗是否有完全精確比對的單詞或路牌
  const exactLexicon = OFFLINE_LEXICON.find(
    (item) => item.ja === cleanJa || item.kana === cleanJa
  );
  if (exactLexicon) {
    return {
      originalText: rawQuery,
      translatedText: toTraditionalChinese(exactLexicon.zh),
      hiragana: exactLexicon.kana,
      romaji: exactLexicon.romaji,
      category: exactLexicon.cat,
      breakdown: [
        {
          word: exactLexicon.ja,
          reading: exactLexicon.kana,
          meaning: toTraditionalChinese(exactLexicon.zh)
        }
      ],
      travelTip: toTraditionalChinese(exactLexicon.tip || '日本常見重要標誌/詞彙。'),
      politeAlternative: toTraditionalChinese(`「すみません、${exactLexicon.ja}はどこですか？」（不好意思，請問${exactLexicon.zh}在哪裡？）`)
    };
  }

  // 內部最長分詞器
  function tokenizeJapanese(text: string): {
    zh: string;
    kana: string;
    romaji: string;
    breakdown: { word: string; reading: string; meaning: string }[];
  } {
    const sorted = [...OFFLINE_LEXICON].sort((a, b) => b.ja.length - a.ja.length);
    const breakdown: { word: string; reading: string; meaning: string }[] = [];
    const zhSegments: string[] = [];
    const kanaSegments: string[] = [];
    const romajiSegments: string[] = [];

    let i = 0;
    while (i < text.length) {
      if (text.startsWith('の', i)) {
        zhSegments.push('的');
        kanaSegments.push('の');
        i += 1;
        continue;
      }
      if (text.startsWith('と', i)) {
        zhSegments.push('和');
        kanaSegments.push('と');
        i += 1;
        continue;
      }
      if (text.startsWith('から', i)) {
        zhSegments.push('從');
        kanaSegments.push('から');
        i += 2;
        continue;
      }
      if (text.startsWith('まで', i)) {
        zhSegments.push('到');
        kanaSegments.push('まで');
        i += 2;
        continue;
      }
      if (text.startsWith('で', i)) {
        zhSegments.push('在');
        kanaSegments.push('で');
        i += 1;
        continue;
      }
      if (text.startsWith('へ', i) || text.startsWith('に', i)) {
        zhSegments.push('往');
        kanaSegments.push(text[i]);
        i += 1;
        continue;
      }

      let matched = false;
      for (const item of sorted) {
        if (text.startsWith(item.ja, i)) {
          zhSegments.push(item.zh);
          kanaSegments.push(item.kana);
          if (item.romaji) romajiSegments.push(item.romaji);
          if (!breakdown.some((b) => b.word === item.ja)) {
            breakdown.push({
              word: item.ja,
              reading: item.kana,
              meaning: toTraditionalChinese(item.zh),
            });
          }
          i += item.ja.length;
          matched = true;
          break;
        }
        if (text.startsWith(item.kana, i) && item.kana.length >= 2) {
          zhSegments.push(item.zh);
          kanaSegments.push(item.kana);
          if (item.romaji) romajiSegments.push(item.romaji);
          if (!breakdown.some((b) => b.word === item.ja)) {
            breakdown.push({
              word: item.ja,
              reading: item.kana,
              meaning: toTraditionalChinese(item.zh),
            });
          }
          i += item.kana.length;
          matched = true;
          break;
        }
      }

      if (!matched) {
        const char = text[i];
        zhSegments.push(toTraditionalChinese(char));
        kanaSegments.push(char);
        i += 1;
      }
    }

    return {
      zh: toTraditionalChinese(zhSegments.join('').replace(/的+/g, '的').trim()),
      kana: kanaSegments.join(' '),
      romaji: romajiSegments.join(' '),
      breakdown,
    };
  }

  // 2. 句型模式匹配 (高頻日本自由行常用句型模組)
  // 句型 1: 〜はどこですか / 〜はどこ (請問...在哪裡？)
  const whereMatch = cleanJa.match(/^(.+?)(?:は|って)?(?:どこですか|どこ)$/);
  if (whereMatch) {
    const subject = whereMatch[1].trim();
    const tokenized = tokenizeJapanese(subject);

    return {
      originalText: rawQuery,
      translatedText: toTraditionalChinese(`請問${tokenized.zh}在哪裡？`),
      hiragana: `${tokenized.kana}は どこですか？`,
      romaji: `${tokenized.romaji} wa doko desu ka?`,
      category: 'transit',
      breakdown: [
        ...tokenized.breakdown,
        {
          word: 'どこですか',
          reading: 'どこですか',
          meaning: '在哪裡？'
        }
      ],
      travelTip: toTraditionalChinese(`向站務員或店員詢問時可直接播放語音或出示本卡片。`),
      politeAlternative: `「すみません、${subject}はどこですか？」`
    };
  }

  // 句型 2: 〜をください / 〜をお願いします / 〜ください (請給我... / 麻煩請給我...)
  const pleaseMatch = cleanJa.match(/^(.+?)(?:を|のお)?(?:ください|おねがいします|お願いします)$/);
  if (pleaseMatch) {
    const itemTarget = pleaseMatch[1].trim();
    const tokenized = tokenizeJapanese(itemTarget);

    return {
      originalText: rawQuery,
      translatedText: toTraditionalChinese(`麻煩請給我${tokenized.zh}`),
      hiragana: `${tokenized.kana}を ください`,
      romaji: `${tokenized.romaji} o kudasai`,
      category: 'dining',
      breakdown: [
        ...tokenized.breakdown,
        {
          word: 'ください',
          reading: 'ください',
          meaning: '請給我'
        }
      ],
      travelTip: toTraditionalChinese(`點餐或購買時的禮貌用語。`),
      politeAlternative: `「すみません、${itemTarget}をお願いします。」`
    };
  }

  // 句型 3: 〜はありますか / 〜ありますか (請問有...嗎？)
  const haveMatch = cleanJa.match(/^(.+?)(?:は|って)?(?:ありますか|あります)$/);
  if (haveMatch) {
    const itemTarget = haveMatch[1].trim();
    const tokenized = tokenizeJapanese(itemTarget);

    return {
      originalText: rawQuery,
      translatedText: toTraditionalChinese(`請問有${tokenized.zh}嗎？`),
      hiragana: `${tokenized.kana}は ありますか？`,
      romaji: `${tokenized.romaji} wa arimasu ka?`,
      category: 'shopping',
      breakdown: [
        ...tokenized.breakdown,
        {
          word: 'ありますか',
          reading: 'ありますか',
          meaning: '有...嗎？'
        }
      ],
      travelTip: toTraditionalChinese('詢問店員是否有特定餐點、中文菜單、免稅或商品庫存時使用。'),
      politeAlternative: `「すみません、${itemTarget}はありますか？」`
    };
  }

  // 句型 4: 〜使えますか / 〜できますか (請問能使用/能辦理...嗎？)
  const canUseMatch = cleanJa.match(/^(.+?)(?:は|って)?(?:使えますか|できますか|可能ですか)$/);
  if (canUseMatch) {
    const toolTarget = canUseMatch[1].trim();
    const tokenized = tokenizeJapanese(toolTarget);

    return {
      originalText: rawQuery,
      translatedText: toTraditionalChinese(`請問可以使用 / 能辦理${tokenized.zh}嗎？`),
      hiragana: `${tokenized.kana}は つかえますか？`,
      romaji: `${tokenized.romaji} wa tsukaemasu ka?`,
      category: 'shopping',
      breakdown: [
        ...tokenized.breakdown,
        {
          word: '使えますか',
          reading: 'つかえますか',
          meaning: '可以使用嗎？'
        }
      ],
      travelTip: toTraditionalChinese('結帳付款前向店員確認信用卡、電子支付或免稅手續。'),
      politeAlternative: `「すみません、${toolTarget}は使えますか？」`
    };
  }

  // 3. 通用分詞解析
  const tokenizedGeneral = tokenizeJapanese(cleanJa);
  const firstMatched = tokenizedGeneral.breakdown[0];
  const travelTip = firstMatched
    ? toTraditionalChinese(`自由行重點提示：涵蓋關鍵詞【${tokenizedGeneral.breakdown.map((m) => `${m.word}：${m.meaning}`).join('、')}】。可在手機離線收藏中隨時查閱。`)
    : toTraditionalChinese('已離線比對日本常用漢字與交通標示。連線時將由 Google Gemini 提供深度多輪語意解說。');

  return {
    originalText: rawQuery,
    translatedText: tokenizedGeneral.zh || toTraditionalChinese(rawQuery),
    hiragana: tokenizedGeneral.kana,
    romaji: tokenizedGeneral.romaji || 'nihongo',
    category: firstMatched ? 'transit' : 'general',
    breakdown: tokenizedGeneral.breakdown,
    travelTip,
    politeAlternative: `「すみません、これ（${firstMatched ? firstMatched.word : rawQuery}）について教えていただけますか？」（不好意思，可以請教一下這個嗎？）`
  };
}
