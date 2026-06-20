import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const root = process.cwd();
const inputDir = path.join(root, "projects", "newerp", "files");
const outputDir = path.join(root, "projects", "newerp", "html");

const workbooks = [
  {
    file: "sop_rolling_12_month_forecast.xlsx",
    title: "S&OP 月度出貨預測與庫存規劃",
    description: "業務預測、實際出貨、實銷、達成率、準確率與庫存規劃。",
  },
  {
    file: "sop_sales_product_monthly_forecast_template.xlsx",
    title: "業務分產品每月預測範本",
    description: "業務每月填寫用的出貨預測範本。",
  },
  {
    file: "whisky_cost_quote_twd.xlsx",
    title: "酒類成本與台幣報價",
    description: "匯率、運費、酒稅、營業稅與 8% 毛利率報價試算。",
  },
];

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function decodeXml(value) {
  return String(value ?? "")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function colToIndex(ref) {
  const letters = ref.replace(/[0-9]/g, "");
  let index = 0;
  for (const char of letters) index = index * 26 + char.charCodeAt(0) - 64;
  return index - 1;
}

function numberText(value) {
  if (value === "" || value === undefined || value === null) return "";
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  if (Math.abs(num) >= 1000) return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return num.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

async function unzipText(xlsxPath, entry) {
  const { stdout } = await execFileAsync("unzip", ["-p", xlsxPath, entry], { maxBuffer: 50 * 1024 * 1024 });
  return stdout;
}

function parseRelationships(xml) {
  const rels = {};
  const relRe = /<Relationship\b([^>]+?)\/>/g;
  let match;
  while ((match = relRe.exec(xml))) {
    const attrs = match[1];
    const id = attrs.match(/\bId="([^"]+)"/)?.[1];
    const target = attrs.match(/\bTarget="([^"]+)"/)?.[1];
    if (id && target) rels[id] = target;
  }
  return rels;
}

function parseSheets(workbookXml, rels) {
  const sheets = [];
  const sheetRe = /<sheet\b([^>]+?)\/>/g;
  let match;
  while ((match = sheetRe.exec(workbookXml))) {
    const attrs = match[1];
    const name = decodeXml(attrs.match(/\bname="([^"]+)"/)?.[1] || "Sheet");
    const rid = attrs.match(/\br:id="([^"]+)"/)?.[1];
    const target = rels[rid] || "";
    sheets.push({ name, entry: target.startsWith("worksheets/") ? `xl/${target}` : `xl/${target}` });
  }
  return sheets;
}

function cellValue(cellXml) {
  const inlineMatch = cellXml.match(/<is>([\s\S]*?)<\/is>/);
  if (inlineMatch) {
    const texts = [...inlineMatch[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((part) => decodeXml(part[1]));
    return texts.join("");
  }
  const valueMatch = cellXml.match(/<v>([\s\S]*?)<\/v>/);
  if (valueMatch) return numberText(decodeXml(valueMatch[1]));
  return "";
}

function parseWorksheet(xml) {
  const rows = [];
  let maxCol = 0;
  const rowRe = /<row\b[^>]*\br="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch;
  while ((rowMatch = rowRe.exec(xml))) {
    const rowIndex = Number(rowMatch[1]) - 1;
    const row = rows[rowIndex] || [];
    const cellRe = /<c\b([^>]*)>([\s\S]*?)<\/c>|<c\b([^>]*)\/>/g;
    let cellMatch;
    while ((cellMatch = cellRe.exec(rowMatch[2]))) {
      const attrs = cellMatch[1] || cellMatch[3] || "";
      const ref = attrs.match(/\br="([^"]+)"/)?.[1];
      if (!ref) continue;
      const colIndex = colToIndex(ref);
      row[colIndex] = cellValue(cellMatch[0]);
      maxCol = Math.max(maxCol, colIndex + 1);
    }
    rows[rowIndex] = row;
  }
  return { rows, maxCol };
}

function tableHtml(sheet) {
  const body = sheet.rows
    .map((row, rowIndex) => {
      const cells = [];
      for (let col = 0; col < sheet.maxCol; col += 1) {
        const value = row?.[col] ?? "";
        const tag = rowIndex <= 3 ? "th" : "td";
        cells.push(`<${tag}>${esc(value)}</${tag}>`);
      }
      return `<tr>${cells.join("")}</tr>`;
    })
    .join("\n");
  return `<section class="sheet-block">
    <h2>${esc(sheet.name)}</h2>
    <div class="table-wrap"><table>${body}</table></div>
  </section>`;
}

function workbookHtml(meta, sheets) {
  return `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(meta.title)}</title>
    <style>
      body { margin: 0; background: #f5f6f8; color: #20252d; font-family: Arial, "PingFang TC", "Noto Sans TC", sans-serif; font-size: 13px; }
      header { padding: 18px 20px; background: #172026; color: #fff; }
      h1 { margin: 0; font-size: 22px; }
      header p { margin: 6px 0 0; color: #cbd5df; }
      main { padding: 16px; }
      .sheet-block { margin-bottom: 22px; }
      h2 { margin: 0 0 10px; font-size: 17px; }
      .table-wrap { overflow: auto; border: 1px solid #d9dee5; background: #fff; }
      table { border-collapse: collapse; min-width: 900px; width: 100%; }
      th, td { border: 1px solid #d9dee5; padding: 7px 8px; white-space: nowrap; vertical-align: top; mso-number-format: "\\@"; }
      th { background: #eef2f5; font-weight: 700; }
      tr:nth-child(even) td { background: #fbfcfd; }
    </style>
  </head>
  <body>
    <header>
      <h1>${esc(meta.title)}</h1>
      <p>${esc(meta.description)}｜HTML 版可用瀏覽器預覽，也可用 Excel 開啟。</p>
    </header>
    <main>
      ${sheets.map(tableHtml).join("\n")}
    </main>
  </body>
</html>`;
}

async function exportWorkbook(meta) {
  const xlsxPath = path.join(inputDir, meta.file);
  const [workbookXml, relsXml] = await Promise.all([
    unzipText(xlsxPath, "xl/workbook.xml"),
    unzipText(xlsxPath, "xl/_rels/workbook.xml.rels"),
  ]);
  const sheets = parseSheets(workbookXml, parseRelationships(relsXml));
  const parsedSheets = [];
  for (const sheet of sheets) {
    const sheetXml = await unzipText(xlsxPath, sheet.entry);
    parsedSheets.push({ name: sheet.name, ...parseWorksheet(sheetXml) });
  }
  const outputName = meta.file.replace(/\.xlsx$/i, ".html");
  await fs.writeFile(path.join(outputDir, outputName), workbookHtml(meta, parsedSheets));
  return outputName;
}

await fs.mkdir(outputDir, { recursive: true });
for (const workbook of workbooks) {
  const outputName = await exportWorkbook(workbook);
  console.log(`created ${outputName}`);
}
