import { describe, expect, it } from 'vitest';
import { normalizeUrl, displayUrl } from '../src/renderer/shared/utils/url';

describe('normalizeUrl', () => {
  it('adds https:// when protocol missing', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com/');
    expect(normalizeUrl(' example.com/path ')).toBe('https://example.com/path');
  });

  it('keeps explicit protocols', () => {
    expect(normalizeUrl('http://a.com')).toBe('http://a.com/');
    expect(normalizeUrl('https://a.com')).toBe('https://a.com/');
    expect(normalizeUrl('file:///tmp/a.html')).toBe('file:///tmp/a.html');
  });

  it('rejects disallowed protocols and invalid input', () => {
    expect(normalizeUrl('ftp://a.com')).toBeNull();
    expect(normalizeUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeUrl('')).toBeNull();
    expect(normalizeUrl('   ')).toBeNull();
  });
});

describe('displayUrl', () => {
  it('strips protocol for http(s)', () => {
    expect(displayUrl('https://example.com/page')).toBe('example.com/page');
    expect(displayUrl('https://example.com/')).toBe('example.com');
  });

  it('returns path for file urls', () => {
    expect(displayUrl('file:///tmp/a.html')).toBe('/tmp/a.html');
  });
});
