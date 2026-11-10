import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { buildPolicy, inlineScriptHashes, injectCsp } from '../csp';

const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('base64');

describe('CSP build plugin', () => {
  it('hashes only inline executable scripts', () => {
    const html = [
      '<script type="application/ld+json">{"a":1}</script>',
      '<script>var x = 1;</script>',
      '<script async src="https://www.googletagmanager.com/gtag/js"></script>',
      '<script type="module" crossorigin src="/assets/main.js"></script>',
    ].join('\n');
    expect(inlineScriptHashes(html)).toEqual([sha('var x = 1;')]);
  });

  it('places the policy directly after <meta charset>', () => {
    const out = injectCsp('<head>\n<meta charset="UTF-8" />\n<script>go()</script>\n</head>');
    const lines = out.split('\n').map((l) => l.trim());
    expect(lines[1]).toBe('<meta charset="UTF-8" />');
    expect(lines[2]).toMatch(/^<meta http-equiv="Content-Security-Policy"/);
    expect(out).toContain(`'sha256-${sha('go()')}'`);
  });

  it('refuses to build without <meta charset>', () => {
    expect(() => injectCsp('<head></head>')).toThrow(/charset/);
  });

  it('locks down the dangerous directives', () => {
    const p = buildPolicy([]);
    expect(p).toContain("object-src 'none'");
    expect(p).toContain("base-uri 'self'");
    expect(p).not.toMatch(/script-src[^;]*'unsafe-(inline|eval)'/);
  });
});
