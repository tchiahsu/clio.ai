import { CATEGORY_MAP, CATEGORY_RGX, SUBCATEGORY_TO_CATEGORY, MERCHANT_NAME_MAP } from "./classification-map.js";

const MERCHANT_PREFIX = [
  "MTA*",
  "SQ *",
  "SQC*",
  "TST*",
  "PP*",
  "PAYPAL *",
  "GOOGLE *",
  "SP ",
  "CKE*",
  "CHK*",
  "POS ",
  "ACH ",
  "VENMO *",
  "ZELLE *",
  "UEP",
]

const MERCHANT_SUFFIX = [
  "INC",
  "INCORPORATED",
  "CORP",
  "CORPORATION",
  "LLC",
  "LTD",
  "LIMITED",
  "CO",
  "COMPANY",
  "GROUP",
  "HOLDINGS",
  "ENTERPRISES",
  "INTL",
  "INTERNATIONAL",  
]

const DELIVERY_SERVICES = [
  "DD",
  "DOORDASH",
  "GRUBHUB",
  "UBER EATS",
  "UBEREATS",
  "POSTMATES",
  "SEAMLESS",
  "CAVIAR",  
]

function extractMerchant(description: string) {
  // Try actual tabs first, then literal \t
  let parts = description.split(/\t+/);
  
  if (parts.length < 3) {
    parts = description.split(/\\t+/);
  }

  let merchant = parts.length >= 3 ? parts[2] : parts[0];

  return merchant?.trim();
}

function normalizeMerchant(merchant: string) {
  // Check name map FIRST on raw input before any stripping wipes key info
  const earlyCheck = merchant.toLowerCase().trim();
  for (const [key, value] of Object.entries(MERCHANT_NAME_MAP)) {
    if (earlyCheck.includes(key)) return value;
  }

  let cleaned = merchant.toUpperCase();

  // Strip prefixes
  for (const prefix of MERCHANT_PREFIX) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.slice(prefix.length).trim();
      break;
    }
  }

  // Strip URLs BEFORE replacing dots (e.g. "LYFT.COM", "OPENAI.COM")
  cleaned = cleaned.replace(/\b\w+\.(COM|NET|ORG|IO)\b/gi, "").trim();

  // Replace "." with a space
  cleaned = cleaned.replace(/\./g, " ");

  // Remove punctuation entirely (keep & and ')
  cleaned = cleaned.replace(/[^\w\s&']/g, " ");

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // Strip delivery service names
  for (const service of DELIVERY_SERVICES) {
    cleaned = cleaned.replace(new RegExp(`\\b${service}\\b`, "gi"), "").trim();
  }

  // Strip corporate suffixes from the end
  for (const suffix of MERCHANT_SUFFIX) {
    const suffixRegex = new RegExp(`\\s+${suffix}\\s*$`, "i");
    cleaned = cleaned.replace(suffixRegex, "").trim();
  }

  // Strip phone numbers (e.g. "866-712-7753", "704-817-2500")
  cleaned = cleaned.replace(/\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/g, "").trim();

  // Strip trailing city + 2-letter state (e.g. "BOSTON MA", "NEW YORK NY")
  cleaned = cleaned.replace(/\b[A-Z][A-Z\s]*[A-Z]\s+[A-Z]{2}\s*$/g, "").trim();

  // Strip trailing 4-digit code + optional state (e.g. "1158", "NY 1158")
  cleaned = cleaned.replace(/\s+\d{4}\s*([A-Z]{2})?\s*$/g, "").trim();

  // Strip remaining trailing alphanumeric store codes (e.g. "#3338", "F7059")
  cleaned = cleaned.replace(/\s+[\dA-Z]*\d[\dA-Z]*\s*$/gi, "").trim();

  // Strip common noise words
  cleaned = cleaned.replace(/\b(POS|PURCHASE|DEBIT|CREDIT|CARD|ONLINE|WEB|MOBILE)\b/gi, "");

  // Take left side of delimiters
  cleaned = (cleaned.split(" - ")[0] ?? "").split(" / ")[0] ?? "";

  // Final collapse
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  const finalCheck = cleaned.toLowerCase();
  for (const [key, value] of Object.entries(MERCHANT_NAME_MAP)) {
    if (finalCheck.includes(key)) return value;
  }

  return cleaned || "UNKNOWN";
}

export default function getClassification(description: string) {
  const rawMerchant = extractMerchant(description);
  if (!rawMerchant) return;

  const merchant = normalizeMerchant(rawMerchant).toLowerCase();

  // Check if Merchant is in Tier 1 Categorization
  const firstMatch = CATEGORY_MAP[merchant];
  if (firstMatch) {
    return {
      merchant: merchant,
      subcategory: firstMatch.subcategory,
      category: SUBCATEGORY_TO_CATEGORY[firstMatch.subcategory] ?? "misc",
      confidence: firstMatch.confidence
    };
  }

  // Second check if Tier 1 Categorization fails
  let fullDescription = `${merchant} ${description}`.toLowerCase();
  for (const rule of CATEGORY_RGX) {
    if (rule.re.test(fullDescription)) {
      return {
        merchant: merchant,
        subcategory: rule.subcategory,
        category: SUBCATEGORY_TO_CATEGORY[rule.subcategory] ?? "misc",
        confidence: rule.confidence
      };
    }
  }

  return {
    merchant: merchant,
    subcategory: "misc",
    category: "misc",
    confidence: 0
  };
}