import { PDFParse } from "pdf-parse";

const parser = new PDFParse({ url: 'file:///Users/tonyhsu/Desktop/projects/clio.ai/cc.pdf'})

export async function dataParsing() {
  const result = await parser.getText();
  console.log(result.text);
}


dataParsing();