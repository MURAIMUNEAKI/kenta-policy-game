import express, { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

interface PolicyStats {
  child_care: number;
  disaster_prep: number;
  digital_dx: number;
  local_economy: number;
  healthcare: number;
  green_energy: number;
}

interface ReportRequestBody {
  score: number;
  collectedPolicies: PolicyStats;
  voicesHeard: number;
  obstaclesAvoided: number;
  obstaclesHit?: number;
  heartsLeft?: number;
  maxCombo: number;
  townName?: string;
  character?: string;
}

const POLICY_NAMES: Record<keyof PolicyStats, string> = {
  child_care: "子育て支援・教育",
  disaster_prep: "防災・減災",
  digital_dx: "デジタル化・DX",
  local_economy: "地域活性化・経済",
  healthcare: "安心の医療・福祉",
  green_energy: "グリーン・脱炭素",
};

function calculateStrictRank(data: ReportRequestBody): string {
  const { score, obstaclesHit = 0, maxCombo = 0, heartsLeft = 3 } = data;

  if (heartsLeft <= 0) {
    return "D";
  }

  // SSS requires mastery: high score, high combo, minimal hits (<= 1)
  if (score >= 6000 && obstaclesHit <= 1 && maxCombo >= 20) {
    return "SSS";
  }
  // SS: Advanced model city
  if (score >= 4800 && obstaclesHit <= 3 && maxCombo >= 15) {
    return "SS";
  }
  // S: Solid, strong performance
  if (score >= 3600 && obstaclesHit <= 5) {
    return "S";
  }
  // A: Good civic development
  if (score >= 2600) {
    return "A";
  }
  // B: Average / work-in-progress
  if (score >= 1700) {
    return "B";
  }
  // C: Struggling / high hazard hits
  if (score >= 900) {
    return "C";
  }
  // D: Needs total rebuild
  return "D";
}

function generateFallbackReport(data: ReportRequestBody) {
  const { score, collectedPolicies, voicesHeard } = data;
  const entries = Object.entries(collectedPolicies) as [keyof PolicyStats, number][];
  entries.sort((a, b) => b[1] - a[1]);

  const topPolicy1 = entries[0];
  const topPolicy2 = entries[1] && entries[1][1] > 0 ? entries[1] : null;

  const top1Name = POLICY_NAMES[topPolicy1[0]];
  const top2Name = topPolicy2 ? POLICY_NAMES[topPolicy2[0]] : "市民の声";

  const rank = calculateStrictRank(data);

  const townTitle = `${top1Name}と${top2Name}が輝く希望のスマートシティ`;
  const catchphrase = `市民の声${voicesHeard}件を直結！みんなで創る持続可能で活気あふれるまちへ`;

  return {
    townTitle,
    catchphrase,
    overallRank: rank,
    summary: `市民の声を丁寧につかみ、${top1Name}を柱に据えた先進的なまちづくりが前進！${topPolicy2 ? `${top2Name}との相乗効果により、` : ""}子どもからお年寄りまで誰もが笑顔で暮らせる確かな安心が広がっています。`,
    headlineNews: [
      `【号外】${top1Name}の実現度が過去最高！市民満足度98%を突破`,
      `地域の声${voicesHeard}件を即座に政策化！現場主義のスピード対応が全国の模範に`,
      `未来志向のまちづくり計画が承認され、若者の定住・起業が加速中`,
    ],
    citizenVoices: [
      {
        resident: "子育て世代の保護者 (30代)",
        quote: "地域の声がしっかりと届いて、日々の安心感がぐっと増しました。このまちでずっと暮らしたいです！",
      },
      {
        resident: "地元商店街の店主 (50代)",
        quote: "現場の課題に素早く向き合ってくれたおかげで、街に明るい活気が戻ってきました！",
      },
      {
        resident: "シニア住民 (70代)",
        quote: "温かい見守りと安心の基盤が整い、毎日の散歩やおしゃべりが一層楽しみになりました。",
      },
    ],
    synergyEffect: `${top1Name}と現場の声が連動することで、行政の無駄を削ぎ落とし、本当に必要な場所へ迅速に予算と支援が届く好循環が生まれています。`,
    kentaComment: "市民の皆さんの声こそが政策の原動力です！これからも現場を走り、一つひとつの声を確かな未来へとカタチにしていきます！",
  };
}

app.post("/api/generate-report", async (req: Request, res: Response) => {
  try {
    const data: ReportRequestBody = req.body;
    const { score, collectedPolicies, voicesHeard, obstaclesAvoided, obstaclesHit = 0, heartsLeft = 3, maxCombo, townName, character } = data;

    const policySummary = Object.entries(collectedPolicies || {})
      .map(([key, count]) => `${POLICY_NAMES[key as keyof PolicyStats] || key}: ${count}個`)
      .join(", ");

    if (!process.env.GEMINI_API_KEY) {
      const fallback = generateFallbackReport(data);
      return res.json({ report: fallback, isFallback: true });
    }

    const calculatedStandardRank = calculateStrictRank(data);

    const prompt = `
あなたは熱意とユーモアあふれる政策企画ジャーナリスト兼まちづくり専門官です。
ドット絵風アクションゲーム「ケンタ政策ゲーム」で、プレイヤーが現場を駆け回り集めた「政策アイテム」と「市民の声」の統計データを元に、【未来のまちづくり新聞 号外レポート】を生成してください。

【プレイ結果データ】
- プレイヤーキャラクター: ${character || "ケンタ議員"}
- 獲得スコア: ${score}点
- 最大コンボ: ${maxCombo}連続
- 実現した政策カード: ${policySummary}
- 聞き届けた地域の声: ${voicesHeard}件
- 回避した無駄コスト・放置課題: ${obstaclesAvoided}件
- 衝突した障害物・課題（被弾数）: ${obstaclesHit}回
- 残り体力（ハート）: ${heartsLeft} / 3
${townName ? `- 希望のまち名・地域: ${townName}` : ""}

【採点・総合ランク判定基準（厳格適用・甘い採点は絶対禁止）】
以下の基準テーブルに【厳格】に従って overallRank を判定してください。過去に毎回SSSが出てしまう不具合があったため、甘い採点は絶対にせず、適切な難易度（SSSは奇跡級のノーミス高得点のみ、通常はA〜C、苦戦時はD）として評価してください：
- "SSS": スコア 6000点以上 かつ 障害物衝突 1回以下 かつ 最大コンボ 20以上（全国トップの奇跡の超スマートシティ）
- "SS": スコア 4800点以上 かつ 障害物衝突 3回以下 かつ 最大コンボ 15以上（先進モデル都市）
- "S": スコア 3600点以上 かつ 障害物衝突 5回以下（優良スマートタウン）
- "A": スコア 2600点以上（着実に前進する希望タウン）
- "B": スコア 1700点以上（課題解決に奮闘中の発展途上都市）
- "C": スコア 900点以上（障害物が多く改善急務なエリア）
- "D": スコア 900点未満 または 残りハート0（再建挑戦中のまち）

※ 参考標準判定ランク: ${calculatedStandardRank} （この基準から大きく外れないように判定してください）

【出力条件】
- トーン: 判定したランク（SSS〜D）にふさわしいトーン（高ランクは快挙を称え、低ランクは障害物や課題の重さに寄り添い奮起を促す）。
- 集めた政策カードの組み合わせを反映し、具体的な「相乗効果（シナジー）」を分析してください。
- 以下のJSONスキーマに厳格に従って出力してください。
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the chief municipal futurist and newspaper editor for the civic game 'Kenta Policy Catch'. Return strictly valid JSON adhering to the specified schema in Japanese.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            townTitle: {
              type: Type.STRING,
              description: "魅力的でキャッチーな未来都市の名称（例: 笑顔と安心がめぐる、DX共創スマートタウン泉）",
            },
            catchphrase: {
              type: Type.STRING,
              description: "まちのキャッチコピー（例: 子育てと防災の好循環！市民幸福度No.1宣言）",
            },
            overallRank: {
              type: Type.STRING,
              description: "総合まちづくりランク（SSS, SS, S, A, B, C, D のいずれか）",
            },
            summary: {
              type: Type.STRING,
              description: "実現したまちの概要と成果をいきいきと伝える要約（120〜180文字程度）",
            },
            headlineNews: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "新聞風の号外見出し（3つ。実現した政策に基づく具体的なニュース）",
            },
            citizenVoices: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  resident: { type: Type.STRING, description: "住民の属性（例: 3児を育てるお母さん、駅前八百屋の店主、IT起業家など）" },
                  quote: { type: Type.STRING, description: "まちの変化を喜ぶ住民のリアルで温かいコメント" },
                },
                required: ["resident", "quote"],
              },
              description: "住民の喜びの声（3件）",
            },
            synergyEffect: {
              type: Type.STRING,
              description: "最も多く拾った政策同士の連携や、地域の声が政策化されたことによる相乗効果の解説",
            },
            kentaComment: {
              type: Type.STRING,
              description: "ケンタからの市民への熱い御礼と次の挑戦への力強いメッセージ",
            },
          },
          required: ["townTitle", "catchphrase", "overallRank", "summary", "headlineNews", "citizenVoices", "synergyEffect", "kentaComment"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    const report = JSON.parse(text);
    return res.json({ report, isFallback: false });
  } catch (error) {
    console.error("Gemini report generation error:", error);
    const fallback = generateFallbackReport(req.body);
    return res.json({ report: fallback, isFallback: true, error: (error as Error).message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
