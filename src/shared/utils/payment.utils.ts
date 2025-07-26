/**
 * Payment utility functions
 */

export interface SepayTransferContent {
  prefix: string;      // Tiền tố (2-5 ký tự)
  suffix: string;      // Hậu tố (3-10 ký tự)
  fullContent: string; // Nội dung đầy đủ
}

/**
 * Generate Sepay transfer content format
 * Format: PREFIX + SUFFIX
 * - Prefix: 2-5 characters
 * - Suffix: 3-10 characters
 */
export function generateSepayTransferContent(
  orderCode: string,
  userId: number,
  customPrefix?: string
): SepayTransferContent {
  // Default prefix if not provided
  const prefix = customPrefix || 'DH';
  
  // Validate prefix length (2-5 characters)
  if (prefix.length < 2 || prefix.length > 5) {
    throw new Error('Prefix must be between 2-5 characters');
  }
  
  // Generate suffix from order code and user ID
  // Take last 3-10 characters from order code, add user ID if needed
  let suffix = orderCode.slice(-8); // Max 8 chars from order code
  
  // If suffix is too short, add user ID
  if (suffix.length < 3) {
    suffix = suffix + userId.toString().slice(-2);
  }
  
  // Ensure suffix is between 3-10 characters
  if (suffix.length < 3) {
    suffix = suffix.padEnd(3, '0');
  } else if (suffix.length > 10) {
    suffix = suffix.slice(-10);
  }
  
  const fullContent = `${prefix}${suffix}`;
  
  return {
    prefix,
    suffix,
    fullContent
  };
}

/**
 * Validate Sepay transfer content format
 */
export function validateSepayTransferContent(content: string): boolean {
  // Check total length (should be 5-15 characters)
  if (content.length < 5 || content.length > 15) {
    return false;
  }
  
  // Check if content matches expected format
  const prefix = content.slice(0, 2); // Assume 2-char prefix
  const suffix = content.slice(2);
  
  // Validate prefix (2-5 chars)
  if (prefix.length < 2 || prefix.length > 5) {
    return false;
  }
  
  // Validate suffix (3-10 digits - số nguyên)
  if (suffix.length < 3 || suffix.length > 10) {
    return false;
  }
  
  // Check if suffix is numeric
  if (!/^\d+$/.test(suffix)) {
    return false;
  }
  
  return true;
}

/**
 * Parse Sepay transfer content to extract order information
 */
export function parseSepayTransferContent(content: string): {
  prefix: string;
  suffix: string;
  isValid: boolean;
} {
  const isValid = validateSepayTransferContent(content);
  
  if (!isValid) {
    return {
      prefix: '',
      suffix: '',
      isValid: false
    };
  }
  
  // Try different prefix lengths (2-5 chars)
  for (let prefixLength = 2; prefixLength <= 5; prefixLength++) {
    const prefix = content.slice(0, prefixLength);
    const suffix = content.slice(prefixLength);
    
    // Check if suffix is valid (3-10 digits)
    if (suffix.length >= 3 && suffix.length <= 10 && /^\d+$/.test(suffix)) {
      return {
        prefix,
        suffix,
        isValid: true
      };
    }
  }
  
  return {
    prefix: '',
    suffix: '',
    isValid: false
  };
} 