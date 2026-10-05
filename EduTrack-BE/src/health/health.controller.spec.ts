import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('reports an ok status', () => {
    expect(new HealthController().check()).toEqual({
      status: 'ok',
      timestamp: expect.any(String) as string,
    });
  });
});
