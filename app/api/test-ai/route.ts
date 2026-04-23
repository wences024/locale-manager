import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      status: 'no_key',
      message: 'OPENAI_API_KEY non è impostata. Le fatture usano il parser mock.',
    });
  }

  // Testa la connessione con una chiamata minima a OpenAI
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (res.ok) {
      return NextResponse.json({
        status: 'ok',
        message: 'GPT-4o è configurato correttamente e pronto ad analizzare le fatture.',
        keyPrefix: apiKey.substring(0, 8) + '...',
      });
    } else {
      const err = await res.json();
      return NextResponse.json({
        status: 'invalid_key',
        message: 'La chiave OpenAI non è valida.',
        error: err?.error?.message,
      });
    }
  } catch (e: any) {
    return NextResponse.json({
      status: 'error',
      message: 'Errore di connessione a OpenAI.',
      error: e?.message,
    });
  }
}
