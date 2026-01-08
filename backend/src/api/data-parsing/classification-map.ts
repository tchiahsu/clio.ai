// -----------------------------------------------
// CATEGORIZE MERCHANT
// -----------------------------------------------

type MerchantCategory = {
  categoryKey: string,
  confidence: number;
}

/**
 * Common known merchant mappings (high confidence).
 */
export const CATEGORY_MAP: Record<string, MerchantCategory> = {
  // ---------- Groceries ----------
  "whole foods": { categoryKey: "groceries", confidence: 0.98 },
  "wholefoods": { categoryKey: "groceries", confidence: 0.98 },
  "trader joe's": { categoryKey: "groceries", confidence: 0.98 },
  "trader joes": { categoryKey: "groceries", confidence: 0.98 },
  "aldi": { categoryKey: "groceries", confidence: 0.97 },
  "lidl": { categoryKey: "groceries", confidence: 0.97 },
  "kroger": { categoryKey: "groceries", confidence: 0.96 },
  "publix": { categoryKey: "groceries", confidence: 0.96 },
  "safeway": { categoryKey: "groceries", confidence: 0.96 },
  "wegmans": { categoryKey: "groceries", confidence: 0.96 },
  "stop & shop": { categoryKey: "groceries", confidence: 0.95 },
  "stop and shop": { categoryKey: "groceries", confidence: 0.95 },
  "giant": { categoryKey: "groceries", confidence: 0.95 },
  "giant food": { categoryKey: "groceries", confidence: 0.95 },
  "meijer": { categoryKey: "groceries", confidence: 0.95 },
  "h-e-b": { categoryKey: "groceries", confidence: 0.95 },
  "heb": { categoryKey: "groceries", confidence: 0.95 },
  "food lion": { categoryKey: "groceries", confidence: 0.94 },
  "sprouts": { categoryKey: "groceries", confidence: 0.94 },
  "sprouts farmers market": { categoryKey: "groceries", confidence: 0.94 },
  "market basket": { categoryKey: "groceries", confidence: 0.94 },
  "costco": { categoryKey: "groceries", confidence: 0.9 },
  "sam's club": { categoryKey: "groceries", confidence: 0.9 },
  "bj's": { categoryKey: "groceries", confidence: 0.9 },

  // ---------- Dining Out ----------
  "chipotle": { categoryKey: "dining_out", confidence: 0.96 },
  "panera": { categoryKey: "dining_out", confidence: 0.95 },
  "sweetgreen": { categoryKey: "dining_out", confidence: 0.95 },
  "shake shack": { categoryKey: "dining_out", confidence: 0.95 },
  "five guys": { categoryKey: "fast_food", confidence: 0.95 },
  "mcdonald's": { categoryKey: "fast_food", confidence: 0.97 },
  "mcdonalds": { categoryKey: "fast_food", confidence: 0.97 },
  "burger king": { categoryKey: "fast_food", confidence: 0.97 },
  "wendy's": { categoryKey: "fast_food", confidence: 0.97 },
  "wendys": { categoryKey: "fast_food", confidence: 0.97 },
  "taco bell": { categoryKey: "fast_food", confidence: 0.97 },
  "kfc": { categoryKey: "fast_food", confidence: 0.97 },
  "subway": { categoryKey: "fast_food", confidence: 0.95 },
  "domino's": { categoryKey: "food_delivery", confidence: 0.95 },
  "dominos": { categoryKey: "food_delivery", confidence: 0.95 },
  "pizza hut": { categoryKey: "food_delivery", confidence: 0.95 },

  // ---------- Coffee ----------
  "starbucks": { categoryKey: "coffee", confidence: 0.98 },
  "dunkin": { categoryKey: "coffee", confidence: 0.98 },
  "dunkin'": { categoryKey: "coffee", confidence: 0.98 },
  "peet's": { categoryKey: "coffee", confidence: 0.96 },
  "peets": { categoryKey: "coffee", confidence: 0.96 },

  // ---------- Alcohol / Bars ----------
  "total wine": { categoryKey: "alcohol", confidence: 0.9 },
  "drizly": { categoryKey: "alcohol", confidence: 0.9 },

  // ---------- Food Delivery ----------
  "doordash": { categoryKey: "food_delivery", confidence: 0.96 },
  "uber eats": { categoryKey: "food_delivery", confidence: 0.96 },
  "ubereats": { categoryKey: "food_delivery", confidence: 0.96 },
  "grubhub": { categoryKey: "food_delivery", confidence: 0.96 },
  "seamless": { categoryKey: "food_delivery", confidence: 0.96 },
  "postmates": { categoryKey: "food_delivery", confidence: 0.95 },

  // ---------- Rideshare / Transport ----------
  "uber": { categoryKey: "rideshare", confidence: 0.96 },
  "lyft": { categoryKey: "rideshare", confidence: 0.96 },
  "lime": { categoryKey: "transportation", confidence: 0.75 },
  "bird": { categoryKey: "transportation", confidence: 0.75 },

  // ---------- Fuel ----------
  "shell": { categoryKey: "fuel", confidence: 0.9 },
  "exxon": { categoryKey: "fuel", confidence: 0.9 },
  "chevron": { categoryKey: "fuel", confidence: 0.9 },
  "bp": { categoryKey: "fuel", confidence: 0.9 },
  "sunoco": { categoryKey: "fuel", confidence: 0.9 },
  "citgo": { categoryKey: "fuel", confidence: 0.9 },

  // ---------- Streaming ----------
  "netflix": { categoryKey: "streaming", confidence: 0.98 },
  "hulu": { categoryKey: "streaming", confidence: 0.98 },
  "disney plus": { categoryKey: "streaming", confidence: 0.98 },
  "disney+": { categoryKey: "streaming", confidence: 0.98 },
  "max": { categoryKey: "streaming", confidence: 0.7 },
  "hbo max": { categoryKey: "streaming", confidence: 0.95 },
  "paramount+": { categoryKey: "streaming", confidence: 0.95 },
  "peacock": { categoryKey: "streaming", confidence: 0.95 },
  "youtube premium": { categoryKey: "streaming", confidence: 0.9 },

  // ---------- Subscriptions / Music ----------
  "spotify": { categoryKey: "streaming", confidence: 0.95 },
  "apple music": { categoryKey: "streaming", confidence: 0.95 },
  "pandora": { categoryKey: "streaming", confidence: 0.9 },

  // ---------- Software / Cloud ----------
  "adobe": { categoryKey: "software", confidence: 0.9 },
  "github": { categoryKey: "software", confidence: 0.85 },
  "openai": { categoryKey: "software", confidence: 0.85 },
  "google one": { categoryKey: "cloud_services", confidence: 0.9 },
  "icloud": { categoryKey: "cloud_services", confidence: 0.9 },
  "dropbox": { categoryKey: "cloud_services", confidence: 0.9 },

  // ---------- Shopping ----------
  "amazon": { categoryKey: "shopping", confidence: 0.75 },
  "walmart": { categoryKey: "shopping", confidence: 0.7 },
  "target": { categoryKey: "shopping", confidence: 0.75 },
  "best buy": { categoryKey: "electronics", confidence: 0.9 },
  "apple": { categoryKey: "electronics", confidence: 0.7 },
  "ikea": { categoryKey: "home_goods", confidence: 0.9 },
  "home depot": { categoryKey: "home_maintenance", confidence: 0.85 },
  "lowe's": { categoryKey: "home_maintenance", confidence: 0.85 },
  "lowes": { categoryKey: "home_maintenance", confidence: 0.85 },

  // ---------- Clothing ----------
  "nike": { categoryKey: "clothing", confidence: 0.85 },
  "adidas": { categoryKey: "clothing", confidence: 0.85 },
  "uniqlo": { categoryKey: "clothing", confidence: 0.9 },
  "zara": { categoryKey: "clothing", confidence: 0.9 },
  "h&m": { categoryKey: "clothing", confidence: 0.9 },
  "hm": { categoryKey: "clothing", confidence: 0.85 },

  // ---------- Utilities / Internet / Phone ----------
  "comcast": { categoryKey: "internet", confidence: 0.9 },
  "xfinity": { categoryKey: "internet", confidence: 0.9 },
  "verizon": { categoryKey: "phone", confidence: 0.9 },
  "at&t": { categoryKey: "phone", confidence: 0.9 },
  "att": { categoryKey: "phone", confidence: 0.9 },
  "t-mobile": { categoryKey: "phone", confidence: 0.9 },
  "tmobile": { categoryKey: "phone", confidence: 0.9 },

  // ---------- Fitness / Wellness ----------
  "planet fitness": { categoryKey: "fitness", confidence: 0.95 },
  "la fitness": { categoryKey: "fitness", confidence: 0.95 },
  "equinox": { categoryKey: "fitness", confidence: 0.9 },

  // ---------- Healthcare / Pharmacy ----------
  "cvs": { categoryKey: "pharmacy", confidence: 0.9 },
  "walgreens": { categoryKey: "pharmacy", confidence: 0.9 },
  "rite aid": { categoryKey: "pharmacy", confidence: 0.9 },

  // ---------- Travel ----------
  "airbnb": { categoryKey: "lodging", confidence: 0.95 },
  "marriott": { categoryKey: "lodging", confidence: 0.9 },
  "hilton": { categoryKey: "lodging", confidence: 0.9 },
  "delta": { categoryKey: "flights", confidence: 0.9 },
  "american airlines": { categoryKey: "flights", confidence: 0.9 },
  "united": { categoryKey: "flights", confidence: 0.85 },
  "southwest": { categoryKey: "flights", confidence: 0.9 },

  // ---------- Payments / Transfers ----------
  "venmo": { categoryKey: "transfers", confidence: 0.75 },
  "paypal": { categoryKey: "transfers", confidence: 0.6 },
  "zelle": { categoryKey: "transfers", confidence: 0.75 },
  "cash app": { categoryKey: "transfers", confidence: 0.75 },

  // ---------- Fees ----------
  "overdraft fee": { categoryKey: "fees", confidence: 0.95 },
  "service fee": { categoryKey: "fees", confidence: 0.85 },

  // ---------- Insurance ----------
  "geico": { categoryKey: "insurance", confidence: 0.9 },
  "progressive": { categoryKey: "insurance", confidence: 0.9 },
  "state farm": { categoryKey: "insurance", confidence: 0.9 },

  // ---------- Income ----------
  "payroll": { categoryKey: "salary", confidence: 0.75 },
  "direct deposit": { categoryKey: "salary", confidence: 0.75 },
};


// -----------------------------------------------
// CATEGORIZE CATEGORY
// -----------------------------------------------

export type PatternRule = {
  re: RegExp;
  categoryKey: string;
  confidence: number;
  note?: string;
};

/**
 * Classification using REGEX
 */
export const CATEGORY_RGX: PatternRule[] = [
  // ---------- Income ----------
  { re: /\b(payroll|direct\s*deposit|salary|paycheck|wages)\b/i, categoryKey: "salary", confidence: 0.75 },
  { re: /\b(dividend|interest\s*paid|interest)\b/i, categoryKey: "interest", confidence: 0.7 },
  { re: /\b(refund|reversal)\b/i, categoryKey: "income", confidence: 0.6 },

  // ---------- Transfers / P2P ----------
  { re: /\b(venmo|zelle|cash\s*app|paypal)\b/i, categoryKey: "transfers", confidence: 0.7 },
  { re: /\b(transfer|ach\s*transfer|external\s*transfer|internal\s*transfer)\b/i, categoryKey: "transfers", confidence: 0.65 },

  // ---------- Fees ----------
  { re: /\b(overdraft|nsf|returned\s*item|service\s*fee|maintenance\s*fee|late\s*fee)\b/i, categoryKey: "fees", confidence: 0.85 },

  // ---------- Taxes ----------
  { re: /\b(irs|tax|revenue\s*service|state\s*tax|property\s*tax)\b/i, categoryKey: "taxes", confidence: 0.8 },

  // ---------- Utilities / Internet / Phone ----------
  { re: /\b(electric|electricity|power\s*company|utility)\b/i, categoryKey: "utilities", confidence: 0.75 },
  { re: /\b(gas\s*company|natural\s*gas)\b/i, categoryKey: "utilities", confidence: 0.75 },
  { re: /\b(water|sewer|trash|waste)\b/i, categoryKey: "utilities", confidence: 0.75 },
  { re: /\b(internet|broadband|wifi)\b/i, categoryKey: "internet", confidence: 0.75 },
  { re: /\b(cell|mobile|wireless|phone\s*bill)\b/i, categoryKey: "phone", confidence: 0.75 },

  // ---------- Housing ----------
  { re: /\b(rent|landlord|leasing)\b/i, categoryKey: "rent", confidence: 0.8 },
  { re: /\b(mortgage|escrow)\b/i, categoryKey: "mortgage", confidence: 0.8 },
  { re: /\b(home\s*depot|lowe'?s|hardware|lumber|plumbing|paint)\b/i, categoryKey: "home_maintenance", confidence: 0.7 },

  // ---------- Groceries ----------
  { re: /\b(grocery|supermarket|market\b|foods?\b|produce|butcher|deli)\b/i, categoryKey: "groceries", confidence: 0.7 },
  { re: /\b(costco|sam'?s\s*club|bj'?s)\b/i, categoryKey: "groceries", confidence: 0.6, note: "Warehouse stores also shopping" },

  // ---------- Dining Out / Fast Food / Coffee ----------
  { re: /\b(restaurant|diner|bistro|grill|pizza|taqueria|sushi|ramen|bbq)\b/i, categoryKey: "dining_out", confidence: 0.65 },
  { re: /\b(mcdonald|burger\s*king|wendy|taco\s*bell|kfc|subway)\b/i, categoryKey: "fast_food", confidence: 0.8 },
  { re: /\b(coffee|cafe|espresso|latte)\b/i, categoryKey: "coffee", confidence: 0.75 },
  { re: /\b(uber\s*eats|doordash|grubhub|seamless|postmates|deliver(y|ies))\b/i, categoryKey: "food_delivery", confidence: 0.85 },

  // ---------- Alcohol ----------
  { re: /\b(liquor|wine|spirits|brewery|taproom|bar\b|pub\b)\b/i, categoryKey: "alcohol", confidence: 0.6 },

  // ---------- Transportation ----------
  { re: /\b(uber|lyft|rideshare)\b/i, categoryKey: "rideshare", confidence: 0.8 },
  { re: /\b(gas\s*station|fuel|shell|exxon|chevron|bp|sunoco|citgo)\b/i, categoryKey: "fuel", confidence: 0.8 },
  { re: /\b(parking|meter|toll|ezpass|e-zpass)\b/i, categoryKey: "parking", confidence: 0.75 },
  { re: /\b(mta|mbta|metro|subway|transit|bus|train|amtrak)\b/i, categoryKey: "public_transport", confidence: 0.75 },
  { re: /\b(auto\s*payment|car\s*payment)\b/i, categoryKey: "car_payment", confidence: 0.75 },
  { re: /\b(auto\s*insurance|car\s*insurance)\b/i, categoryKey: "car_insurance", confidence: 0.75 },
  { re: /\b(oil\s*change|tire|tires|mechanic|auto\s*repair|maintenance)\b/i, categoryKey: "car_maintenance", confidence: 0.65 },

  // ---------- Shopping / Retail ----------
  { re: /\b(amazon|walmart|target|costco|best\s*buy)\b/i, categoryKey: "shopping", confidence: 0.55, note: "Ambiguous retailers" },
  { re: /\b(clothing|apparel|outlet|nike|adidas|uniqlo|zara|h&m)\b/i, categoryKey: "clothing", confidence: 0.7 },
  { re: /\b(electronic|electronics|computer|laptop|phone\s*store)\b/i, categoryKey: "electronics", confidence: 0.6 },
  { re: /\b(furniture|home\s*goods|decor|ikea)\b/i, categoryKey: "home_goods", confidence: 0.7 },
  { re: /\b(salon|barber|spa|cosmetic|skincare|sephora|ulta)\b/i, categoryKey: "personal_care", confidence: 0.7 },

  // ---------- Subscriptions / Streaming / Software ----------
  { re: /\b(netflix|hulu|disney\+|prime\s*video|hbo|max|peacock|paramount\+)\b/i, categoryKey: "streaming", confidence: 0.85 },
  { re: /\b(spotify|apple\s*music|pandora)\b/i, categoryKey: "streaming", confidence: 0.8 },
  { re: /\b(subscription|recurring|membership)\b/i, categoryKey: "subscriptions", confidence: 0.65 },
  { re: /\b(adobe|microsoft\s*365|office\s*365|notion|slack|zoom)\b/i, categoryKey: "software", confidence: 0.7 },
  { re: /\b(dropbox|google\s*one|icloud|cloud)\b/i, categoryKey: "cloud_services", confidence: 0.7 },

  // ---------- Health / Pharmacy / Fitness ----------
  { re: /\b(cvs|walgreens|rite\s*aid|pharmacy)\b/i, categoryKey: "pharmacy", confidence: 0.8 },
  { re: /\b(hospital|clinic|doctor|dental|dentist|vision|optometrist)\b/i, categoryKey: "healthcare", confidence: 0.7 },
  { re: /\b(gym|fitness|workout|yoga|pilates|planet\s*fitness|equinox)\b/i, categoryKey: "fitness", confidence: 0.75 },

  // ---------- Education ----------
  { re: /\b(tuition|university|college|school|course|bootcamp|udemy|coursera|edx)\b/i, categoryKey: "education", confidence: 0.7 },
  { re: /\b(textbook|bookstore)\b/i, categoryKey: "books", confidence: 0.7 },

  // ---------- Entertainment / Events / Hobbies ----------
  { re: /\b(movie|cinema|theater|ticket|concert|festival|event)\b/i, categoryKey: "events", confidence: 0.65 },
  { re: /\b(game|gaming|steam|playstation|xbox|nintendo)\b/i, categoryKey: "hobbies", confidence: 0.65 },
  { re: /\b(entertainment)\b/i, categoryKey: "entertainment", confidence: 0.6 },

  // ---------- Travel ----------
  { re: /\b(airbnb|hotel|inn|resort|marriott|hilton|hyatt)\b/i, categoryKey: "lodging", confidence: 0.75 },
  { re: /\b(airlines?|flight|delta|united|american\s*airlines|southwest|jetblue)\b/i, categoryKey: "flights", confidence: 0.7 },
  { re: /\b(uber\s*rental|rental\s*car|hertz|avis|enterprise)\b/i, categoryKey: "travel", confidence: 0.6 },

  // ---------- Insurance ----------
  { re: /\b(insurance|geico|progressive|state\s*farm|allstate)\b/i, categoryKey: "insurance", confidence: 0.75 },

  // ---------- Pets ----------
  { re: /\b(vet|veterinary|pet\s*store|petco|petsmart)\b/i, categoryKey: "pets", confidence: 0.75 },

  // ---------- Donations / Gifts ----------
  { re: /\b(donation|charity|nonprofit)\b/i, categoryKey: "donations", confidence: 0.75 },
  { re: /\b(gift|giftcard|gift\s*card)\b/i, categoryKey: "gifts", confidence: 0.6 },
];
