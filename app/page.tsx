"use client";

import { useEffect, useState } from 'react';

type Material = { id: string; title: string; author: string };

export default function Page() {
  const publishStart = new Date("2026-06-29T08:00:00+09:00");
  const publishEnd = new Date("2026-07-03T12:00:00+09:00");
  const now = new Date();

  if (now < publishStart || now > publishEnd) {
    return (
      <main className="min-h-screen bg-[#f7f1e8] p-6">
        <section className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow">
          <h1 className="text-2xl font-bold">現在は公開期間外です</h1>
          <p className="mt-4">このアプリは、テスト前の学習期間のみ利用できます。</p>
          <p className="mt-2 text-sm text-gray-600">公開期間：2026年6月29日 8:00 ～ 2026年7月3日 12:00</p>
          <p className="mt-6 font-semibold">授業受講生徒限定・転載禁止</p>
        </section>
      </main>
    );
  }
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialId, setMaterialId] = useState('');
  const [summary, setSummary] = useState('');
  const [result, setResult] = useState('');
  const [revisedSummary, setRevisedSummary] = useState('');
  const [revisionResult, setRevisionResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [revisionLoading, setRevisionLoading] = useState(false);

  useEffect(() => {
    fetch('/api/materials').then(r => r.json()).then(data => {
      setMaterials(data.materials || []);
      if (data.materials?.[0]) setMaterialId(data.materials[0].id);
    });
  }, []);

  const selected = materials.find(m => m.id === materialId);
  const summaryCount = summary.length;
  const revisedCount = revisedSummary.length;

  async function gradeFirst() {
    setLoading(true);
    setResult('');
    setRevisionResult('');
    try {
      const res = await fetch('/api/grade-summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ materialId, summary, mode: 'first' }) });
      const data = await res.json();
      setResult(data.result || data.error || '結果を取得できませんでした。');
    } finally { setLoading(false); }
  }

  async function gradeRevision() {
    setRevisionLoading(true);
    setRevisionResult('');
    try {
      const res = await fetch('/api/grade-summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ materialId, summary, revisedSummary, mode: 'revision' }) });
      const data = await res.json();
      setRevisionResult(data.result || data.error || '結果を取得できませんでした。');
    } finally { setRevisionLoading(false); }
  }

  return <main className="wrap">
    <div className="card">
      <h1>要約添削アプリ <span className="badge">2年生用</span></h1>
      <p className="muted">本文は表示されません。教科書・授業プリントを見ながら、200字以内で要約してください。AI添削は参考評価です。</p>
    </div>

    <div className="card">
      <h2>教材を選ぶ</h2>
      <select value={materialId} onChange={e => { setMaterialId(e.target.value); setResult(''); setRevisionResult(''); setSummary(''); setRevisedSummary(''); }}>
        {materials.map(m => <option key={m.id} value={m.id}>{m.title}（{m.author}）</option>)}
      </select>
      {selected && <p className="muted">選択中：{selected.title}</p>}
    </div>

    <div className="card">
      <h2>初回要約</h2>
      <textarea value={summary} maxLength={200} onChange={e => setSummary(e.target.value)} placeholder="ここに200字以内で要約を書いてください。" />
      <div className="row"><span className="note">{summaryCount} / 200字</span><button onClick={gradeFirst} disabled={loading || !summary.trim() || summaryCount > 200}>{loading ? '添削中...' : '添削する'}</button></div>
      {result && <div className="result">{result}</div>}
    </div>

    {result && <div className="card">
      <h2>改善版要約</h2>
      <p className="muted">初回添削を参考に、自分でもう一度200字以内で書き直してください。改善版を添削すると、最後にAI改善例が表示されます。</p>
      <textarea value={revisedSummary} maxLength={200} onChange={e => setRevisedSummary(e.target.value)} placeholder="ここに改善版を書いてください。" />
      <div className="row"><span className="note">{revisedCount} / 200字</span><button onClick={gradeRevision} disabled={revisionLoading || !revisedSummary.trim() || revisedCount > 200}>{revisionLoading ? '再添削中...' : '改善版を添削する'}</button></div>
      {revisionResult && <div className="result">{revisionResult}</div>}
    </div>}
  </main>;
}
