const state = {
  products: [],
  productTech: {},
  suppliers: [],
  cashflow: [],
  tasks: [],
  docChecks: [],
  docTracks: [],
  shipments: [],
  tradeRules: {},
  documentArchive: {},
  orderDocumentScan: {},
  transferDocumentRules: {},
  currentUser: null,
  salesQuoteMap: new Map(),
  quoteCart: [],
  quoteMode: "quote",
  savedSalesOrders: [],
  procurementOrders: [],
  selectedProcurementOrderId: null,
};

const users = {
  sales: {
    password: "gj-sales-2026",
    name: "業務",
    role: "sales",
    roleLabel: "業務",
    permissions: {
      costs: false,
      quote: true,
      quoteFloor: true,
      cashflow: false,
      orderAnalysis: true,
      suppliers: false,
      supplierSensitive: false,
      tracking: false,
      procurement: false,
      documentArchive: false,
      productScope: "frozen_or_costco",
    },
  },
  manager: {
    password: "gj-manager-2026",
    name: "業務主管",
    role: "manager",
    roleLabel: "業務主管",
    permissions: {
      costs: false,
      quote: false,
      quoteFloor: true,
      cashflow: false,
      orderAnalysis: false,
      suppliers: false,
      supplierSensitive: false,
      tracking: true,
      procurement: true,
      documentArchive: true,
      productScope: "all",
    },
  },
  owner: {
    password: "gj-owner-2026",
    name: "本人",
    role: "owner",
    roleLabel: "本人",
    permissions: {
      costs: true,
      quote: true,
      quoteFloor: true,
      cashflow: true,
      orderAnalysis: true,
      suppliers: true,
      supplierSensitive: true,
      tracking: true,
      procurement: true,
      documentArchive: true,
      productScope: "all",
    },
  },
};

const files = {
  products: "json/products_final.json",
  productTech: "json/product_tech.json",
  sales: "json/sales_d3.json",
  suppliers: "json/supplier_master.json",
  cashflow: "json/cashflow_base.json",
  tasks: "json/TDS待辦追蹤.json",
  docChecks: "json/文件核對.json",
  docTracks: "json/文件追蹤.json",
  shipments: "json/船班追蹤.json",
  tradeRules: "json/交易模式對應.json",
  documentArchive: "json/document_archive_rules.json",
  orderDocumentScan: "json/order_document_scan.json",
  transferDocumentRules: "json/transfer_document_rules.json",
};

const procurementModeConfig = {
  A: {
    title: "TDS 代採佣金訂單草稿",
    subtitle: "收佣金(TDS)",
    poType: "TDS Agency Purchase Instruction",
    paymentRule: "BL/ETD + 90，與 TDS 清帳",
    cashflowRule: "只建立應收毛利；不認列完整買斷庫存成本。",
    supplierInstruction: "請供應商對 TDS / 指定窗口提供 PI，價格與箱數需可回填高玉佣金計算。",
    documentNote: "PI、CI、PL、COO、HC / COA、B/L 需支援 TDS 代採文件核對。",
  },
  B: {
    title: "PC 東森直銷佣金訂單草稿",
    subtitle: "收佣金(PC)",
    poType: "PC Direct Sales Commission Instruction",
    paymentRule: "BL + 90；高玉應收毛利 10%，並產生應付半額給 TDS。",
    cashflowRule: "建立 PC 佣金應收與 TDS 半額應付，不作一般買斷處理。",
    supplierInstruction: "確認 Pietro Coricelli / PC 品牌、東森客戶條件與 TDS 分潤基準。",
    documentNote: "PI 必須標明 PC 品牌品名、客戶、數量與 BL 日期，以利 BL+90 計算。",
  },
  C: {
    title: "買進轉手採購訂單草稿",
    subtitle: "買進轉手",
    poType: "Resale Purchase Order",
    paymentRule: "依供應商條件建立應付；同時建立客戶應收與高玉毛利。",
    cashflowRule: "完整認列進貨成本、銷貨收入、毛利；所有 C 類訂單都需保留 NEXO 利潤。",
    supplierInstruction: "請供應商確認買斷價格、交期、箱規與可銷售文件。",
    documentNote: "文件需支援高玉買斷再銷售，並依客戶訂單金額保留 NEXO 利潤。",
  },
  D: {
    title: "台幣到倉買進 / 寄倉訂單草稿",
    subtitle: "買進/寄倉",
    poType: "Landed Cost Purchase Order",
    paymentRule: "Feast/G7: 透過 TDS，BL+65；Europastry: BL+60；VIRU: 50% PO + 50% BL。",
    cashflowRule: "先核算台幣到倉成本，再建立採購、庫存、應付與後續銷售底線。",
    supplierInstruction: "確認 EXW/FOB/CIF 基準、冷凍溫層、箱/板、BBD 與到倉成本公式。",
    documentNote: "冷凍與到倉價文件需含溫層、效期、棧板、CI、PL、COO、HC / COA、B/L。",
  },
  E: {
    title: "根因佣金訂單草稿",
    subtitle: "收佣金(根因)",
    poType: "Genyin Commission Purchase Instruction",
    paymentRule: "LC 開狀 + 90；只應收毛利，不分根因。",
    cashflowRule: "建立根因佣金應收；不套用一般 TDS 或買斷規則。",
    supplierInstruction: "確認天津 / 根因文件、LC 開狀時間與毛利計算基準。",
    documentNote: "PI 與後續文件需能回推 LC 開狀日，作為 +90 收款節點。",
  },
  U: {
    title: "未分類交易模式待確認",
    subtitle: "未分類_待確認",
    poType: "Pending Trade Mode Review",
    paymentRule: "暫停自動付款節點，待本人確認。",
    cashflowRule: "不自動建立現金流。",
    supplierInstruction: "新供應商或費用類品項不得自動下單。",
    documentNote: "待確認後再產生正式文件要求。",
  },
};

const viewMeta = {
  dashboard: ["總覽", "主檔資料量、交易模式與待辦狀態"],
  projects: ["專案", "NewERP 作業檔案與階段成果"],
  salesQuote: ["業務報價", "挑選商品、建立報價單並送出訂單草稿"],
  products: ["商品", "商品主檔、成本、狀態與報價基礎"],
  suppliers: ["供應商", "供應商條件、聯絡與付款基礎資料"],
  orderAnalysis: ["訂單分析", "PO、客戶、供應商、商品與預估日期"],
  procurement: ["國際採購", "業務下單合規審核、本人核准與國外採購訂單草稿"],
  cashflow: ["現金流", "應收、應付、PO 與預估日期"],
  tracking: ["PO追蹤", "文件核對、文件追蹤、船班與 TDS 待辦"],
  documentArchive: ["文件歸檔", "出貨文件清單、雲端資料夾規範與歸檔狀態"],
};

const $ = (id) => document.getElementById(id);

function can(permission) {
  return Boolean(state.currentUser?.permissions?.[permission]);
}

function mask(value) {
  return can("costs") ? value : "權限不足";
}

function productKeyFromValues(supplierCode, name, spec) {
  return [supplierCode || "", name || "", spec || ""].join("::");
}

function productKey(row) {
  return productKeyFromValues(row["供應商編號"], row["中文品名"], row["規格"]);
}

function isCostcoProject(row) {
  return String(row["適用通路"] || "").includes("好市多");
}

function visibleProducts() {
  if (state.currentUser?.permissions?.productScope === "frozen_or_costco") {
    return state.products.filter((row) => row["型態"] === "冷凍" || isCostcoProject(row));
  }
  return state.products;
}

function quoteBasisLabel(basis) {
  return basis === "TWD_LANDED" ? "台幣到倉價" : "外幣報價";
}

function quoteCurrency(row, basis) {
  return basis === "TWD_LANDED" ? "TWD" : currencyCode(row["幣別"]);
}

function quotePrice(row, basis) {
  if (basis === "TWD_LANDED") {
    return numberValue(row["台幣最低報價"]) || numberValue(row["台幣10%底線"]);
  }
  return numberValue(state.salesQuoteMap.get(productKey(row))) || numberValue(row["外幣10%底線"]);
}

function quoteFloor(row, basis) {
  if (basis === "TWD_LANDED") return numberValue(row["台幣10%底線"]) || numberValue(row["台幣最低報價"]);
  return numberValue(row["外幣10%底線"]);
}

function quoteCartTotal() {
  return state.quoteCart.reduce((sum, item) => sum + item.cartons * item.price, 0);
}

function quoteCartCurrency() {
  return state.quoteCart[0]?.currency || "USD";
}

function text(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join("、") || "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function money(value) {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (!Number.isFinite(num)) return text(value);
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 2 }).format(num);
}

function numberValue(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function currencyCode(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("euro") || normalized.includes("eur")) return "EUR";
  if (normalized.includes("usd")) return "USD";
  if (normalized.includes("nt") || normalized.includes("twd") || normalized.includes("台")) return "TWD";
  return value || "—";
}

function includesAny(row, keyword, fields) {
  if (!keyword) return true;
  const q = keyword.trim().toLowerCase();
  return fields.some((field) => text(row[field]).toLowerCase().includes(q));
}

function uniqueOptions(rows, field, label) {
  const values = [...new Set(rows.map((row) => row[field]).filter(Boolean).map(String))].sort((a, b) =>
    a.localeCompare(b, "zh-Hant")
  );
  return [`<option value="">${label}</option>`, ...values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)].join("");
}

function escapeHtml(value) {
  return text(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function countBy(rows, field) {
  const counts = new Map();
  rows.forEach((row) => {
    const key = text(row[field]);
    if (key !== "—") counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function renderBars(targetId, entries) {
  const max = Math.max(1, ...entries.map((entry) => entry[1]));
  $(targetId).innerHTML = entries
    .slice(0, 8)
    .map(([label, count]) => {
      const width = Math.max(4, Math.round((count / max) * 100));
      return `
        <div class="bar-row">
          <div class="bar-label">${escapeHtml(label)}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
          <div class="bar-count">${count}</div>
        </div>
      `;
    })
    .join("");
}

function objectMapToRows(data, sourceName) {
  if (!data || typeof data !== "object") return [];
  const source = data.PO && typeof data.PO === "object" ? data.PO : data;
  return Object.entries(source)
    .filter(([key]) => !key.startsWith("_"))
    .flatMap(([key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return [{ PO: key, sourceName, ...value }];
      }
      return [{ PO: key, sourceName, value }];
    });
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path} ${response.status}`);
  return response.json();
}

async function loadData() {
  const entries = await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await loadJson(path)]));
  const loaded = Object.fromEntries(entries);

  state.products = loaded.products;
  state.productTech = loaded.productTech;
  state.suppliers = loaded.suppliers;
  state.cashflow = loaded.cashflow;
  state.tasks = loaded.tasks.items || [];
  state.docChecks = objectMapToRows(loaded.docChecks, "文件核對");
  state.docTracks = objectMapToRows(loaded.docTracks, "文件追蹤");
  state.shipments = objectMapToRows(loaded.shipments, "船班");
  state.tradeRules = loaded.tradeRules || {};
  state.documentArchive = loaded.documentArchive || {};
  state.orderDocumentScan = loaded.orderDocumentScan || {};
  state.transferDocumentRules = loaded.transferDocumentRules || {};
  state.salesQuoteMap = new Map(
    loaded.sales
      .filter((row) => Array.isArray(row))
      .map((row) => [productKeyFromValues(row[0], row[2], row[4]), row[15]])
  );
  state.savedSalesOrders = loadSavedSalesOrders();
  state.procurementOrders = [...state.savedSalesOrders, ...buildProcurementOrders()];
  state.selectedProcurementOrderId = state.procurementOrders.find((order) => order.status === "approved")?.id || null;
}

function loadSavedSalesOrders() {
  try {
    return JSON.parse(localStorage.getItem("gj_sales_orders") || "[]");
  } catch {
    return [];
  }
}

function saveSalesOrders() {
  localStorage.setItem("gj_sales_orders", JSON.stringify(state.savedSalesOrders.slice(0, 50)));
}

function buildProcurementOrders() {
  const tds = state.products.find((row) => resolveTradeMode(row, "生活良好").category === "A");
  const pc = state.products.find((row) => resolveTradeMode(row, "東森").category === "B");
  const resale = state.products.find((row) => resolveTradeMode(row).category === "C" && numberValue(row["外幣10%底線"]) > 0);
  const landed = state.products.find((row) => resolveTradeMode(row).category === "D" && numberValue(row["台幣最低報價"]) > 0);
  const genyin = state.products.find((row) => resolveTradeMode(row).category === "E");
  const costco = state.products.find((row) => isCostcoProject(row)) || landed;
  return [
    createProcurementOrder({
      id: "SO-2026-0614-001",
      customer: "生活良好",
      channel: "全通路",
      quoteBasis: "FOREIGN",
      requestedPrice: numberValue(tds?.["外幣10%底線"]) + 0.2,
      cartons: 120,
      product: tds,
      note: "TDS 代採佣金模式，合規後產生 TDS 採購指示草稿。",
    }),
    createProcurementOrder({
      id: "SO-2026-0614-002",
      customer: "東森",
      channel: "直銷",
      quoteBasis: "FOREIGN",
      requestedPrice: numberValue(pc?.["外幣10%底線"]) + 0.2,
      cartons: 90,
      product: pc,
      note: "PC 東森直銷佣金模式，需同步 TDS 半額應付規則。",
    }),
    createProcurementOrder({
      id: "SO-2026-0614-003",
      customer: "一般貿易客戶",
      channel: "全通路",
      quoteBasis: "FOREIGN",
      requestedPrice: numberValue(resale?.["外幣10%底線"]) + 0.3,
      cartons: 60,
      product: resale,
      note: "買進轉手模式，會建立完整進貨成本、銷貨收入與毛利。",
    }),
    createProcurementOrder({
      id: "SO-2026-0614-004",
      customer: "高玉冷凍通路",
      channel: "冷凍品",
      quoteBasis: "TWD_LANDED",
      requestedPrice: numberValue(landed?.["台幣最低報價"]) + 2,
      cartons: 120,
      product: landed,
      note: "台幣到倉買進 / 寄倉模式，採購草稿需帶入到倉成本與付款節點。",
    }),
    createProcurementOrder({
      id: "SO-2026-0614-005",
      customer: "根因專案客戶",
      channel: "專案",
      quoteBasis: "FOREIGN",
      requestedPrice: numberValue(genyin?.["外幣10%底線"]) + 0.2,
      cartons: 50,
      product: genyin,
      note: "根因佣金模式，採 LC 開狀 + 90 的收款規則。",
    }),
    createProcurementOrder({
      id: "SO-2026-0614-006",
      customer: "好市多專案",
      channel: "好市多",
      quoteBasis: "TWD_LANDED",
      requestedPrice: Math.max(1, numberValue(costco?.["台幣10%底線"]) - 1),
      cartons: 80,
      product: costco,
      note: "好市多專案低於底線，必須先由本人核准。",
    }),
  ].filter(Boolean);
}

function resolveTradeMode(row, customer = "") {
  const supplier = String(row?.["供應商"] || "");
  const name = `${row?.["中文品名"] || ""} ${row?.["英文品名"] || ""}`;
  const specialText = `${name} ${row?.["產品類別"] || ""}`;
  if (supplier === "TDS" && /墊付|代墊|紙袋|印刷|費用/.test(specialText)) {
    return { mode: "未分類_待確認", category: "U", source: "TDS費用類特例" };
  }
  const brandRules = state.tradeRules["品牌判斷"]?.["Pietro Coricelli"];
  if (supplier === "PC" || supplier.includes("Pietro") || name.includes("Pietro") || name.includes("Cirio") || name.includes("奇里歐")) {
    for (const rule of brandRules?.["規則"] || []) {
      const target = rule["條件"] === "客戶含" ? customer : name;
      if ((rule["關鍵字"] || []).some((keyword) => target.includes(keyword))) {
        return { mode: rule["模式"], category: rule["類別"], source: "PC品牌/客戶規則" };
      }
    }
    const fallback = brandRules?.["預設"];
    if (fallback) return { mode: fallback["模式"], category: fallback["類別"], source: "PC預設規則" };
  }
  const supplierRule = state.tradeRules["供應商對應"]?.[supplier];
  if (supplierRule) return { mode: supplierRule["模式"], category: supplierRule["類別"], source: "供應商對應", note: supplierRule["備註"] || "" };
  const mode = String(row?.["交易模式"] || "");
  if (mode.includes("TDS")) return { mode: "收佣金(TDS)", category: "A", source: "商品交易模式" };
  if (mode.includes("PC")) return { mode: "收佣金(PC)", category: "B", source: "商品交易模式" };
  if (mode.includes("轉手")) return { mode: "買進轉手", category: "C", source: "商品交易模式" };
  if (mode === "買進") return { mode: "買進", category: "D", source: "商品交易模式" };
  if (mode.includes("根因")) return { mode: "收佣金(根因)", category: "E", source: "商品交易模式" };
  return { mode: "未分類_待確認", category: "U", source: "無對應規則" };
}

function createProcurementOrder(config) {
  const row = config.product;
  if (!row) return null;
  const tradeMode = resolveTradeMode(row, config.customer);
  const modeConfig = procurementConfigFor(row, tradeMode.category);
  const quoteBasis = config.quoteBasis;
  const isTwd = quoteBasis === "TWD_LANDED";
  const floor = isTwd ? numberValue(row["台幣10%底線"]) : numberValue(row["外幣10%底線"]);
  const hasRequiredCost = !isTwd || numberValue(row["台幣總成本"]) > 0;
  const channelRequiresTwd = ["好市多", "冷凍品"].includes(config.channel) || row["報價交易條件"] === "到倉價";
  const usesAllowedBasis = !channelRequiresTwd || isTwd;
  const priceOk = config.requestedPrice >= floor && floor > 0;
  const status = priceOk && hasRequiredCost && usesAllowedBasis ? "approved" : "approval";
  const reasons = [];
  if (!priceOk) reasons.push("低於報價底線");
  if (!hasRequiredCost) reasons.push("缺台幣到倉成本");
  if (!usesAllowedBasis) reasons.push("此客戶/通路僅允許台幣到倉價");
  if (tradeMode.category === "U") reasons.push("交易模式未分類，需本人確認");
  return {
    ...config,
    product: row,
    tradeMode,
    modeConfig,
    currency: isTwd ? "TWD" : currencyCode(row["幣別"]),
    floor,
    status: status === "approved" && tradeMode.category !== "U" ? "approved" : "approval",
    reasons,
    poNo: `GJ-PO-${config.id.split("-").slice(-1)[0]}`,
    incoterms: row["報價交易條件"] || row["成本交易條件"] || "TBD",
    payment: modeConfig.paymentRule || row["付款條件"] || "TBD",
  };
}

function procurementConfigFor(row, category) {
  const base = procurementModeConfig[category] || procurementModeConfig.U;
  if (category !== "D") return base;
  const supplier = String(row["供應商"] || "");
  if (supplier.includes("Feast")) return { ...base, paymentRule: "Feast 透過 TDS，應付 BL + 65。" };
  if (supplier === "G7") {
    return {
      ...base,
      title: "G7 透過 TDS 買進訂單草稿",
      poType: "G7 via TDS Purchase Order",
      paymentRule: "G7 走 Feast 模式：高玉透過 TDS 採購，應付 BL + 65。",
      cashflowRule: "G7 不套 C 類 NEXO 留利；以透過 TDS 買進處理，建立採購與應付 BL+65。",
      supplierInstruction: "請依 TDS 採購窗口確認 G7 價格、箱數、交期與 PI；付款節點比照 Feast BL+65。",
    };
  }
  if (supplier.includes("Europastry")) return { ...base, paymentRule: "Europastry 直採，應付 BL + 60。" };
  if (supplier.includes("VIRU")) return { ...base, paymentRule: "VIRU 直採，50% PO + 50% BL。" };
  return base;
}

function nexoReserve(order, lineTotal) {
  if (order.tradeMode.category !== "C") return null;
  const reserve = lineTotal > 10000 ? 450 : 150;
  return {
    reserve,
    threshold: 10000,
    text: `C 類買進轉手全數保留 NEXO 利潤；客戶訂單金額 ${order.currency} ${money(lineTotal)} ${lineTotal > 10000 ? "大於" : "小於或等於"} USD 10,000，保留 USD ${money(reserve)} 給 NEXO。`,
  };
}

function renderDashboard() {
  const payable = state.cashflow.filter((row) => row.type === "應付").reduce((sum, row) => sum + Number(row.twd_amt || 0), 0);
  const receivable = state.cashflow.filter((row) => row.type === "應收").reduce((sum, row) => sum + Number(row.twd_amt || 0), 0);
  const metrics = [
    ["商品", visibleProducts().length],
    ["供應商", state.suppliers.length],
    ["PO追蹤", state.docChecks.length + state.docTracks.length + state.shipments.length],
    ["TDS待辦", state.tasks.length],
    ["商品技術", Object.keys(state.productTech).length],
  ];
  if (can("cashflow")) {
    metrics.splice(2, 0, ["現金流", state.cashflow.length]);
    metrics.push(["應收台幣", money(receivable)], ["應付台幣", money(payable)]);
  }
  if (can("orderAnalysis")) {
    metrics.splice(2, 0, ["訂單分析", new Set(state.cashflow.map((row) => row.po).filter(Boolean)).size]);
  }
  $("metricGrid").innerHTML = metrics
    .map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");

  renderBars("tradeModeList", countBy(state.products, "交易模式"));
  renderBars("taskStatusList", countBy(state.tasks, "狀態"));
}

function renderProducts() {
  const keyword = $("productSearch").value;
  const type = $("productTypeFilter").value;
  const status = $("productStatusFilter").value;
  const rows = visibleProducts().filter(
    (row) =>
      (!type || row["型態"] === type) &&
      (!status || row["狀態"] === status) &&
      includesAny(row, keyword, ["中文品名", "英文品名", "供應商", "EAN", "產品類別", "供應商編號"])
  );
  $("productsBody").innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row["供應商編號"])}</td>
          <td>${escapeHtml(row["中文品名"])}</td>
          <td>${escapeHtml(row["英文品名"])}</td>
          <td>${escapeHtml(row["供應商"])}</td>
          <td><span class="pill">${escapeHtml(row["型態"])}</span></td>
          <td>${escapeHtml(row["產品類別"])}</td>
          <td>${escapeHtml(row["幣別"])}</td>
          <td class="num" data-column="cost">${escapeHtml(mask(money(row["成本價"])))}</td>
          <td class="num" data-column="quote">${can("quote") ? money(state.salesQuoteMap.get(productKey(row))) : "權限不足"}</td>
          <td class="num" data-column="quoteFloor">${can("quoteFloor") ? money(row["外幣10%底線"]) : "權限不足"}</td>
          <td class="num" data-column="cost">${can("costs") ? money(row["台幣總成本"]) : "權限不足"}</td>
          <td class="num" data-column="quote">${can("quote") ? money(row["台幣最低報價"]) : "權限不足"}</td>
          <td class="num" data-column="quoteFloor">${can("quoteFloor") ? money(row["台幣10%底線"]) : "權限不足"}</td>
          <td data-column="quoteFloor">${can("quoteFloor") ? escapeHtml(row["台幣價來源"]) : "權限不足"}</td>
          <td>${escapeHtml(row["狀態"])}</td>
        </tr>
      `
    )
    .join("");
}

function quoteProductRows() {
  const keyword = $("quoteProductSearch").value;
  const type = $("quoteTypeFilter").value;
  const supplier = $("quoteSupplierFilter").value;
  const basis = $("quoteBasisFilter").value;
  return visibleProducts()
    .filter(
      (row) =>
        (!type || row["型態"] === type) &&
        (!supplier || row["供應商"] === supplier) &&
        quotePrice(row, basis) > 0 &&
        includesAny(row, keyword, ["中文品名", "英文品名", "供應商", "EAN", "規格", "供應商編號"])
    )
    .slice(0, 80);
}

function renderSalesQuote() {
  if (!can("quote")) return;
  const basis = $("quoteBasisFilter").value;
  const rows = quoteProductRows();
  $("quoteProductCount").textContent = `${rows.length} 筆可選`;
  $("quoteProductBody").innerHTML = rows
    .map((row) => {
      const key = productKey(row);
      const price = quotePrice(row, basis);
      const floor = quoteFloor(row, basis);
      const currency = quoteCurrency(row, basis);
      return `
        <tr>
          <td>
            <strong>${escapeHtml(row["中文品名"])}</strong>
            <span class="muted">${escapeHtml(row["英文品名"])}</span>
          </td>
          <td>${escapeHtml(row["供應商"])}</td>
          <td>${escapeHtml(row["規格"])}</td>
          <td>${escapeHtml(row["EAN"])}</td>
          <td class="num">${escapeHtml(currency)} ${money(price)}</td>
          <td class="num">${escapeHtml(currency)} ${money(floor)}</td>
          <td><button class="small-btn" type="button" data-add-quote="${escapeHtml(key)}">加入</button></td>
        </tr>
      `;
    })
    .join("");
  renderQuoteCart();
}

function renderQuoteCart() {
  const hasItems = state.quoteCart.length > 0;
  $("quoteEmptyState").classList.toggle("hidden", hasItems);
  document.querySelector(".quote-cart-table").classList.toggle("hidden", !hasItems);
  $("quoteFormTitle").textContent = state.quoteMode === "order" ? "業務訂單草稿" : "業務報價單";
  document.querySelectorAll(".quote-mode").forEach((button) => button.classList.toggle("active", button.dataset.quoteMode === state.quoteMode));
  $("quoteCartBody").innerHTML = state.quoteCart
    .map((item, index) => {
      const ok = item.price >= item.floor && item.floor > 0;
      return `
        <tr>
          <td>
            <strong>${escapeHtml(item.name)}</strong>
            <span class="muted">${escapeHtml(item.englishName)}</span>
          </td>
          <td>${escapeHtml(item.supplier)}</td>
          <td class="num"><input class="line-input num" data-cart-index="${index}" data-cart-field="cartons" type="number" min="1" value="${escapeHtml(item.cartons)}" /></td>
          <td class="num"><input class="line-input num" data-cart-index="${index}" data-cart-field="price" type="number" min="0" step="0.01" value="${escapeHtml(item.price)}" /></td>
          <td class="num">${escapeHtml(item.currency)} ${money(item.floor)}</td>
          <td class="num">${escapeHtml(item.currency)} ${money(item.cartons * item.price)}</td>
          <td><span class="pill ${ok ? "in" : "out"}">${ok ? "合規" : "待核准"}</span></td>
          <td><button class="icon-btn" type="button" data-remove-quote="${index}" title="移除">×</button></td>
        </tr>
      `;
    })
    .join("");
  const total = quoteCartTotal();
  const allApproved = hasItems && state.quoteCart.every((item) => item.price >= item.floor && item.floor > 0);
  $("quoteLineCount").textContent = state.quoteCart.length;
  $("quoteGrandTotal").textContent = hasItems ? `${quoteCartCurrency()} ${money(total)}` : "—";
  $("quoteApprovalStatus").textContent = !hasItems ? "尚未選品" : allApproved ? "符合底線，可送單" : "低於底線，需本人核准";
  $("quoteStatusPill").textContent = state.quoteMode === "order" ? "訂單草稿" : "報價草稿";
  $("quoteStatusPill").className = `pill ${allApproved ? "in" : "out"}`;
}

function addQuoteItem(key) {
  const row = visibleProducts().find((product) => productKey(product) === key);
  if (!row) return;
  const basis = $("quoteBasisFilter").value;
  $("quoteBasis").value = basis;
  const currency = quoteCurrency(row, basis);
  const existing = state.quoteCart.find((item) => item.key === key && item.basis === basis);
  if (existing) {
    existing.cartons += 1;
    renderQuoteCart();
    return;
  }
  state.quoteCart.push({
    key,
    basis,
    currency,
    product: row,
    name: row["中文品名"],
    englishName: row["英文品名"],
    supplier: row["供應商"],
    cartons: 1,
    price: quotePrice(row, basis),
    floor: quoteFloor(row, basis),
  });
  renderQuoteCart();
}

function quoteDocumentText() {
  const customer = $("quoteCustomerName").value.trim() || $("quoteCustomer").value;
  const validDays = $("quoteValidDays").value || "30";
  const today = new Date().toISOString().slice(0, 10);
  const lines = state.quoteCart.map((item, index) => {
    const status = item.price >= item.floor && item.floor > 0 ? "合規" : "需本人核准";
    return `${index + 1}. ${item.name}｜${item.supplier}｜${item.cartons}箱 x ${item.currency} ${money(item.price)} = ${item.currency} ${money(item.cartons * item.price)}｜${status}`;
  });
  return [
    `高玉業務報價單`,
    `日期：${today}`,
    `客戶：${customer}`,
    `報價別：${quoteBasisLabel($("quoteBasis").value)}`,
    `有效天數：${validDays}`,
    ``,
    ...lines,
    ``,
    `合計：${quoteCartCurrency()} ${money(quoteCartTotal())}`,
  ].join("\n");
}

function createOrderFromQuote() {
  if (!state.quoteCart.length) return;
  const customer = $("quoteCustomerName").value.trim() || $("quoteCustomer").value;
  const orderId = `SO-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(state.procurementOrders.length + 1).padStart(3, "0")}`;
  const allApproved = state.quoteCart.every((item) => item.price >= item.floor && item.floor > 0);
  const created = state.quoteCart.map((item, index) =>
    createProcurementOrder({
      id: `${orderId}-${index + 1}`,
      customer,
      channel: $("quoteCustomer").value,
      quoteBasis: item.basis,
      requestedPrice: item.price,
      cartons: item.cartons,
      product: item.product,
      note: `由業務報價系統送出；${allApproved ? "符合底線" : "含低於底線品項，需本人核准"}。`,
    })
  );
  state.procurementOrders = [...created.filter(Boolean), ...state.procurementOrders];
  state.savedSalesOrders = [...created.filter(Boolean), ...state.savedSalesOrders];
  saveSalesOrders();
  state.selectedProcurementOrderId = created.find((order) => order?.status === "approved")?.id || created[0]?.id || state.selectedProcurementOrderId;
  state.quoteMode = "order";
  $("quoteOutput").textContent = [`已送出訂單草稿：${orderId}`, quoteDocumentText()].join("\n\n");
  renderQuoteCart();
  renderProcurement();
}

function renderSuppliers() {
  const keyword = $("supplierSearch").value;
  const type = $("supplierTypeFilter").value;
  const rows = state.suppliers.filter(
    (row) =>
      (!type || row["型態"] === type) &&
      includesAny(row, keyword, ["供應商編號", "供應商名稱", "生產國/地區", "產品類別", "交易模式"])
  );
  $("suppliersBody").innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row["供應商編號"])}</td>
          <td>${escapeHtml(row["供應商名稱"])}</td>
          <td><span class="pill">${escapeHtml(row["型態"])}</span></td>
          <td>${escapeHtml(row["生產國/地區"])}</td>
          <td>${escapeHtml(row["幣別"])}</td>
          <td>${escapeHtml(row["交易模式"])}</td>
          <td>${escapeHtml(row["付款條件"])}</td>
          <td class="num">${money(row["產品筆數"])}</td>
        </tr>
      `
    )
    .join("");
}

function renderOrderAnalysis() {
  if (!can("orderAnalysis")) {
    $("orderAnalysisBody").innerHTML = "";
    return;
  }
  const keyword = $("orderSearch").value;
  const month = $("orderMonthFilter").value;
  const rows = state.cashflow.filter(
    (row) =>
      (!month || row.ym === month) &&
      includesAny(row, keyword, ["po", "counterpart", "supplier", "customer", "product", "mode", "pay_nature"])
  );
  $("orderAnalysisBody").innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.po)}</td>
          <td>${escapeHtml(row.ym)}</td>
          <td><span class="pill ${row.type === "應收" ? "in" : "out"}">${escapeHtml(row.type)}</span></td>
          <td>${escapeHtml(row.customer)}</td>
          <td>${escapeHtml(row.supplier)}</td>
          <td>${escapeHtml(row.product)}</td>
          <td>${escapeHtml(row.mode)}</td>
          <td>${escapeHtml(row.pay_nature)}</td>
          <td>${escapeHtml(row.date_est)}</td>
          <td>${row.confirmed ? "已確認" : "未確認"}</td>
        </tr>
      `
    )
    .join("");
}

function renderCashflow() {
  if (!can("cashflow")) {
    $("cashflowBody").innerHTML = "";
    return;
  }
  const keyword = $("cashflowSearch").value;
  const type = $("cashflowTypeFilter").value;
  const currency = $("cashflowCurrencyFilter").value;
  const rows = state.cashflow.filter(
    (row) =>
      (!type || row.type === type) &&
      (!currency || row.currency === currency) &&
      includesAny(row, keyword, ["po", "counterpart", "supplier", "customer", "product", "mode"])
  );
  $("cashflowBody").innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.po)}</td>
          <td>${escapeHtml(row.ym)}</td>
          <td><span class="pill ${row.type === "應收" ? "in" : "out"}">${escapeHtml(row.type)}</span></td>
          <td>${escapeHtml(row.counterpart)}</td>
          <td>${escapeHtml(row.supplier)}</td>
          <td>${escapeHtml(row.product)}</td>
          <td>${escapeHtml(row.currency)}</td>
          <td class="num">${money(row.foreign_amt)}</td>
          <td class="num">${money(row.twd_amt)}</td>
          <td>${escapeHtml(row.date_est)}</td>
          <td>${row.confirmed ? "已確認" : "未確認"}</td>
        </tr>
      `
    )
    .join("");
}

function trackingRows() {
  const checks = state.docChecks.map((row) => ({
    ref: row.PO,
    source: "文件核對",
    owner: row["供應商"],
    subject: row["產品"],
    status: row["核對"] || row.docs,
    contact: row["客戶"],
    note: row["備註"],
  }));
  const tracks = state.docTracks.map((row) => ({
    ref: row.PO,
    source: "文件追蹤",
    owner: row["窗口"],
    subject: row.docs,
    status: row["更新"],
    contact: row["窗口"],
    note: row["催"],
  }));
  const shipments = state.shipments.map((row) => ({
    ref: row.PO,
    source: "船班",
    owner: row["下一港"],
    subject: row["船名"],
    status: row["航次"],
    contact: row["預計到港"],
    note: row["備註"],
  }));
  const tasks = state.tasks.map((row) => ({
    ref: row.ref,
    source: "TDS待辦",
    owner: row["類別"],
    subject: row["主旨"],
    status: row["狀態"],
    contact: row["起始"],
    note: row["要求"],
  }));
  return [...checks, ...tracks, ...shipments, ...tasks];
}

function renderTracking() {
  const keyword = $("trackingSearch").value;
  const rows = trackingRows().filter((row) => includesAny(row, keyword, ["ref", "owner", "subject", "status", "contact", "note"]));
  $("trackingBody").innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.ref)}</td>
          <td>${escapeHtml(row.source)}</td>
          <td>${escapeHtml(row.owner)}</td>
          <td>${escapeHtml(row.subject)}</td>
          <td>${escapeHtml(row.status)}</td>
          <td>${escapeHtml(row.contact)}</td>
          <td>${escapeHtml(row.note)}</td>
        </tr>
      `
    )
    .join("");
}

function renderDocumentArchive() {
  if (!can("documentArchive")) return;
  const archive = state.documentArchive || {};
  const transferRules = state.transferDocumentRules || {};
  const root = archive.drive_root || {};
  const template = archive.folder_template || {};
  $("archiveRootStatus").textContent = `${root.name || "訂單文件"}｜${root.status || "待設定"}`;
  $("archiveFolderTemplate").innerHTML = `
    <div class="folder-title">${escapeHtml(template.order_folder || "{PO}-{供應商}-{客戶}")}</div>
    <div class="folder-list">
      ${(template.subfolders || []).map((folder) => `<span>${escapeHtml(folder)}</span>`).join("")}
    </div>
    <p class="muted">完成後移入：${escapeHtml(template.completed_folder || "已完成歸檔")}</p>
  `;
  $("archiveStatusFlow").innerHTML = (archive.status_flow || [])
    .map((status, index) => `<div><strong>${index + 1}</strong><span>${escapeHtml(status)}</span></div>`)
    .join("");
  $("archiveDocumentBody").innerHTML = (archive.required_documents || [])
    .map(
      (doc) => `
        <tr>
          <td><strong>${escapeHtml(doc.code)}</strong><br><span class="muted">${escapeHtml(doc.name)}</span></td>
          <td>${escapeHtml(doc.stage)}</td>
          <td>${escapeHtml(doc.required_before)}</td>
          <td>${escapeHtml(doc.check_fields)}</td>
        </tr>
      `
    )
    .join("");
  const sample = transferRules.sample_order || {};
  $("transferRuleSummary").textContent = `${sample.order_no || "待設定"}｜${sample.model || "轉單模式"}`;
  $("transferFlow").innerHTML = (transferRules.transaction_chain || [])
    .map(
      (step) => `
        <div>
          <strong>${escapeHtml(step.from)} → ${escapeHtml(step.to)}</strong>
          <span>${escapeHtml(step.document)}｜${escapeHtml(step.amount_rule)}</span>
        </div>
      `
    )
    .join("");
  $("transferDocumentBody").innerHTML = (transferRules.documents || [])
    .map(
      (doc) => `
        <tr>
          <td><strong>${escapeHtml(doc.code)}</strong><br><span class="muted">${escapeHtml(doc.filename_pattern)}</span></td>
          <td>${escapeHtml(doc.issuer)} → ${escapeHtml(doc.recipient)}</td>
          <td>${escapeHtml(doc.amount_rule)}</td>
          <td>${escapeHtml(doc.source_documents)}</td>
        </tr>
      `
    )
    .join("");
  const archiveRows = state.orderDocumentScan.orders || archive.archive_samples || [];
  $("archiveSampleBody").innerHTML = archiveRows
    .map(
      (row) => `
        <tr>
          <td><strong>${escapeHtml(row.order_no)}</strong><br><span class="muted">${escapeHtml(row.folder_name)}</span></td>
          <td>${escapeHtml(row.supplier)}<br><span class="muted">${escapeHtml(row.customer)}</span></td>
          <td><span class="pill out">${escapeHtml(row.status)}</span></td>
          <td class="num">${money(row.file_count || 0)}</td>
          <td>${escapeHtml(row.missing)}</td>
          <td>${escapeHtml(row.note)}</td>
        </tr>
      `
    )
    .join("");
}

function renderProcurement() {
  if (!can("procurement")) return;
  const approved = state.procurementOrders.filter((order) => order.status === "approved");
  const approval = state.procurementOrders.filter((order) => order.status === "approval");
  $("approvedOrderQueue").innerHTML = approved.map(renderOrderCard).join("") || `<div class="empty-state">目前沒有可下單項目</div>`;
  $("approvalOrderQueue").innerHTML = approval.map(renderOrderCard).join("") || `<div class="empty-state">目前沒有待核准項目</div>`;
  renderPurchaseOrderDraft();
}

function renderOrderCard(order) {
  const product = order.product;
  const statusLabel = order.status === "approved" ? "合規可下單" : "待本人核准";
  const reasonText = order.reasons.length ? order.reasons.join("、") : "通過公司報價規則";
  return `
    <button class="order-card ${order.status === "approval" ? "needs-approval" : ""}" type="button" draggable="${order.status === "approved"}" data-order-id="${escapeHtml(order.id)}">
      <span class="order-status">${statusLabel}</span>
      <strong>${escapeHtml(order.id)}</strong>
      <span>${escapeHtml(order.customer)}｜${escapeHtml(order.channel)}</span>
      <span>${escapeHtml(product["中文品名"])}</span>
      <span>模式 ${escapeHtml(order.tradeMode.category)}｜${escapeHtml(order.modeConfig.subtitle)}</span>
      <span class="order-price">${escapeHtml(order.currency)} ${money(order.requestedPrice)} / 底線 ${money(order.floor)}</span>
      <small>${escapeHtml(reasonText)}</small>
    </button>
  `;
}

function selectedProcurementOrder() {
  return state.procurementOrders.find((order) => order.id === state.selectedProcurementOrderId) || state.procurementOrders[0];
}

function renderPurchaseOrderDraft() {
  const order = selectedProcurementOrder();
  if (!order) {
    $("purchaseOrderDraft").innerHTML = `<div class="empty-state">尚無可建立草稿的訂單</div>`;
    return;
  }
  const product = order.product;
  const cartons = numberValue(order.cartons);
  const unitsPerCarton = numberValue(product["箱入數"]) || 1;
  const totalUnits = cartons * unitsPerCarton;
  const lineTotal = cartons * numberValue(order.requestedPrice);
  const nexo = nexoReserve(order, lineTotal);
  const today = new Date().toISOString().slice(0, 10);
  const canIssue = order.status === "approved";
  $("purchaseOrderDraft").innerHTML = `
    <div class="po-ribbon ${canIssue ? "ready" : "blocked"}">${canIssue ? "Ready for International Purchasing" : "Owner Approval Required"}</div>
    <header class="po-header">
      <div>
        <p class="po-kicker">${escapeHtml(order.modeConfig.poType)}</p>
        <h3>${escapeHtml(order.modeConfig.title)}</h3>
      </div>
      <div class="po-number">
        <span>PO No.</span>
        <strong>${escapeHtml(order.poNo)}</strong>
      </div>
    </header>

    <div class="po-parties">
      <section>
        <h4>Buyer</h4>
        <p>Golden Jade / 高玉</p>
        <p>Taiwan Import & Distribution</p>
        <p>Order Request: ${escapeHtml(order.id)}</p>
      </section>
      <section>
        <h4>Supplier</h4>
        <p>${escapeHtml(product["供應商"])}</p>
        <p>${escapeHtml(product["生產國"])}｜${escapeHtml(product["供應商編號"])}</p>
        <p>Payment: ${escapeHtml(order.payment)}</p>
      </section>
      <section>
        <h4>Terms</h4>
        <p>Date: ${escapeHtml(today)}</p>
        <p>Incoterms: ${escapeHtml(order.incoterms)}</p>
        <p>Currency: ${escapeHtml(order.currency)}</p>
        <p>Trade Mode: ${escapeHtml(order.tradeMode.category)}｜${escapeHtml(order.tradeMode.mode)}</p>
      </section>
    </div>

    <div class="mode-summary">
      <div>
        <span>判斷來源</span>
        <strong>${escapeHtml(order.tradeMode.source)}</strong>
      </div>
      <div>
        <span>付款節點</span>
        <strong>${escapeHtml(order.modeConfig.paymentRule)}</strong>
      </div>
      <div>
        <span>現金流處理</span>
        <strong>${escapeHtml(order.modeConfig.cashflowRule)}</strong>
      </div>
    </div>

    <table class="po-lines">
      <thead>
        <tr>
          <th>Item</th>
          <th>EAN</th>
          <th>Spec</th>
          <th class="num">Cartons</th>
          <th class="num">Units</th>
          <th class="num">Unit/Carton</th>
          <th class="num">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${escapeHtml(product["英文品名"] || product["中文品名"])}</strong>
            <span>${escapeHtml(product["中文品名"])}</span>
          </td>
          <td>${escapeHtml(product["EAN"])}</td>
          <td>${escapeHtml(product["規格"])}</td>
          <td class="num">${money(cartons)}</td>
          <td class="num">${money(totalUnits)}</td>
          <td class="num">${escapeHtml(order.currency)} ${money(order.requestedPrice)}</td>
          <td class="num">${escapeHtml(order.currency)} ${money(lineTotal)}</td>
        </tr>
      </tbody>
    </table>

    <div class="po-bottom">
      <section>
        <h4>文件與出貨要求</h4>
        <ul>
          <li>${escapeHtml(order.modeConfig.supplierInstruction)}</li>
          <li>${escapeHtml(order.modeConfig.documentNote)}</li>
          <li>PI 價格、品名、規格、箱數需與本草稿一致。</li>
        </ul>
      </section>
      <section>
        <h4>審核狀態</h4>
        <p>${escapeHtml(order.note)}</p>
        <p>系統檢查：${escapeHtml(order.reasons.length ? order.reasons.join("、") : "符合底線與通路規則")}</p>
        <p>交易特例：${escapeHtml(order.tradeMode.note || "無")}</p>
        ${nexo ? `<p>NEXO 留利：${escapeHtml(nexo.text)}</p>` : ""}
      </section>
      <section class="po-total">
        <span>Total</span>
        <strong>${escapeHtml(order.currency)} ${money(lineTotal)}</strong>
        ${nexo ? `<em>NEXO USD ${money(nexo.reserve)}</em>` : ""}
      </section>
    </div>

    <div class="approval-grid">
      <div>業務送單</div>
      <div>本人核准</div>
      <div>國際採購</div>
      <div>文件核對</div>
    </div>
  `;
}

function renderAll() {
  renderDashboard();
  renderSalesQuote();
  renderProducts();
  renderSuppliers();
  renderOrderAnalysis();
  renderCashflow();
  renderProcurement();
  renderTracking();
  renderDocumentArchive();
  applyPermissions();
}

function setView(view) {
  if (
    (view === "cashflow" && !can("cashflow")) ||
    (view === "salesQuote" && !can("quote")) ||
    (view === "orderAnalysis" && !can("orderAnalysis")) ||
    (view === "suppliers" && !can("suppliers")) ||
    (view === "procurement" && !can("procurement")) ||
    (view === "tracking" && !can("tracking")) ||
    (view === "documentArchive" && !can("documentArchive"))
  ) {
    view = "dashboard";
  }
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  document.querySelectorAll(".view").forEach((section) => section.classList.remove("active"));
  $(`${view}View`).classList.add("active");
  const [title, subtitle] = viewMeta[view];
  $("viewTitle").textContent = title;
  $("viewSubtitle").textContent = subtitle;
}

function showProjectPreview(src, title) {
  const frame = $("projectPreviewFrame");
  if (!frame) return;
  frame.src = src;
  $("projectPreviewTitle").textContent = title || "HTML 展示";
  document.querySelectorAll("[data-preview-html]").forEach((button) => {
    button.classList.toggle("active-preview", button.dataset.previewHtml === src);
  });
}

function bindEvents() {
  document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
  document.querySelectorAll("[data-preview-html]").forEach((button) => {
    button.addEventListener("click", () => showProjectPreview(button.dataset.previewHtml, button.dataset.previewTitle));
  });
  $("loginForm").addEventListener("submit", handleLogin);
  $("logoutBtn").addEventListener("click", logout);
  ["productSearch", "productTypeFilter", "productStatusFilter"].forEach((id) => $(id).addEventListener("input", renderProducts));
  ["quoteProductSearch", "quoteTypeFilter", "quoteSupplierFilter"].forEach((id) => $(id).addEventListener("input", renderSalesQuote));
  $("quoteBasisFilter").addEventListener("input", () => {
    $("quoteBasis").value = $("quoteBasisFilter").value;
    renderSalesQuote();
  });
  $("quoteBasis").addEventListener("input", renderQuoteCart);
  ["quoteCustomer", "quoteCustomerName", "quoteValidDays"].forEach((id) => $(id).addEventListener("input", renderQuoteCart));
  ["supplierSearch", "supplierTypeFilter"].forEach((id) => $(id).addEventListener("input", renderSuppliers));
  ["orderSearch", "orderMonthFilter"].forEach((id) => $(id).addEventListener("input", renderOrderAnalysis));
  ["cashflowSearch", "cashflowTypeFilter", "cashflowCurrencyFilter"].forEach((id) => $(id).addEventListener("input", renderCashflow));
  $("trackingSearch").addEventListener("input", renderTracking);
  bindSalesQuoteEvents();
  bindProcurementEvents();
}

function bindSalesQuoteEvents() {
  $("salesQuoteView").addEventListener("click", (event) => {
    const addButton = event.target.closest("[data-add-quote]");
    if (addButton) {
      addQuoteItem(addButton.dataset.addQuote);
      return;
    }
    const removeButton = event.target.closest("[data-remove-quote]");
    if (removeButton) {
      state.quoteCart.splice(Number(removeButton.dataset.removeQuote), 1);
      renderQuoteCart();
      return;
    }
    const modeButton = event.target.closest("[data-quote-mode]");
    if (modeButton) {
      state.quoteMode = modeButton.dataset.quoteMode;
      renderQuoteCart();
    }
  });
  $("salesQuoteView").addEventListener("change", (event) => {
    const input = event.target.closest("[data-cart-index]");
    if (!input) return;
    const item = state.quoteCart[Number(input.dataset.cartIndex)];
    if (!item) return;
    item[input.dataset.cartField] = Math.max(0, Number(input.value) || 0);
    renderQuoteCart();
  });
  $("clearQuoteBtn").addEventListener("click", () => {
    state.quoteCart = [];
    $("quoteOutput").textContent = "";
    renderQuoteCart();
  });
  $("printQuoteBtn").addEventListener("click", () => {
    $("quoteOutput").textContent = quoteDocumentText();
    state.quoteMode = "quote";
    renderQuoteCart();
  });
  $("submitOrderBtn").addEventListener("click", createOrderFromQuote);
}

function bindProcurementEvents() {
  $("procurementView").addEventListener("click", (event) => {
    const card = event.target.closest("[data-order-id]");
    if (!card) return;
    state.selectedProcurementOrderId = card.dataset.orderId;
    renderPurchaseOrderDraft();
  });
  $("procurementView").addEventListener("dragstart", (event) => {
    const card = event.target.closest("[data-order-id]");
    if (!card || card.getAttribute("draggable") !== "true") return;
    event.dataTransfer.setData("text/plain", card.dataset.orderId);
  });
  $("poDropZone").addEventListener("dragover", (event) => {
    event.preventDefault();
    $("poDropZone").classList.add("drag-over");
  });
  $("poDropZone").addEventListener("dragleave", () => $("poDropZone").classList.remove("drag-over"));
  $("poDropZone").addEventListener("drop", (event) => {
    event.preventDefault();
    $("poDropZone").classList.remove("drag-over");
    const orderId = event.dataTransfer.getData("text/plain");
    const order = state.procurementOrders.find((item) => item.id === orderId);
    if (!order || order.status !== "approved") return;
    state.selectedProcurementOrderId = orderId;
    renderPurchaseOrderDraft();
  });
}

function populateFilters() {
  $("productTypeFilter").innerHTML = uniqueOptions(visibleProducts(), "型態", "全部型態");
  $("productStatusFilter").innerHTML = uniqueOptions(visibleProducts(), "狀態", "全部狀態");
  $("quoteTypeFilter").innerHTML = uniqueOptions(visibleProducts(), "型態", "全部型態");
  $("quoteSupplierFilter").innerHTML = uniqueOptions(visibleProducts(), "供應商", "全部供應商");
  $("supplierTypeFilter").innerHTML = uniqueOptions(state.suppliers, "型態", "全部型態");
  $("orderMonthFilter").innerHTML = uniqueOptions(state.cashflow, "ym", "全部月份");
  $("cashflowTypeFilter").innerHTML = uniqueOptions(state.cashflow, "type", "全部類型");
  $("cashflowCurrencyFilter").innerHTML = uniqueOptions(state.cashflow, "currency", "全部幣別");
}

function applyPermissions() {
  document.querySelectorAll("[data-permission]").forEach((element) => {
    const permission = element.dataset.permission;
    element.classList.toggle("hidden", !can(permission));
  });
  document.querySelectorAll('[data-column="cost"]').forEach((element) => element.classList.toggle("hidden", !can("costs")));
  document.querySelectorAll('[data-column="quote"]').forEach((element) => element.classList.toggle("hidden", !can("quote")));
  document.querySelectorAll('[data-column="quoteFloor"]').forEach((element) => element.classList.toggle("hidden", !can("quoteFloor")));
  $("userChip").textContent = `${state.currentUser.name}｜${state.currentUser.roleLabel}`;
}

function handleLogin(event) {
  event.preventDefault();
  const username = $("username").value.trim();
  const password = $("password").value;
  const user = users[username];
  if (!user || user.password !== password) {
    $("loginError").textContent = "使用者名稱或密碼不正確";
    return;
  }
  state.currentUser = { username, ...user };
  sessionStorage.setItem("gj_erp_user", username);
  $("loginError").textContent = "";
  $("loginScreen").classList.add("hidden");
  $("appShell").classList.remove("hidden");
  populateFilters();
  renderAll();
  setView("dashboard");
}

function logout() {
  sessionStorage.removeItem("gj_erp_user");
  state.currentUser = null;
  $("appShell").classList.add("hidden");
  $("loginScreen").classList.remove("hidden");
  $("password").value = "";
  $("username").focus();
}

function restoreLogin() {
  const username = sessionStorage.getItem("gj_erp_user");
  if (!username || !users[username]) return;
  state.currentUser = { username, ...users[username] };
  $("loginScreen").classList.add("hidden");
  $("appShell").classList.remove("hidden");
}

async function init() {
  try {
    bindEvents();
    await loadData();
    restoreLogin();
    if (state.currentUser) {
      populateFilters();
      renderAll();
    }
    showProjectPreview("projects/newerp/html/sop_rolling_12_month_forecast.html", "月度出貨預測與實銷追蹤");
    $("loadStatus").textContent = "資料已載入";
    $("loadStatus").className = "status ok";
    $("viewSubtitle").textContent = "主檔資料量、交易模式與待辦狀態";
  } catch (error) {
    $("loadStatus").textContent = "讀取失敗";
    $("loadStatus").className = "status error";
    $("viewSubtitle").textContent = error.message;
    console.error(error);
  }
}

init();
