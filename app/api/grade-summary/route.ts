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
}

function buildPrompt(mode: Mode, material: ReturnType<typeof getMaterial>, summary: string, revisedSummary?: string) {
  if (!material) return '';
  const common = `あなたは高校国語の教師です。生徒の現代文要約を添削してください。

【重要な方針】
模範要約は参考例です。表現や構成が異なっていても、本文の重要内容が含まれていれば評価してください。
模範要約との一致度ではなく、本文理解と要約としての質を評価してください。
本文にない内容の創作、重要内容の欠落、論理関係の崩れを重視して判断してください。
200字以内という条件も評価してください。

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

【改善版の生徒要約】
${revisedSummary || ''}

改善版を添削してください。最後にAI改善例も表示してください。
出力は次の形式を必ず守ってください。

【改善版の得点】
0〜100の整数で「n / 100点」と表示してください。

【改善された点】
・2つ書いてください。

【まだ足りない点】
・最大3つまで書いてください。

【評価表】
各項目の先頭に必ず ○・△・× のどれかを付けてください。
○ 重要内容を押さえている
△ 論理の流れが分かる
× 表現が簡潔である
○ 200字以内でまとめている
のように、4〜5項目で評価してください。

【AI改善例】
200字以内で、本文の重要内容を押さえた改善例を1つ示してください。

最後に次の注意書きをそのまま表示してください。
※この添削はAIによる参考評価です。最終的な理解は、授業・教科書・配布資料で確認してください。`;
  }

  return `${common}
【生徒要約】
${summary}

初回要約を添削してください。まだAI改善例は表示しないでください。
出力は次の形式を必ず守ってください。

【得点】
0〜100の整数で「n / 100点」と表示してください。

【良かった点】
・必ず2つ書いてください。

【改善点】
・最大3つまで書いてください。

【評価表】
各項目の先頭に必ず ○・△・× のどれかを付けてください。
○ 重要内容を押さえている
△ 論理の流れが分かる
× 表現が簡潔である
○ 200字以内でまとめている
のように、4〜5項目で評価してください。

最後に次の注意書きをそのまま表示してください。
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
    if (!target || String(target).trim().length === 0) {
      return Response.json({ error: '要約を入力してください。' }, { status: 400 });
    }
    if (String(target).length > 200) {
      return Response.json({ error: '要約は200字以内で入力してください。' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ result: fallback(actualMode), mode: 'fallback' });
    }

    const prompt = buildPrompt(actualMode, material, String(summary || ''), String(revisedSummary || ''));
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
