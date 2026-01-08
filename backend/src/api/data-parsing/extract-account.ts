export type AccountInfo = {
  bank_name?: string | undefined;
  account_num?: string | undefined;
  period_start?: string | undefined;
  period_end?: string | undefined;
  raw: {
    bank_line?: string;
    account_line?: string;
    period_line?: string;
  };
};

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
function formatDate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Convert month (as string) to its associated number.
 * Example: January => 01
 */
function convertMonthToNumber(month: string) {
  const key = month.toLowerCase();
  return MONTH_MAP[key]
}

/**
 * Converts the statement period into a starting and ending date.
 * Final dates follow ISODate format.
 */
function parsePeriod(match: RegExpMatchArray) {
  const startMonth = match[1];
  const startDay = match[2];
  const startYear = match[3];
  const endMonth = match[4];
  const endDay = match[5];
  const endYear = match[6];

  if (!startMonth || !endMonth) return {};

  const sm = convertMonthToNumber(startMonth);
  const em = convertMonthToNumber(endMonth);
  if (!sm || !em) return {};

  if (!startDay || !endDay) return {};
  const sd = Number(startDay);
  const ed = Number(endDay);
  if (!Number.isFinite(sd) || !Number.isFinite(ed)) return {}

  if (!startYear && !endYear) return {}
  let sy = startYear ? Number(startYear) : Number(endYear);
  const ey = endYear ? Number(endYear) : Number(startYear);

  let start = formatDate(sy, sm, sd);
  const end = formatDate(ey, em, ed);

  if (!startYear) {
    const sDate = new Date(start + "T00:00:00");
    const eDate = new Date(end + "T00:00:00");

    if (sDate > eDate) {
      sy = sy - 1
      start = formatDate(sy, sm, sd);
    }
  }

  return { start, end };
}

/**
 * Uses Regex to extract all the information about user account.
 * Stores the information in JSON format.
 * Extracts bank name, account number, period start and end date.
 * @param text : pdf as string
 */
export default function extractAccountInfo(text: string) {
  const BANK_NAME_RGX = /\b(Chase|JPMorgan\s+Chase|Bank\s+of\s+America|Wells\s+Fargo|Citibank|Citi|Capital\s+One|Discover|American\s+Express|US\s+Bank|PNC|TD\s+Bank|Santander|Navy\s+Federal|Charles\s+Schwab|Fidelity)\b/i;
  const ACCOUNT_NUM_RGX = /\b(?:Account|Acct|A\/C)\s*(?:Number|No\.?)?\s*(?:#|:)?[\s\S]*?(\d{4})\s*$/i;
  const PERIOD_RGX = /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Sept|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:,?\s+(\d{4}))?\s*(?:-|–|to)\s*(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Sept|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:,?\s+(\d{4}))?\b/i;
  const HEADER_LINES = 80;

  const lines = text.split("\n");
  const info: AccountInfo = {
    raw: {}
  };

  for (let i = 0; i < Math.min(lines.length, HEADER_LINES); i++) {
    const line = lines[i]?.trim();
    if (!line) continue;

    // Get Bank Name
    if (!info.bank_name) {
      const match = line.match(BANK_NAME_RGX);
      if (match) {
        info.bank_name = match[1];
        info.raw.bank_line = line;
      }
    }

    // Get Account Number
    if (!info.account_num) {
      const match = line.match(ACCOUNT_NUM_RGX);
      if (match) {
        info.account_num = match[1];
        info.raw.account_line = line;
      }
    }

    // Get Statement Period
    if (!info.period_start || !info.period_end) {
      const match = line.match(PERIOD_RGX);
      if (match) {
        const {start, end} = parsePeriod(match);
        if (start) info.period_start = start;
        if (end) info.period_end = end;
        info.raw.period_line = line;
      }
    }

    // Early Exit
    if (info.bank_name && info.account_num && info.period_start && info.period_end) {
      break;
    }
  }

  return info;
}