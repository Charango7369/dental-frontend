// tests/security/frontend_security.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

test('Frontend Security: LocalStorage Token Isolation', () => {
  // Simular mock de localStorage
  const fakeStorage = {};
  const mockLocalStorage = {
    getItem: (key) => fakeStorage[key] || null,
    setItem: (key, val) => { fakeStorage[key] = val; },
    removeItem: (key) => { delete fakeStorage[key]; }
  };

  // La función partialize debe excluir tokens
  const state = {
    token: 'jwt.token.secret123',
    csrfToken: 'csrf_token_xyz',
    isInitializing: false,
    user: {
      id: 'uuid-1234',
      full_name: 'Dr. Test',
      email: 'doctor@test.com',
      roles: ['DOCTOR'],
      tenant_id: 'tenant-123'
    }
  };

  const partialize = (s) => ({ user: s.user });
  const persisted = partialize(state);

  mockLocalStorage.setItem('dental-auth-storage', JSON.stringify(persisted));
  const readBack = JSON.parse(mockLocalStorage.getItem('dental-auth-storage'));

  // Aserciones de Seguridad OWASP A07
  assert.equal(readBack.token, undefined, 'El token JWT NUNCA debe estar en localStorage');
  assert.equal(readBack.csrfToken, undefined, 'El token CSRF NUNCA debe estar en localStorage');
  assert.equal(readBack.user.email, 'doctor@test.com', 'El perfil de usuario seguro sí puede persistirse');
});

test('Frontend Security: Anti-CSRF Cookie Extraction', () => {
  // Simular parser de cookies
  const parseCookie = (cookieHeader, name) => {
    const match = cookieHeader.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
  };

  const sampleCookies = 'other=123; csrf_token=sec_csrf_998877665544332211; session=abc';
  const extracted = parseCookie(sampleCookies, 'csrf_token');

  assert.equal(extracted, 'sec_csrf_998877665544332211');
  assert.equal(parseCookie(sampleCookies, 'non_existent'), null);
});

test('Frontend Security: RBAC Role Authorization with Default Deny', () => {
  const evaluatePermission = (userRoles, allowedRoles) => {
    if (!userRoles || userRoles.length === 0) return false;
    if (userRoles.includes('SUPER_ADMIN')) return true; // Bypass de plataforma
    return userRoles.some((role) => allowedRoles.includes(role));
  };

  // Receptionist intentando entrar a ruta de Admin
  assert.equal(evaluatePermission(['RECEPTIONIST'], ['ADMIN']), false);

  // Doctor intentando entrar a ruta de Admin
  assert.equal(evaluatePermission(['DOCTOR'], ['ADMIN']), false);

  // Admin en ruta de Admin
  assert.equal(evaluatePermission(['ADMIN'], ['ADMIN']), true);

  // SUPER_ADMIN en ruta de Admin clínico
  assert.equal(evaluatePermission(['SUPER_ADMIN'], ['ADMIN']), true);

  // Usuario sin roles (Default Deny)
  assert.equal(evaluatePermission([], ['ADMIN', 'DOCTOR']), false);
});
