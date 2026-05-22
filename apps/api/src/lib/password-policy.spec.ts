import {
  PASSWORD_STRENGTH_PATTERN,
  PASSWORD_TOO_WEAK_CODE,
  passwordMeetsPolicy,
} from './password-policy';

describe('password-policy', () => {
  describe('passwordMeetsPolicy', () => {
    it('accepts a password with uppercase + digit + symbol + ≥12 chars', () => {
      expect(passwordMeetsPolicy('Strong!Pass99')).toBe(true);
      expect(passwordMeetsPolicy('AnotherOne1#Long')).toBe(true);
    });

    it('rejects a password shorter than 12 characters', () => {
      expect(passwordMeetsPolicy('Sh0rt!Aa')).toBe(false);
    });

    it('rejects a password without an uppercase letter', () => {
      expect(passwordMeetsPolicy('lowercase1!only')).toBe(false);
    });

    it('rejects a password without a digit', () => {
      expect(passwordMeetsPolicy('NoDigitsHere!!')).toBe(false);
    });

    it('rejects a password without a symbol', () => {
      expect(passwordMeetsPolicy('NoSymbolsHere1')).toBe(false);
    });

    it('rejects an empty password', () => {
      expect(passwordMeetsPolicy('')).toBe(false);
    });

    it('rejects a password longer than 128 characters', () => {
      const over = 'A1!' + 'a'.repeat(130);
      expect(passwordMeetsPolicy(over)).toBe(false);
    });
  });

  describe('constants', () => {
    it('exposes a stable code for clients to localise', () => {
      expect(PASSWORD_TOO_WEAK_CODE).toBe('PASSWORD_TOO_WEAK');
    });

    it('exposes the regex pattern used by class-validator @Matches', () => {
      expect(PASSWORD_STRENGTH_PATTERN.test('Strong!Pass99')).toBe(true);
      expect(PASSWORD_STRENGTH_PATTERN.test('weak')).toBe(false);
    });
  });
});
