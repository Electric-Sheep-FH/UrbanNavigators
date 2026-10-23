import { StatusService } from './status.service';

describe('StatusService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('est "up" quand tous les services répondent', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));

    const status = await new StatusService().getStatus();

    expect(status.status).toBe('up');
    expect(status.services).toHaveLength(6);
  });

  it('est "dégradé" quand un service ne répond pas', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(async (input) => {
      if (String(input).includes('realtime')) throw new Error('ECONNREFUSED');
      return new Response('{}', { status: 200 });
    });

    const status = await new StatusService().getStatus();

    expect(status.status).toBe('degraded');
    expect(status.services.find((s) => s.service === 'realtime')).toMatchObject({
      status: 'down',
      latencyMs: null,
    });
  });
});
