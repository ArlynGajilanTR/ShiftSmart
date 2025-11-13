import { hashPassword, comparePassword } from '@/lib/auth/password';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
      expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt format
    });

    it('should generate different hashes for same password', async () => {
      const password = 'testpassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle special characters in password', async () => {
      const password = 'P@ssw0rd!#$%^&*()';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
    });

    it('should handle very long passwords', async () => {
      const password = 'a'.repeat(200);
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
    });

    it('should throw error for empty password', async () => {
      await expect(hashPassword('')).rejects.toThrow();
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);

      const result = await comparePassword(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword123';
      const hash = await hashPassword(password);

      const result = await comparePassword(wrongPassword, hash);
      expect(result).toBe(false);
    });

    it('should be case sensitive', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);

      const result = await comparePassword('testpassword123', hash);
      expect(result).toBe(false);
    });

    it('should handle special characters correctly', async () => {
      const password = 'P@ssw0rd!#$%';
      const hash = await hashPassword(password);

      const result = await comparePassword(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for empty password', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);

      const result = await comparePassword('', hash);
      expect(result).toBe(false);
    });

    it('should return false for invalid hash', async () => {
      const result = await comparePassword('password', 'invalid-hash');
      expect(result).toBe(false);
    });
  });

  describe('Password Security', () => {
    it('should use strong hashing (bcrypt)', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);

      // Bcrypt hashes start with $2a$, $2b$, or $2y$
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('should take reasonable time to hash (not too fast)', async () => {
      const password = 'testpassword123';
      const startTime = Date.now();

      await hashPassword(password);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should take at least 50ms (indicating proper work factor)
      expect(duration).toBeGreaterThan(50);
    });

    it('should prevent timing attacks (constant time comparison)', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);

      const startTime1 = Date.now();
      await comparePassword('a', hash);
      const duration1 = Date.now() - startTime1;

      const startTime2 = Date.now();
      await comparePassword('testpassword12', hash);
      const duration2 = Date.now() - startTime2;

      // Durations should be similar (within 50ms)
      const difference = Math.abs(duration1 - duration2);
      expect(difference).toBeLessThan(50);
    });
  });
});
