import { describe, it, expect } from 'vitest';
import {
  formatEmailAddress,
  formatEmailAddresses,
  isTemplateResult,
} from './types';
import { jsx } from './jsx-runtime';

describe('EmailAddress formatting', () => {
  describe('formatEmailAddress', () => {
    it('returns string addresses unchanged', () => {
      expect(formatEmailAddress('john@example.com')).toBe('john@example.com');
    });

    it('formats named addresses to RFC 5322 format', () => {
      expect(
        formatEmailAddress({ name: 'John Doe', email: 'john@example.com' })
      ).toBe('John Doe <john@example.com>');
    });

    it('handles names with commas by quoting', () => {
      expect(
        formatEmailAddress({ name: 'Doe, John', email: 'john@example.com' })
      ).toBe('"Doe, John" <john@example.com>');
    });

    it('handles names with quotes by escaping', () => {
      expect(
        formatEmailAddress({ name: 'John "Johnny" Doe', email: 'john@example.com' })
      ).toBe('"John \\"Johnny\\" Doe" <john@example.com>');
    });

    it('handles simple names without special characters', () => {
      expect(
        formatEmailAddress({ name: 'Support Team', email: 'support@example.com' })
      ).toBe('Support Team <support@example.com>');
    });
  });

  describe('formatEmailAddresses', () => {
    it('formats a single string address', () => {
      expect(formatEmailAddresses('john@example.com')).toBe('john@example.com');
    });

    it('formats a single named address', () => {
      expect(
        formatEmailAddresses({ name: 'John', email: 'john@example.com' })
      ).toBe('John <john@example.com>');
    });

    it('formats multiple string addresses', () => {
      expect(
        formatEmailAddresses(['a@example.com', 'b@example.com'])
      ).toBe('a@example.com, b@example.com');
    });

    it('formats multiple named addresses', () => {
      expect(
        formatEmailAddresses([
          { name: 'Alice', email: 'alice@example.com' },
          { name: 'Bob', email: 'bob@example.com' },
        ])
      ).toBe('Alice <alice@example.com>, Bob <bob@example.com>');
    });

    it('formats mixed address types', () => {
      expect(
        formatEmailAddresses([
          'plain@example.com',
          { name: 'Named User', email: 'named@example.com' },
        ])
      ).toBe('plain@example.com, Named User <named@example.com>');
    });
  });
});

describe('isTemplateResult', () => {
  it('returns true for TemplateResult objects', () => {
    const result = {
      body: jsx('div', { children: 'test' }),
      meta: { subject: 'Test' },
    };
    expect(isTemplateResult(result)).toBe(true);
  });

  it('returns true for TemplateResult without meta', () => {
    const result = {
      body: jsx('div', { children: 'test' }),
    };
    expect(isTemplateResult(result)).toBe(true);
  });

  it('returns false for VNode objects', () => {
    const vnode = jsx('div', { children: 'test' });
    expect(isTemplateResult(vnode)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isTemplateResult(null as any)).toBe(false);
  });
});
