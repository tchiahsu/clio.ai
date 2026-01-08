import { CATEGORY_MAP, CATEGORY_RGX } from "./classification-map.js";


function extractMerchant(description: string) {
  let s = description.replace(/\s+/g, " ").replace(/[•·]/g, " ").trim().toUpperCase();

  // Remove trailing reference numeric runs
  s = s.replace(/(?:\s+\d{2,}){1,}\s*$/g, "");

  // Remove trailing state code if present at the end
  s = s.replace(/\s+[A-Z]{2}\s*$/g, "");

  // Remove trailing zip if present
  s = s.replace(/\s+\d{5}(?:-\d{4})?\s*$/g, "");

  // Strip common noise words (bank-agnostic set)
  s = s.replace(/\b(POS|PURCHASE|DEBIT|CREDIT|CARD|ONLINE|WEB|MOBILE)\b/g, " ");

  // Clean punctuation but keep & and '
  s = s.replace(/[^\w\s&']/g, " ");

  // Collapse spaces
  s = s.replace(/\s+/g, " ").trim();

  // Select merchant on the left of the delimiter
  // Example: Amazon - Digital Service -> take Amazon only
  s = (s.split(" - ")[0] ?? "").split(" / ")[0] ?? "";
  s = s.trim();

  return s || "UNKNOWN";
}


export default function getCalssification(description: string) {
  const merchant = extractMerchant(description).toLowerCase();

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
        categoryKey: rule.categoryKey,
        confidence: rule.confidence
      };
    }
  }

  return {
    merchant: merchant,
    categoryKey: "misc",
    confidence: 0
  };
}