export type TransactionInfo = {
  date?: string | undefined;
  description?: string | undefined;
  amount?: number | undefined;
  raw: string | undefined;
}

const MONTH_MAP: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

/**
 * Convert date to ISODate.
 */
function formatDate(date: string, year: number) {
  const [monthText, dayText] = date.split("/");
  const month = Number(monthText);
  const day = Number(dayText);

  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function daysBetween(startDate: string, endDate: string) {
  const s = new Date(`${startDate}T00:00:00Z`).getTime();
  const e = new Date(`${endDate}T00:00:00Z`).getTime();
  return Math.abs(s - e) / (1000 * 60 * 60 * 24);
}

function determineTransactionYear(date: string, statementEnd: string) {
  const endYear = Number(statementEnd.slice(0, 4));
  const candidateA = formatDate(date, endYear);
  const candidateB = formatDate(date, endYear - 1);

  return daysBetween(candidateA, statementEnd) <= daysBetween(candidateB, statementEnd) ? candidateA : candidateB;
}

/**
 * Normalizes amount to a positive or negative number
 */
function normalizeAmount(amount: string) {
  const cleaned = amount.replace(/[$,]/g, "");
  const negative = /^\(.*\)$/.test(cleaned);
  const value = Number(cleaned.replace(/[()]/g, ""));
  return negative ? -value : value;  
}

/**
 * Remove unnecessary line and spacing from bank statement line.
 */
function normalizeText(text: string) {
  return text.replace(/s+/g, " ").trim();
}

/**
 * Uses Regex to extract all the information about user transactions.
 * Stores the information in JSON format.
 * Extracts data, description, amount.
 * @param text : pdf as string
 */
export default function extractTransactions(text: string) {
  const TRANSACTION_RGX = /^\s*(?<date>\d{1,2}\/\d{1,2})\s+\d{1,2}\/\d{1,2}\s+(?<description>.+?)\s+(?<amount>-?\d[\d,]*\.\d{2})\s*$/;
  const YEAR_RGX = /\b(?<startMonth>Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Sept|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(?<startDay>\d{1,2})(?:,?\s+(?<startYear>\d{4}))?\s*(?:-|–|to)\s*(?<endMonth>Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Sept|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(?<endDay>\d{1,2})(?:,?\s+(?<endYear>\d{4}))?\b/i;

  const lines = text.split("\n");
  const transactions: TransactionInfo[] = [];

  const year_line = text.match(YEAR_RGX);
  if (!year_line?.groups) return null;

  const { endMonth, endDay, endYear, startYear } = year_line.groups;

  const yearNum = Number(endYear ?? startYear);
  if (!endMonth || !endDay || !Number.isFinite(yearNum)) return null;

  const monthKey = endMonth.toLowerCase();
  const monthNum = MONTH_MAP[monthKey];
  if (!monthNum) return null;

  const statementEnd = `${yearNum}-${String(monthNum).padStart(2, "0")}-${String(Number(endDay)).padStart(2, "0")}`;

  for (const line of lines) {
    const text = line.trim();
    if (!text) continue;

    const match = text.match(TRANSACTION_RGX);
    if (!match?.groups) continue;

    const { date, description, amount } = match.groups

    if (!date || !description || !amount) continue;

    const isoDate = determineTransactionYear(date, statementEnd);
    const normAmount = normalizeAmount(amount);
    const normDescription = normalizeText(description)

    transactions.push({
      date: isoDate,
      description: normDescription,
      amount: normAmount,
      raw: text
    })
  }

  return transactions;
}