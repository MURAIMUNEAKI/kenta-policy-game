import { CharacterConfig, CharacterId, PolicyCategory, PolicyDefinition } from '../types/game';

export const CHARACTERS: Record<CharacterId, CharacterConfig> = {
  kenta_leader: {
    id: 'kenta_leader',
    name: 'ケンタ議員',
    subtitle: '現場第一の情熱ランナー',
    description: '市民の声をしっかり届ける！声アイテムの獲得スコアが+30%アップする王道スタイル。',
    speed: 7.2,
    dashSpeed: 11.5,
    width: 48,
    height: 56,
    specialAbility: '地域の声スコア +30% & コンボ持続UP',
    accentColor: '#3b82f6',
  },
  kenta_car: {
    id: 'kenta_car',
    name: 'まち巡回エコカー',
    subtitle: '街中を駆け巡るクリーンEV',
    description: '広いキャッチ判定と最高速！素早く左右へ移動してアイテムを逃さない。',
    speed: 8.8,
    dashSpeed: 13.5,
    width: 66,
    height: 46,
    specialAbility: '移動スピード最速 & キャッチ横幅+35%',
    accentColor: '#10b981',
  },
  kenta_bike: {
    id: 'kenta_bike',
    name: '自転車ケンタ',
    subtitle: '路地裏もスイスイ駆ける機動力',
    description: 'キビキビ小回りが利き、フィーバーゲージがぐんぐん貯まる！',
    speed: 7.8,
    dashSpeed: 12.0,
    width: 52,
    height: 52,
    specialAbility: 'フィーバーゲージ上昇率 +50%',
    accentColor: '#f59e0b',
  },
};

export const POLICIES: Record<PolicyCategory, PolicyDefinition> = {
  child_care: {
    id: 'child_care',
    name: '子育て支援・教育',
    shortName: '子育て',
    icon: '👶',
    color: '#f43f5e',
    description: '待機児童ゼロ、給食無償化、通学路安全',
    points: 150,
  },
  disaster_prep: {
    id: 'disaster_prep',
    name: '防災・減災',
    shortName: '防災',
    icon: '🛡️',
    color: '#0284c7',
    description: '堤防強化、避難所環境向上、IoT防災',
    points: 150,
  },
  digital_dx: {
    id: 'digital_dx',
    name: 'デジタル化・DX',
    shortName: 'DX',
    icon: '💻',
    color: '#8b5cf6',
    description: '行かない市役所、スマホ申請、オープンデータ',
    points: 150,
  },
  local_economy: {
    id: 'local_economy',
    name: '地域活性化・経済',
    shortName: '地域経済',
    icon: '🏪',
    color: '#f59e0b',
    description: '商店街活性化、中小企業支援、地元雇用',
    points: 150,
  },
  healthcare: {
    id: 'healthcare',
    name: '安心の医療・福祉',
    shortName: '医療福祉',
    icon: '🏥',
    color: '#10b981',
    description: '医療費負担軽減、地域包括ケア、介護士処遇改善',
    points: 150,
  },
  green_energy: {
    id: 'green_energy',
    name: 'グリーン・脱炭素',
    shortName: 'グリーン',
    icon: '🌿',
    color: '#059669',
    description: '省エネ住宅支援、再エネ普及、豊かな緑化',
    points: 150,
  },
};

export const CITIZEN_VOICES = [
  { text: '保育園の空きを増やして！', category: 'child_care' as PolicyCategory },
  { text: '給食費の無償化を進めて！', category: 'child_care' as PolicyCategory },
  { text: '通学路にガードレールを！', category: 'child_care' as PolicyCategory },
  { text: '河川の堤防を強くして！', category: 'disaster_prep' as PolicyCategory },
  { text: '避難所のWi-Fiと段ボールベッド！', category: 'disaster_prep' as PolicyCategory },
  { text: '地震対策の家具固定補助を！', category: 'disaster_prep' as PolicyCategory },
  { text: 'スマホで行政手続き完結したい！', category: 'digital_dx' as PolicyCategory },
  { text: 'オンライン診療をもっと身近に！', category: 'digital_dx' as PolicyCategory },
  { text: '学校のデジタル学習を支援して！', category: 'digital_dx' as PolicyCategory },
  { text: '地元商店街で使える地域クーポン！', category: 'local_economy' as PolicyCategory },
  { text: '若い世代が定住できる雇用を！', category: 'local_economy' as PolicyCategory },
  { text: '後継者不足の事業者を支えて！', category: 'local_economy' as PolicyCategory },
  { text: '高齢者向けの巡回バスを増やして！', category: 'healthcare' as PolicyCategory },
  { text: '子ども・若者の医療費を無料に！', category: 'healthcare' as PolicyCategory },
  { text: '介護で孤立しない相談窓口を！', category: 'healthcare' as PolicyCategory },
  { text: '緑いっぱいの公園をつくって！', category: 'green_energy' as PolicyCategory },
  { text: '省エネ家電の買い替え補助を！', category: 'green_energy' as PolicyCategory },
  { text: 'クリーンエネルギーで電気代節約！', category: 'green_energy' as PolicyCategory },
];

export const OBSTACLES = {
  waste_cost: {
    name: '無駄なコスト',
    label: '中抜き・ハコモノ',
    icon: '💸',
    color: '#ef4444',
    penalty: -150,
  },
  neglect_task: {
    name: '放置課題',
    label: 'たらい回し・先送り岩',
    icon: '🪨',
    color: '#78716c',
    penalty: -100,
  },
  fake_rumor: {
    name: 'デマ・誹謗中傷',
    label: '足の引っ張り合い',
    icon: '⚡',
    color: '#e11d48',
    penalty: -120,
  },
};

export const INITIAL_TIME_LIMIT = 60; // 60 seconds of thrilling arcade fun
export const FEVER_DURATION = 9; // 9 seconds of fever mode
export const CANVAS_VIRTUAL_WIDTH = 480;
export const CANVAS_VIRTUAL_HEIGHT = 680;
