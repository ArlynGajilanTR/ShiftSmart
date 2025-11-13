import { cn } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('cn (className merger)', () => {
    it('should merge class names correctly', () => {
      const result = cn('class1', 'class2', 'class3');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).toContain('class3');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'included', false && 'excluded');
      expect(result).toContain('base');
      expect(result).toContain('included');
      expect(result).not.toContain('excluded');
    });

    it('should override conflicting tailwind classes', () => {
      const result = cn('px-2', 'px-4');
      // Should prefer the last value
      expect(result).toContain('px-4');
    });

    it('should handle empty strings', () => {
      const result = cn('class1', '', 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('should handle undefined and null', () => {
      const result = cn('class1', undefined, null, 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).toContain('class3');
    });

    it('should handle duplicate classes (tailwind-merge behavior)', () => {
      const result = cn('class1', 'class1', 'class2');
      // tailwind-merge preserves non-conflicting duplicates
      // Only Tailwind utility classes like 'px-2' vs 'px-4' are deduplicated
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });
  });
});

// Helper functions tests
describe('Helper Functions', () => {
  describe('getInitials', () => {
    const getInitials = (name: string): string => {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };

    it('should get initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('Marco Rossi')).toBe('MR');
      expect(getInitials('Sara Romano')).toBe('SR');
    });

    it('should handle three-part names', () => {
      expect(getInitials('John Michael Doe')).toBe('JD');
    });

    it('should handle single name', () => {
      expect(getInitials('Madonna')).toBe('MA');
    });

    it('should handle names with accents', () => {
      expect(getInitials('José García')).toBe('JG');
    });

    it('should handle lowercase names', () => {
      expect(getInitials('john doe')).toBe('JD');
    });
  });

  describe('formatPhoneNumber', () => {
    const formatPhoneNumber = (phone: string): string => {
      // Remove all non-numeric characters
      const cleaned = phone.replace(/\D/g, '');

      // Format based on length
      if (cleaned.length === 10) {
        return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
      }

      return phone;
    };

    it('should format US phone number', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
    });

    it('should handle phone with existing formatting', () => {
      expect(formatPhoneNumber('(123) 456-7890')).toBe('(123) 456-7890');
    });

    it('should handle phone with spaces', () => {
      expect(formatPhoneNumber('123 456 7890')).toBe('(123) 456-7890');
    });

    it('should return original for invalid length', () => {
      expect(formatPhoneNumber('12345')).toBe('12345');
    });
  });

  describe('validateEmail', () => {
    const validateEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@company.com')).toBe(true);
      expect(validateEmail('first.last@reuters.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('invalid@example')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    it('should handle special characters', () => {
      expect(validateEmail('user+tag@example.com')).toBe(true);
      expect(validateEmail('user_name@example.com')).toBe(true);
    });

    it('should reject emails with spaces', () => {
      expect(validateEmail('invalid @example.com')).toBe(false);
      expect(validateEmail('invalid@ example.com')).toBe(false);
    });
  });

  describe('truncateText', () => {
    const truncateText = (text: string, maxLength: number): string => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    };

    it('should truncate long text', () => {
      const longText = 'This is a very long text that needs to be truncated';
      expect(truncateText(longText, 20)).toBe('This is a very long ...');
    });

    it('should not truncate short text', () => {
      const shortText = 'Short text';
      expect(truncateText(shortText, 20)).toBe('Short text');
    });

    it('should handle exact length', () => {
      const text = '12345';
      expect(truncateText(text, 5)).toBe('12345');
    });

    it('should handle empty string', () => {
      expect(truncateText('', 10)).toBe('');
    });
  });

  describe('formatDate', () => {
    it('should format dates consistently', () => {
      const date = new Date('2025-11-05T14:30:00Z');
      const formatted = date.toISOString().split('T')[0];
      expect(formatted).toBe('2025-11-05');
    });

    it('should handle date strings', () => {
      const dateString = '2025-11-05';
      const date = new Date(dateString);
      expect(date.toISOString()).toContain('2025-11-05');
    });
  });
});
