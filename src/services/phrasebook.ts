export interface PhraseItem {
  id: string;
  category: 'transit' | 'dining' | 'shopping' | 'hotel' | 'emergency';
  japanese: string;
  hiragana: string;
  romaji: string;
  chinese: string;
  situation: string;
}

export const COMMON_SIGN_KANJI = [
  { kanji: '駅', reading: 'eki', meaning: '車站' },
  { kanji: '口', reading: 'guchi', meaning: '出入口' },
  { kanji: '出', reading: 'de', meaning: '出/出發' },
  { kanji: '入', reading: 'iri', meaning: '進/入口' },
  { kanji: '禁', reading: 'kin', meaning: '禁止' },
  { kanji: '止', reading: 'tome', meaning: '停止' },
  { kanji: '改', reading: 'kai', meaning: '檢票/修改' },
  { kanji: '札', reading: 'satsu', meaning: '車票/紙鈔' },
  { kanji: '切', reading: 'kippu', meaning: '切符/車票' },
  { kanji: '符', reading: 'fu', meaning: '票券' },
  { kanji: '席', reading: 'seki', meaning: '座位' },
  { kanji: '税', reading: 'zei', meaning: '稅（免稅/含稅）' },
  { kanji: '免', reading: 'men', meaning: '免除' },
  { kanji: '割', reading: 'wari', meaning: '折扣' },
  { kanji: '湯', reading: 'yu', meaning: '溫泉/熱水' },
  { kanji: '線', reading: 'sen', meaning: '鐵路路線' },
  { kanji: '停', reading: 'tei', meaning: '暫停/站牌' },
  { kanji: '歩', reading: 'ho', meaning: '步行' },
  { kanji: '駐', reading: 'chuu', meaning: '停駐(車/單車)' },
  { kanji: '輪', reading: 'rin', meaning: '車輪(腳踏車)' },
  { kanji: '車', reading: 'sha', meaning: '車輛' },
  { kanji: '清', reading: 'sei', meaning: '清掃/精算' },
  { kanji: '定', reading: 'tei', meaning: '定食/指定' },
  { kanji: '替', reading: 'kae', meaning: '替換/加麵' },
  { kanji: '警', reading: 'kei', meaning: '警察/警報' },
  { kanji: '署', reading: 'sho', meaning: '警署/官署' },
];

export const TRAVEL_PHRASES: PhraseItem[] = [
  // 交通 / 路牌
  {
    id: 'ph_1',
    category: 'transit',
    japanese: 'すみません、この電車は新宿に行きますか？',
    hiragana: 'すみません、このでんしゃは しんじゅくに いきますか？',
    romaji: 'sumimasen, kono densha wa Shinjuku ni ikimasu ka?',
    chinese: '不好意思，請問這班電車有到新宿嗎？',
    situation: '在月台向站務員或乘客確認方向時'
  },
  {
    id: 'ph_2',
    category: 'transit',
    japanese: '改札口はどちらですか？',
    hiragana: 'かいさつぐちは どちらですか？',
    romaji: 'kaisatsuguchi wa dochira desu ka?',
    chinese: '請問驗票剪票口在往哪邊？',
    situation: '在大型迷宮地下街迷路找不到車站閘門時'
  },
  {
    id: 'ph_3',
    category: 'transit',
    japanese: 'ICカードのチャージはどこでできますか？',
    hiragana: 'あいしーかーどの ちゃーじは どこで できますか？',
    romaji: 'aishii kaado no chaaji wa doko de dekimasu ka?',
    chinese: '請問哪裡可以為西瓜卡/IC卡加值？',
    situation: '卡片餘額不足需要找加值機或超商時'
  },
  {
    id: 'ph_4',
    category: 'transit',
    japanese: '次の駅で降ります。',
    hiragana: 'つぎのえきで おります。',
    romaji: 'tsugi no eki de orimasu.',
    chinese: '我下一站就要下車了（藉過一下）。',
    situation: '電車人潮過於擁擠要往車門移動時'
  },
  {
    id: 'ph_5',
    category: 'transit',
    japanese: '成田空港行きのバス乗り場はどこですか？',
    hiragana: 'なりたくうこうゆきの ばすのりばは どこですか？',
    romaji: 'Narita kuukou yuki no basu noriba wa doko desu ka?',
    chinese: '請問往成田機場的公車/利木津巴士乘車處在哪裡？',
    situation: '退房後準備搭機場巴士時'
  },

  // 餐廳 / 居酒屋
  {
    id: 'ph_6',
    category: 'dining',
    japanese: 'すみません、注文をお願いします。',
    hiragana: 'すみません、ちゅうもんを おねがいします。',
    romaji: 'sumimasen, chuumon o onegaishimasu.',
    chinese: '不好意思，請幫我點餐。',
    situation: '在餐廳舉手呼叫店員點餐時'
  },
  {
    id: 'ph_7',
    category: 'dining',
    japanese: 'おすすめのメニューは何ですか？',
    hiragana: 'おすすめの めにゅーは なんですか？',
    romaji: 'osusume no menyuu wa nan desu ka?',
    chinese: '請問店裡的招牌推薦菜色是什麼？',
    situation: '看不懂日文菜單不知該點什麼時'
  },
  {
    id: 'ph_8',
    category: 'dining',
    japanese: 'これと同じものをもう一つください。',
    hiragana: 'これと おなじものを もうひとつ ください。',
    romaji: 'kore to onaji mono o mou hitotsu kudasai.',
    chinese: '請再給我一份和這個一樣的。',
    situation: '餐點好吃想再加點一份時'
  },
  {
    id: 'ph_9',
    category: 'dining',
    japanese: 'お会計をお願いします。別々で払えますか？',
    hiragana: 'おかいけいを おねがいします。べつべつで はらえますか？',
    romaji: 'okaikei o onegaishimasu. betsubetsu de haraemasu ka?',
    chinese: '請買單結帳。請問可以分開付帳嗎？',
    situation: '朋友自由行用餐完畢結帳時'
  },
  {
    id: 'ph_10',
    category: 'dining',
    japanese: 'お水をお願いします。',
    hiragana: 'おみずを おねがいします。',
    romaji: 'omizu o onegaishimasu.',
    chinese: '請給我一杯水。',
    situation: '桌上水杯喝完需要續水時'
  },

  // 藥妝 / 購物
  {
    id: 'ph_11',
    category: 'shopping',
    japanese: '免税手続きはできますか？',
    hiragana: 'めんぜいてつづきは できますか？',
    romaji: 'menzei tetsuzuki wa dekimasu ka?',
    chinese: '請問這裡可以辦理外國人退稅嗎？',
    situation: '在唐吉訶德、松本清或電器行結帳前確認'
  },
  {
    id: 'ph_12',
    category: 'shopping',
    japanese: 'パスポートを持っています。',
    hiragana: 'ぱすぽーとを もっています。',
    romaji: 'pasupooto o motte imasu.',
    chinese: '我有隨身攜帶護照正本。',
    situation: '店員詢問是否有護照退稅時'
  },
  {
    id: 'ph_13',
    category: 'shopping',
    japanese: 'クレジットカードは使えますか？',
    hiragana: 'くれじっとかーどは つかえますか？',
    romaji: 'kurejitto kaado wa tsukaemasu ka?',
    chinese: '請問可以刷信用卡嗎？',
    situation: '付帳前確認付款方式'
  },
  {
    id: 'ph_14',
    category: 'shopping',
    japanese: '袋はいりません。',
    hiragana: 'ふくろは いりません。',
    romaji: 'fukuro wa irimasen.',
    chinese: '我不需要塑膠提袋，謝謝。',
    situation: '自備環保購物袋省錢時'
  },

  // 飯店 / 溫泉
  {
    id: 'ph_15',
    category: 'hotel',
    japanese: 'チェックインをお願いします。予約があります。',
    hiragana: 'ちぇっくいんを おねがいします。よやくが あります。',
    romaji: 'chekku in o onegaishimasu. yoyaku ga arimasu.',
    chinese: '我要辦理入住手續，我有事先預約。',
    situation: '到達飯店櫃檯時'
  },
  {
    id: 'ph_16',
    category: 'hotel',
    japanese: 'チェックアウト後、荷物を預かってもらえますか？',
    hiragana: 'ちぇっくあうとご、にもつを あずかってもらえますか？',
    romaji: 'chekku auto go, nimotsu o azukatte moraemasu ka?',
    chinese: '退房之後，可以暫時寄放行李嗎？',
    situation: '最後一天退房想繼續輕鬆逛街時'
  },
  {
    id: 'ph_17',
    category: 'hotel',
    japanese: 'Wi-Fiのパスワードを教えていただけますか？',
    hiragana: 'わいふぁいの ぱすわーどを おしえていただけますか？',
    romaji: 'waifai no pasuwaado o oshiete itadakemasu ka?',
    chinese: '可以告訴我房間的 Wi-Fi 密碼嗎？',
    situation: '回房間需要連網路時'
  },

  // 緊急 / 醫療
  {
    id: 'ph_18',
    category: 'emergency',
    japanese: '助けてください！警察を呼んでください！',
    hiragana: 'たすけてください！けいさつを よんでください！',
    romaji: 'tasukete kudasai! keisatsu o yonde kudasai!',
    chinese: '救命！請幫我叫警察！',
    situation: '遭遇搶劫、糾紛或危急狀況時'
  },
  {
    id: 'ph_19',
    category: 'emergency',
    japanese: 'パスポートと財布を落としてしまいました。',
    hiragana: 'ぱすぽーとと さいふを おとしてしまいました。',
    romaji: 'pasupooto to saifu o otoshite shimaimashita.',
    chinese: '我的護照和皮夾不小心弄丟了。',
    situation: '在派出所（交番）向警員報案遺失時'
  },
  {
    id: 'ph_20',
    category: 'emergency',
    japanese: '気分が悪いです。近くに病院や薬局はありますか？',
    hiragana: 'きぶんが わるいです。ちかくに びょういんや やっきょくは ありますか？',
    romaji: 'kibun ga warui desu. chikaku ni byouin ya yakkyoku wa arimasu ka?',
    chinese: '我身體很不舒服。請問這附近有醫院或藥局嗎？',
    situation: '生病發燒需要就醫或買成藥時'
  }
];
