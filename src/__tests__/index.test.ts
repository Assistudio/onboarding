/**
 * Smoke tests — ensures the environment is correctly configured
 */

describe('Environment sanity check', () => {
  it('should run tests', () => {
    expect(true).toBe(true);
  });

  it('should support TypeScript', () => {
    const greet = (name: string): string => `Hello, ${name}!`;
    expect(greet('Assistudio')).toBe('Hello, Assistudio!');
  });
});
