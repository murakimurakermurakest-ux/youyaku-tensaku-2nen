import { getMaterial } from '../../../lib/materialBank';

type Mode = 'first' | 'revision';

function fallback(mode: Mode) {
  if (mode === 'revision') {
    return `【改善版の得点】
80 / 100点

【改善された点】
・初回よりも重要内容が整理されています。
・本文全体の流れを意識してまとめようとしています。

【まだ足りない点】
・具体例や細部がやや多い場合は、筆者の主張を優先するとよいです。

【評価表】
○ 200字以内でまとめている
△ 重要内容を押さえている
△ 論理の流れが分かる
△ 表現が簡潔である

【AI改善例】
※Gemini APIキーが未設定、または通信に失敗したため、AI改善例は簡易表示です。`;
  }
  return `【得点】
70 / 100点

【良かった点】
・200字以内でまとめようとしています。
・本文の中心内容に触れようとしています。

【改善点】
・筆者の主張をより明確にしましょう。
・具体例よりも、本文全体の論理の流れを優先しましょう。
・結論にあたる内容を入れると要約らしくなります。

【評価表】
△ 重要内容を押さえている
△ 論理の流れが分かる
○ 200字以内でまとめている
△ 表現が簡潔である`;

function buildPrompt(
  mode: Mode,
  material: ReturnType<typeof getMaterial>,
  summary: string,
  revisedSummary?: string,
  charCount?: number,
  lengthMark?: string
) {
  if (!material) return '';

  const common = `
あなたは高校現代文を専門とする国語教師です。
高校2年生の定期考査の採点基準で、生徒の要約を添削してください。

【最重要方針】
・模範要約は唯一の正解ではなく参考例です。
・模範要約との一致度ではなく、本文理解と要約としての質を評価してください。
・表現・語順・構成が異なっていても、本文の重要内容を適切にまとめていれば高く評価してください。
・細かな言い回しだけで減点してはいけません。
・採点は絶対評価で行ってください。

【100点の基準】
100点は次の条件をすべて満たす要約だけです。

①本文の中心主張を正確にまとめている。
②重要な理由・論理展開・結論まで過不足なくまとめている。
③具体例に偏らず、筆者の考えを抽象化して要約している。
④文章が自然で読みやすい。
⑤180〜200字程度で簡潔にまとめられている。

【採点の目安】
95〜100点：本文の重要内容をほぼ完全にまとめている。
90〜94点：重要内容はほぼ押さえているが、一部不足がある。
80〜89点：主張は理解しているが、重要な論理や理由が複数不足している。
70〜79点：大意は理解しているが、本文理解や論理の流れに不足がある。
69点以下：本文理解や要約として大きな課題がある。

【字数について】
・200字以内で評価してください。
・180〜200字を最も望ましい字数とします。
・170字未満の場合は内容が良くても減点対象です。
・150字未満は原則として80点以上を付けないでください。
・120字未満は大幅な減点対象です。
・ただし、字数だけで評価せず、内容とのバランスを考慮してください。

【評価観点】
・本文の中心主張
・重要な理由・論理展開
・結論までまとめられているか
・具体例に偏らず抽象化できているか
・200字以内（望ましくは180〜200字）
・文章の分かりやすさ

【教材名】
${material.title}

【本文】
${material.body}

【参考用の模範要約】
${material.modelSummary}
`;

  if (mode === 'revision') {
    return `${common}

【初回の生徒要約】
${summary}
【字数評価】
生徒要約は${charCount}字です。
この値を必ず使用してください。
評価表には必ず
${lengthMark} 字数（${charCount}字／200字）
と表示してください。
【改善版の生徒要約】
${revisedSummary || ''}

改善版を添削してください。
初回要約と比べて、どこが良くなったかも見てください。
最後にAI改善例を表示してください。

次の形式を必ず守ってください。

【改善版の得点】
0〜100の整数で「n / 100点」と表示してください。

【改善された点】
・2つ書いてください。各80字以内。

【まだ足りない点】
・最大3つまで。各100字以内。
・十分に書けている場合は「大きな不足はありません」と書いてください。

【評価表】
各項目の先頭に必ず ○・△・× のどれかを付けてください。
○ 重要内容を押さえている
○ 論理の流れが分かる
○ 具体例に偏らず抽象化できている
○ 200字以内でまとまっている
○ 表現が簡潔である

【AI改善例】
200字以内で、本文の重要内容を押さえた改善例を1つ示してください。

※この添削はAIによる参考評価です。最終的な理解は、授業・教科書・配布資料で確認してください。`;
  }

  return `${common}

【生徒要約】
${summary}

初回要約を添削してください。
この段階ではAI改善例を表示しないでください。

次の形式を必ず守ってください。

【得点】
0〜100の整数で「n / 100点」と表示してください。

【良かった点】
・必ず2つ書いてください。各80字以内。

【改善点】
・最大3つまで。各100字以内。
・十分に書けている場合は「大きな改善点はありません」と書いてください。

【評価表】
各項目の先頭に必ず ○・△・× のどれかを付けてください。
○ 重要内容を押さえている
○ 論理の流れが分かる
○ 具体例に偏らず抽象化できている
○ 200字以内でまとまっている
○ 表現が簡潔である

※この添削はAIによる参考評価です。最終的な理解は、授業・教科書・配布資料で確認してください。`;
}

export async function POST(req: Request) {
  try {
    const { materialId, summary, revisedSummary, mode } = await req.json();
    const material = getMaterial(materialId);
    const actualMode: Mode = mode === 'revision' ? 'revision' : 'first';

    if (!material) {
      return Response.json({ error: '教材が見つかりません。' }, { status: 404 });
    }
    const target = actualMode === 'revision' ? revisedSummary : summary;
    const charCount = countJapaneseChars(target);
const lengthMark = getLengthEvaluation(charCount);
    if (!target || String(target).trim().length === 0) {
      return Response.json({ error: '要約を入力してください。' }, { status: 400 });
    }
    if (String(target).length > 200) {
      return Response.json({ error: '要約は200字以内で入力してください。' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ result: fallback(actualMode), mode: 'fallback' });
    }

    function countJapaneseChars(text: string) {
  return text.replace(/\s/g, '').length;
}

function getLengthEvaluation(count: number) {
  if (count >= 180 && count <= 200) return '○';
  if (count >= 170 && count <= 179) return '△';
  return '×';
}
    
    const prompt = buildPrompt(
  actualMode,
  material,
  String(summary || ''),
  String(revisedSummary || ''),
  charCount,
  lengthMark
);
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const text = await geminiRes.text();
      console.error('Gemini API error:', text);
      return Response.json({ result: fallback(actualMode), mode: 'fallback' });
    }

    const data = await geminiRes.json();
    const result = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('\n') || fallback(actualMode);
    return Response.json({ result, mode: 'gemini' });
  } catch (e) {
    console.error(e);
    return Response.json({ error: '添削中にエラーが発生しました。' }, { status: 500 });
  }
}
