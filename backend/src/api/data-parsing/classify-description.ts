import { CATEGORY_MAP, CATEGORY_RGX } from "./classification-map.js";

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

  let merchant = parts.length >= 3 ? parts[0] : description;

  return merchant?.trim();
}

function normalizeMerchant(merchant: string) {
  let cleaned = merchant.toUpperCase();

  for (const prefix of MERCHANT_PREFIX) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.slice(prefix.length).trim();
      break;
    }
  }

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

  // Remove trailing alphanumeric codes (like 032498 or 32njko23j02)
  cleaned = cleaned.replace(/\s+[\dA-Z]*\d[\dA-Z]*\s*$/gi, "");

  // Strip common noise words
  cleaned = cleaned.replace(/\b(POS|PURCHASE|DEBIT|CREDIT|CARD|ONLINE|WEB|MOBILE)\b/gi, "");

  // Collapse spaces again after removals
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // Take left side of delimiters
  cleaned = (cleaned.split(" - ")[0] ?? "").split(" / ")[0] ?? "";

  return cleaned.trim() || "UNKNOWN";
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
      category: firstMatch.categoryKey,
      confidence: firstMatch.confidence
    };
  }

  // Second check if Tier 1 Categorization fails
  let fullDescription = `${merchant} ${description}`.toLowerCase();
  for (const rule of CATEGORY_RGX) {
    if (rule.re.test(fullDescription)) {
      return {
        merchant: merchant,
        category: rule.categoryKey,
        confidence: rule.confidence
      };
    }
  }

  return {
    merchant: merchant,
    category: "misc",
    confidence: 0
  };
}