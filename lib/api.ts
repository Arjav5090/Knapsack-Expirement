export async function sendSession(session: {
    participantId: string;
    testId: string;
    events: Array<{ type: string; payload?: any; ts?: string }>;
    metadata?: { durationMs?: number; userAgent?: string };
  }) {
    const res = await fetch('http://localhost:8787/api/v1/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer supersecuretoken'
      },
      body: JSON.stringify(session)
    });
  
    if (!res.ok) {
      console.error('[sendSession] failed', await res.json());
      throw new Error('Session upload failed');
    }
  
    return res.json();
  }
  