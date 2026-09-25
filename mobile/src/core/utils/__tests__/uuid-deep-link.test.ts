import { isValidUuid } from '../../utils/uuid.util';
import { extractResetTokenFromUrl } from '../../utils/deep-link.util';

describe('isValidUuid', () => {
  it('aceita UUID v4 valido', () => {
    expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('rejeita valor invalido', () => {
    expect(isValidUuid('nao-e-uuid')).toBe(false);
    expect(isValidUuid('')).toBe(false);
    expect(isValidUuid(null)).toBe(false);
  });
});

describe('extractResetTokenFromUrl', () => {
  it('extrai token do deep link nutri4you', () => {
    expect(
      extractResetTokenFromUrl(
        'nutri4you://redefinir-senha?token=550e8400-e29b-41d4-a716-446655440000'
      )
    ).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('retorna null sem query token', () => {
    expect(extractResetTokenFromUrl('nutri4you://home')).toBeNull();
  });
});
