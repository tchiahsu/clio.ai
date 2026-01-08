import { PDFParse } from "pdf-parse";
import extractAccountInfo from "./extract-account.js";
import extractTransactions from "./extract-transactions.js";

/**
 * PDF Parsing Pipeline
 */
export async function dataParsing() {
  // Debit Account Statement
  // const parser = new PDFParse({ url: 'file:///Users/tonyhsu/Desktop/projects/dc.pdf'})

  // Credit Card Bank Statement
  const parser = new PDFParse({ url: 'file:///Users/tonyhsu/Desktop/projects/cc.pdf'})

  const result = await parser.getText();
  // console.log(result.text);

  const account = extractAccountInfo(result.text);
  // console.log(account);

  const transaction = extractTransactions(result.text);
  console.log(transaction);
}

dataParsing();