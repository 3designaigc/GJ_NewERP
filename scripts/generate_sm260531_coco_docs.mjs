import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "generated_documents", "SM260531-26FA0009");
fs.mkdirSync(outDir, { recursive: true });

const today = "2026-06-15";
const orderNo = "SM-260531";
const piNo = "26FA0009";
const invoiceGJ = "NE-26009-GJCW-DRAFT";
const invoiceNexo = "NE-26009-DRAFT";

const parties = {
  gj: {
    name: "Golden Jade Terre Co., Ltd",
    address: "6F.-3, No. 16, Beiping E. Rd., Zhongzheng Dist., Taipei City 100009, Taiwan (R.O.C.)",
    contact: "Attn: Tina Huang · tinahuang@goldenjaderre.com",
    bank: "E. SUN Commercial Bank, Ltd. No.115-117, Sec. 3, Minsheng E. Rd., Taipei City 10546, Taiwan",
    account: "0417 441 021708",
    swift: "ESUNTWTP",
  },
  nexo: {
    name: "NEXO Resources Sdn Bhd",
    address: "1st Floor, Lot 10524, Block 16, 151 Jalan Tun Jugah, 93350 Kuching, Sarawak, Malaysia",
    contact: "Attn: Kelly · kellyywl@hotmail.com",
    bank: "Alliance Bank Malaysia Berhad 178, 1st & Ground Floor, Jalan Chan Chin Ann, 93100 Kuching, Sarawak, Malaysia",
    account: "110 3610 1000 1460",
    swift: "MFBBMYKL",
  },
  sm: {
    name: "SIMPLE MART PLUS CO., LTD.",
    address: "B1F, No.4, Sec. 3, Minquan E. Rd., Zhongshan Dist., Taipei City 104, Taiwan",
    contact: "Karen Chen · simplemart.com.tw",
  },
};

const items = [
  ["1264126", "8858768843276", "GOMUC香脆魷魚20g", "Crispy Squid Tentacles (Original Flavor)20g", "20g", "THAILAND", 24, 0.94, 22.56, 960, 40, 902.4],
  ["1264134", "8858768842323", "GOMUC烤魷魚片10g", "Grilled Squid 10g", "10g", "THAILAND", 48, 0.79, 37.92, 1920, 40, 1516.8],
  ["1264159", "8858768841432", "Tana香脆小魚乾(原味)65g", "Crispy Fish Original 65g", "65g", "THAILAND", 24, 0.85, 20.4, 1800, 75, 1530],
  ["1264167", "8858768841418", "Tana香脆小魚乾(芝麻)65g", "Crispy Fish Sesame 65g", "65g", "THAILAND", 24, 0.85, 20.4, 3120, 130, 2652],
  ["1264175", "8858768842521", "Tana香脆小魚乾(原味)35g", "Crispy Kozakana Fish (Original Flavor)35g", "35g", "THAILAND", 24, 0.9, 21.6, 432, 18, 388.8],
  ["1264183", "8858768843313", "Tana香脆鯷魚乾30g", "Crispy Anchovy (Natural Flavor)30g", "30g", "THAILAND", 24, 0.92, 22.08, 480, 20, 441.6],
  ["1264191", "8858768832416", "FruitMania什錦果仁30g-橘", "Trail Mix (Mixed Nuts and Dried Fruit)30g", "30g", "THAILAND", 24, 0.68, 16.32, 1200, 50, 816],
  ["1264209", "8858768832423", "FruitMania綜合果乾堅果30g-藍", "Daily Pack (Mixed Nuts and Dried Fruit)30g", "30g", "THAILAND", 24, 0.68, 16.32, 1248, 52, 848.64],
].map(([code, barcode, zh, en, size, origin, pcsPerCtn, unitPrice, ctnPrice, qtyPcs, qtyCtn, amount]) => ({
  code,
  barcode,
  zh,
  en,
  size,
  origin,
  pcsPerCtn,
  unitPrice,
  ctnPrice,
  qtyPcs,
  qtyCtn,
  amount,
}));

const gross = 9096.24;
const discount5 = 454.81;
const nexoReserve = 150;
const nexoSmTotal = 8641.43;
const gjNexoTotal = 8491.43;

function usd(value) {
  return `US$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function num(value) {
  return Number(value).toLocaleString("en-US");
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function partyBlock(label, party) {
  return `
    <section class="box">
      <div class="label">${label}</div>
      <strong>${esc(party.name)}</strong>
      <p>${esc(party.address)}</p>
      <p>${esc(party.contact || "")}</p>
    </section>
  `;
}

function base(title, issuer, footerName, body) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <style>
    @page { size: A4 portrait; margin: 7mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #111827; font-family: Arial, "PingFang TC", sans-serif; font-size: 9.4px; }
    .page { position: relative; min-height: 276mm; padding: 4mm 0 0; }
    .draft { position: absolute; top: 96mm; left: 24mm; transform: rotate(-25deg); font-size: 70px; color: rgba(180, 83, 9, 0.08); font-weight: 700; letter-spacing: 4px; }
    header { display: grid; grid-template-columns: 1fr 360px; gap: 16px; align-items: start; border-bottom: 3px solid #183b5b; padding-bottom: 10px; margin-bottom: 10px; }
    .issuer h1 { margin: 0 0 4px; color: #183b5b; font-size: 20px; }
    .issuer p { margin: 2px 0; color: #6b7280; }
    .doc-title { text-align: right; }
    .doc-title h2 { margin: 0 0 8px; color: #183b5b; font-size: 22px; letter-spacing: 0.5px; }
    .doc-title p { margin: 4px 0; font-size: 12px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 8px; }
    .grid-4 { display: grid; grid-template-columns: 0.75fr 0.8fr 1.8fr 1.7fr; gap: 4px; margin-bottom: 8px; }
    .box { border: 1px solid #b8bec8; padding: 6px 7px; min-height: 40px; }
    .label { color: #777; font-size: 10px; text-transform: uppercase; margin-bottom: 4px; }
    .box p { margin: 3px 0; line-height: 1.28; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th { background: #183b5b; color: white; font-weight: 700; text-align: center; }
    th, td { border: 1px solid #c7ccd4; padding: 4px 4px; vertical-align: middle; line-height: 1.16; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    td.center { text-align: center; }
    .total-row td { background: #eef3f8; border-top: 2px solid #183b5b; font-size: 11.5px; }
    .note-row td { border-left: 1px solid #183b5b; border-right: 1px solid #183b5b; text-align: right; }
    .bank { margin-top: 10px; border: 1px solid #b8bec8; padding: 8px; }
    .bank h3 { margin: 0 0 6px; color: #777; font-size: 10px; font-weight: 400; text-transform: uppercase; }
    .bank-grid { display: grid; grid-template-columns: 110px 1fr; row-gap: 4px; }
    .marks { margin-top: 8px; border: 1px solid #b8bec8; padding: 7px 8px; font-size: 13px; }
    .signature { position: absolute; left: 0; right: 0; bottom: 16mm; border-top: 1px solid #777; padding-top: 8px; display: flex; justify-content: space-between; font-size: 12px; }
    .draft-note { margin-top: 8px; color: #b45309; font-size: 11px; }
    .small { font-size: 9.5px; }
  </style>
</head>
<body>
  <main class="page">
    <div class="draft">DRAFT</div>
    <header>
      <div class="issuer">
        <h1>${esc(issuer.name)}</h1>
        <p>${esc(issuer.address)}</p>
        <p>${esc(issuer.contact || "")}</p>
      </div>
      <div class="doc-title">${body.titleBlock}</div>
    </header>
    ${body.content}
    <div class="signature">
      <span>For ${esc(footerName)}</span>
      <span>Date: ${today}</span>
    </div>
  </main>
</body>
</html>`;
}

function invoiceRows() {
  return items
    .map(
      (item) => `
        <tr>
          <td>${esc(item.code)}</td>
          <td>${esc(item.barcode)}</td>
          <td>${esc(item.zh)}<br>${esc(item.en)}</td>
          <td class="center">${esc(item.size)}</td>
          <td class="center">${esc(item.origin)}</td>
          <td class="center">${item.pcsPerCtn}</td>
          <td class="num">${item.unitPrice.toFixed(2).replace(/0$/, "").replace(/\\.0$/, "")}</td>
          <td class="num">${item.ctnPrice.toFixed(2)}</td>
          <td class="num">${num(item.qtyPcs)}</td>
          <td class="num">${num(item.qtyCtn)}</td>
          <td class="num">${usd(item.amount)}</td>
        </tr>
      `
    )
    .join("");
}

function invoiceDoc({ layer, issuer, customer, total, reserve }) {
  const isGJ = layer === "GJ-NEXO";
  return base(`CI_${layer}_SM-260531_Coco`, issuer, issuer.name, {
    titleBlock: `
      <h2>COMMERCIAL INVOICE</h2>
      <p>Date: ${today}</p>
      <p>Invoice No.: ${isGJ ? invoiceGJ : invoiceNexo}</p>
      <p class="draft-note">Draft prepared by Coco</p>
    `,
    content: `
      <div class="grid-2">
        ${partyBlock("Customer", customer)}
        <section class="box">
          <div class="label">Order Reference</div>
          <p>PO No.: ${orderNo}</p>
          <p>PI No.: ${piNo}</p>
          <p>Payment: 45 days after B/L copy</p>
        </section>
      </div>
      <div class="grid-4">
        <section class="box"><div class="label">Currency</div><strong>USD</strong></section>
        <section class="box"><div class="label">Trade Term</div><strong>FOB</strong></section>
        <section class="box"><div class="label">From</div><strong>BANGKOK/LAEM CHABANG, THAILAND</strong></section>
        <section class="box"><div class="label">To</div><strong>PORT KEELUNG, TAIWAN</strong></section>
      </div>
      <table>
        <colgroup>
          <col style="width:8%"><col style="width:10%"><col style="width:25%"><col style="width:5%"><col style="width:7%"><col style="width:6%"><col style="width:7%"><col style="width:8%"><col style="width:7%"><col style="width:6%"><col style="width:11%">
        </colgroup>
        <thead>
          <tr><th>Item Code</th><th>Barcode</th><th>品名 / Item Name</th><th>Size</th><th>Origin</th><th>Pcs / Ctn</th><th>Unit Price</th><th>Ctn Price</th><th>Q'ty (pcs)</th><th>Q'ty (ctn)</th><th>Amount (USD)</th></tr>
        </thead>
        <tbody>
          ${invoiceRows()}
          <tr class="note-row"><td colspan="10">Discount 5%</td><td class="num">-${usd(discount5)}</td></tr>
          ${reserve ? `<tr class="note-row"><td colspan="10">Discount</td><td class="num">-${usd(reserve)}</td></tr>` : ""}
          <tr class="total-row"><td colspan="8" class="num"><strong>Grand TOTAL 合計</strong></td><td class="num">${num(11160)}</td><td class="num">${num(425)}</td><td class="num"><strong>${usd(total)}</strong></td></tr>
        </tbody>
      </table>
      <div class="bank">
        <h3>Beneficiary Information</h3>
        <div class="bank-grid">
          <strong>Beneficiary</strong><span>${esc(issuer.name)}</span>
          <strong>Bank</strong><span>${esc(issuer.bank || "")}</span>
          <strong>A/C No.</strong><span>${esc(issuer.account || "")}</span>
          <strong>Swift</strong><span>${esc(issuer.swift || "")}</span>
        </div>
      </div>
      <p class="draft-note">Draft only. Vessel/voyage, container/seal, final B/L data, COO and HC/COA details are pending.</p>
    `,
  });
}

function packingRows() {
  return items
    .map(
      (item, index) => `
        <tr>
          <td class="center">${index + 1}</td>
          <td>${esc(item.barcode)}</td>
          <td>${esc(item.en)}<br>${esc(item.zh)}</td>
          <td class="center">${esc(item.size)} x ${item.pcsPerCtn} pcs/ctn</td>
          <td class="num">${num(item.qtyCtn)}</td>
          <td class="center">TBA</td>
          <td class="center">TBA</td>
          <td class="center">TBA</td>
        </tr>
      `
    )
    .join("");
}

function packingDoc({ layer, issuer, buyer, consignee }) {
  const isGJ = layer === "GJ-NEXO";
  return base(`PL_${layer}_SM-260531_Coco`, issuer, issuer.name, {
    titleBlock: `
      <h2>PACKING LIST</h2>
      <p>Date: ${today}</p>
      <p>Invoice No.: ${isGJ ? invoiceGJ : invoiceNexo}</p>
      <p class="draft-note">Draft prepared by Coco</p>
    `,
    content: `
      <div class="grid-2">
        ${partyBlock("Buyer", buyer)}
        ${partyBlock("Consignee", consignee)}
      </div>
      <div class="grid-4">
        <section class="box"><div class="label">Vessel / Voyage</div><strong>TBA</strong></section>
        <section class="box"><div class="label">Port of Loading · ETD</div><strong>BANGKOK/LAEM CHABANG, THAILAND</strong><p>ETD: 05-Jul-2026</p></section>
        <section class="box"><div class="label">Port of Discharge · ETA</div><strong>PORT KEELUNG, TAIWAN</strong><p>ETA: 15-Jul-2026</p></section>
        <section class="box"><div class="label">Container / Seal</div><strong>TBA / TBA</strong></section>
      </div>
      <table>
        <colgroup>
          <col style="width:5%"><col style="width:13%"><col style="width:39%"><col style="width:15%"><col style="width:7%"><col style="width:7%"><col style="width:7%"><col style="width:7%">
        </colgroup>
        <thead>
          <tr><th>No</th><th>Barcode</th><th>Description 品名</th><th>Packing</th><th>Ctns</th><th>Expiry</th><th>N.W. (kg)</th><th>G.W. (kg)</th></tr>
        </thead>
        <tbody>
          ${packingRows()}
          <tr class="total-row"><td colspan="4" class="num"><strong>TOTAL</strong></td><td class="num"><strong>425</strong></td><td class="center">TBA</td><td class="center">TBA</td><td class="center">TBA</td></tr>
        </tbody>
      </table>
      <div class="marks">
        <div class="label">Shipping Marks</div>
        PRODUCT OF THAILAND · SIMPLE MART PLUS CO., LTD. · TOTAL QTY: 425 CTNS
      </div>
      <p class="draft-note">Draft only. Expiry, N.W., G.W., vessel/voyage, container/seal and final shipping marks are pending supplier/shipping documents.</p>
    `,
  });
}

const docs = [
  ["CI_GJ-NEXO_SM-260531_Coco.html", invoiceDoc({ layer: "GJ-NEXO", issuer: parties.gj, customer: parties.nexo, total: gjNexoTotal, reserve: nexoReserve })],
  ["CI_NEXO-SM_SM-260531_Coco.html", invoiceDoc({ layer: "NEXO-SM", issuer: parties.nexo, customer: parties.sm, total: nexoSmTotal, reserve: 0 })],
  ["PL_GJ-NEXO_SM-260531_Coco.html", packingDoc({ layer: "GJ-NEXO", issuer: parties.gj, buyer: parties.nexo, consignee: parties.sm })],
  ["PL_NEXO-SM_SM-260531_Coco.html", packingDoc({ layer: "NEXO-SM", issuer: parties.nexo, buyer: parties.sm, consignee: parties.sm })],
];

for (const [filename, content] of docs) {
  fs.writeFileSync(path.join(outDir, filename), content);
}

fs.writeFileSync(
  path.join(outDir, "README.md"),
  `# SM260531-26FA0009 Coco Draft Documents

Generated: ${today}

Draft files:

- CI_GJ-NEXO_SM-260531_Coco
- CI_NEXO-SM_SM-260531_Coco
- PL_GJ-NEXO_SM-260531_Coco
- PL_NEXO-SM_SM-260531_Coco

These are draft documents based on confirmed PO/PI data. COO, HC/COA, B/L, vessel, container, seal, final weights, expiry and final shipping details remain pending.
`
);

console.log(outDir);
