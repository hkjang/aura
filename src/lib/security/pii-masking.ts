/**
 * PII (Personally Identifiable Information) Masking Service
 * Automatically detects and masks sensitive information in text
 */

interface MaskingResult {
  maskedText: string;
  detectedTypes: string[];
  maskCount: number;
}

interface MaskingOptions {
  maskEmail?: boolean;
  maskPhone?: boolean;
  maskSSN?: boolean;
  maskCreditCard?: boolean;
  maskIPAddress?: boolean;
  maskName?: boolean;
}

const DEFAULT_OPTIONS: MaskingOptions = {
  maskEmail: true,
  maskPhone: true,
  maskSSN: true,
  maskCreditCard: true,
  maskIPAddress: true,
  maskName: false, // Names are harder to detect accurately
};

// Regex patterns for PII detection
const PII_PATTERNS = {
  // Email addresses
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // Korean phone numbers: 010-1234-5678, 02-123-4567, etc.
  phoneKR: /\b(01[0-9]|02|0[3-9][0-9])-?\d{3,4}-?\d{4}\b/g,
  
  // International phone: +82-10-1234-5678
  phoneIntl: /\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
  
  // Korean SSN (주민등록번호): 123456-1234567
  ssnKR: /\b\d{6}[-\s]?[1-4]\d{6}\b/g,
  
  // Credit card numbers (various formats)
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  
  // IP addresses (IPv4)
  ipAddress: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,  
};

// Masking replacement strings
const MASK_REPLACEMENTS: Record<string, string> = {
  email: "[EMAIL]",
  phoneKR: "[PHONE]",
  phoneIntl: "[PHONE]",
  ssnKR: "[SSN]",
  creditCard: "[CARD]",
  ipAddress: "[IP]",
};

/**
 * Mask PII in the given text
 */
export function maskPII(text: string, options: MaskingOptions = DEFAULT_OPTIONS): MaskingResult {
  let maskedText = text;
  const detectedTypes: Set<string> = new Set();
  let maskCount = 0;

  // Email masking
  if (options.maskEmail) {
    const matches = maskedText.match(PII_PATTERNS.email);
    if (matches) {
      maskCount += matches.length;
      detectedTypes.add("email");
      maskedText = maskedText.replace(PII_PATTERNS.email, MASK_REPLACEMENTS.email);
    }
  }

  // Korean phone number masking
  if (options.maskPhone) {
    const matchesKR = maskedText.match(PII_PATTERNS.phoneKR);
    if (matchesKR) {
      maskCount += matchesKR.length;
      detectedTypes.add("phone");
      maskedText = maskedText.replace(PII_PATTERNS.phoneKR, MASK_REPLACEMENTS.phoneKR);
    }

    const matchesIntl = maskedText.match(PII_PATTERNS.phoneIntl);
    if (matchesIntl) {
      maskCount += matchesIntl.length;
      detectedTypes.add("phone");
      maskedText = maskedText.replace(PII_PATTERNS.phoneIntl, MASK_REPLACEMENTS.phoneIntl);
    }
  }

  // Korean SSN masking
  if (options.maskSSN) {
    const matches = maskedText.match(PII_PATTERNS.ssnKR);
    if (matches) {
      maskCount += matches.length;
      detectedTypes.add("ssn");
      maskedText = maskedText.replace(PII_PATTERNS.ssnKR, MASK_REPLACEMENTS.ssnKR);
    }
  }

  // Credit card masking
  if (options.maskCreditCard) {
    const matches = maskedText.match(PII_PATTERNS.creditCard);
    if (matches) {
      maskCount += matches.length;
      detectedTypes.add("creditCard");
      maskedText = maskedText.replace(PII_PATTERNS.creditCard, MASK_REPLACEMENTS.creditCard);
    }
  }

  // IP address masking
  if (options.maskIPAddress) {
    const matches = maskedText.match(PII_PATTERNS.ipAddress);
    if (matches) {
      maskCount += matches.length;
      detectedTypes.add("ipAddress");
      maskedText = maskedText.replace(PII_PATTERNS.ipAddress, MASK_REPLACEMENTS.ipAddress);
    }
  }

  return {
    maskedText,
    detectedTypes: Array.from(detectedTypes),
    maskCount,
  };
}

/**
 * Check if text contains PII
 */
export function containsPII(text: string, options: MaskingOptions = DEFAULT_OPTIONS): boolean {
  const result = maskPII(text, options);
  return result.maskCount > 0;
}

/**
 * Mask PII for AI request/response with logging
 */
export function maskForAI(
  content: string, 
  options: MaskingOptions = DEFAULT_OPTIONS
): { content: string; piiDetected: boolean; types: string[] } {
  const result = maskPII(content, options);
  
  if (result.maskCount > 0) {
    console.log(`[PII-MASK] Detected ${result.maskCount} PII items: ${result.detectedTypes.join(", ")}`);
  }

  return {
    content: result.maskedText,
    piiDetected: result.maskCount > 0,
    types: result.detectedTypes,
  };
}

/**
 * Mask specific fields in an object
 */
export function maskObjectPII<T extends Record<string, unknown>>(
  obj: T, 
  fields: (keyof T)[],
  options: MaskingOptions = DEFAULT_OPTIONS
): T {
  const result = { ...obj };

  for (const field of fields) {
    const value = result[field];
    if (typeof value === "string") {
      (result[field] as string) = maskPII(value, options).maskedText;
    }
  }

  return result;
}

/**
 * Extract and summarize detected PII without masking
 */
export function detectPII(text: string): { type: string; count: number }[] {
  const detected: { type: string; count: number }[] = [];

  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    const matches = text.match(pattern);
    if (matches) {
      detected.push({ type, count: matches.length });
    }
  }

  return detected;
}
