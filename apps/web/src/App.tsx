import { useCallback, useEffect, useState } from 'react';
import type { PlatformStatus } from '@un/contracts';

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; data: PlatformStatus };

export function App() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setState({ kind: 'ready', data: (await res.json()) as PlatformStatus });
    } catch (err) {
      setState({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main>
      <h1>Urban Navigators</h1>
      <p>Squelette de la plateforme : état des services métier vu depuis la gateway.</p>
      <button type="button" onClick={() => void load()}>
        Actualiser
      </button>

      <div aria-live="polite">
        {state.kind === 'loading' && <p>Chargement…</p>}
        {state.kind === 'error' && <p role="alert">Gateway injoignable ({state.message}).</p>}
        {state.kind === 'ready' && (
          <table>
            <caption>
              Plateforme {state.data.status === 'up' ? 'opérationnelle' : 'dégradée'}
            </caption>
            <thead>
              <tr>
                <th scope="col">Service</th>
                <th scope="col">État</th>
                <th scope="col">Latence</th>
              </tr>
            </thead>
            <tbody>
              {state.data.services.map((s) => (
                <tr key={s.service}>
                  <td>{s.service}</td>
                  <td data-status={s.status}>{s.status === 'up' ? 'Disponible' : 'Indisponible'}</td>
                  <td>{s.latencyMs === null ? '—' : `${s.latencyMs} ms`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
