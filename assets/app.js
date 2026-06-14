const state = {
  products: [],
  productTech: {},
  suppliers: [],
  cashflow: [],
  tasks: [],
  docChecks: [],
  docTracks: [],
  shipments: [],
  currentUser: null,
  salesQuoteMap: new Map(),
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
};

const viewMeta = {
  dashboard: ["總覽", "主檔資料量、交易模式與待辦狀態"],
  products: ["商品", "商品主檔、成本、狀態與報價基礎"],
  suppliers: ["供應商", "供應商條件、聯絡與付款基礎資料"],
  orderAnalysis: ["訂單分析", "PO、客戶、供應商、商品與預估日期"],
  procurement: ["國際採購", "業務下單合規審核、本人核准與國外採購訂單草稿"],
  cashflow: ["現金流", "應收、應付、PO 與預估日期"],
  tracking: ["PO追蹤", "文件核對、文件追蹤、船班與 TDS 待辦"],
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
  state.salesQuoteMap = new Map(
    loaded.sales
      .filter((row) => Array.isArray(row))
      .map((row) => [productKeyFromValues(row[0], row[2], row[4]), row[15]])
  );
  state.procurementOrders = buildProcurementOrders();
  state.selectedProcurementOrderId = state.procurementOrders.find((order) => order.status === "approved")?.id || null;
}

function buildProcurementOrders() {
  const frozenTwd = state.products.find((row) => row["報價交易條件"] === "到倉價" && numberValue(row["台幣最低報價"]) > 0);
  const foreign = state.products.find((row) => row["報價交易條件"] !== "到倉價" && numberValue(row["外幣10%底線"]) > 0);
  const costco = state.products.find((row) => isCostcoProject(row)) || frozenTwd;
  return [
    createProcurementOrder({
      id: "SO-2026-0614-001",
      customer: "高玉冷凍通路",
      channel: "冷凍品",
      quoteBasis: "TWD_LANDED",
      requestedPrice: numberValue(frozenTwd?.["台幣最低報價"]) + 2,
      cartons: 120,
      product: frozenTwd,
      note: "價格符合台幣到倉底線，可直接進入國際採購。",
    }),
    createProcurementOrder({
      id: "SO-2026-0614-002",
      customer: "好市多專案",
      channel: "好市多",
      quoteBasis: "TWD_LANDED",
      requestedPrice: Math.max(1, numberValue(costco?.["台幣10%底線"]) - 1),
      cartons: 80,
      product: costco,
      note: "好市多專案低於底線，必須先由本人核准。",
    }),
    createProcurementOrder({
      id: "SO-2026-0614-003",
      customer: "一般貿易客戶",
      channel: "全通路",
      quoteBasis: "FOREIGN",
      requestedPrice: numberValue(foreign?.["外幣10%底線"]) + 0.3,
      cartons: 60,
      product: foreign,
      note: "外幣價格高於底線，可建立國外供應商訂單草稿。",
    }),
  ].filter(Boolean);
}

function createProcurementOrder(config) {
  const row = config.product;
  if (!row) return null;
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
  return {
    ...config,
    product: row,
    currency: isTwd ? "TWD" : currencyCode(row["幣別"]),
    floor,
    status,
    reasons,
    poNo: `GJ-PO-${config.id.split("-").slice(-1)[0]}`,
    incoterms: row["報價交易條件"] || row["成本交易條件"] || "TBD",
    payment: row["付款條件"] || "TBD",
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
  const today = new Date().toISOString().slice(0, 10);
  const canIssue = order.status === "approved";
  $("purchaseOrderDraft").innerHTML = `
    <div class="po-ribbon ${canIssue ? "ready" : "blocked"}">${canIssue ? "Ready for International Purchasing" : "Owner Approval Required"}</div>
    <header class="po-header">
      <div>
        <p class="po-kicker">Purchase Order Draft</p>
        <h3>國外供應商訂單草稿</h3>
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
      </section>
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
          <li>PI 價格、品名、規格、箱數需與本草稿一致。</li>
          <li>出貨前提供 CI、PL、COO、HC / COA；出貨後補 B/L。</li>
          <li>冷凍品需確認溫層、BBD、箱/板與到港文件版本。</li>
        </ul>
      </section>
      <section>
        <h4>審核狀態</h4>
        <p>${escapeHtml(order.note)}</p>
        <p>系統檢查：${escapeHtml(order.reasons.length ? order.reasons.join("、") : "符合底線與通路規則")}</p>
      </section>
      <section class="po-total">
        <span>Total</span>
        <strong>${escapeHtml(order.currency)} ${money(lineTotal)}</strong>
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
  renderProducts();
  renderSuppliers();
  renderOrderAnalysis();
  renderCashflow();
  renderProcurement();
  renderTracking();
  applyPermissions();
}

function setView(view) {
  if (
    (view === "cashflow" && !can("cashflow")) ||
    (view === "orderAnalysis" && !can("orderAnalysis")) ||
    (view === "suppliers" && !can("suppliers")) ||
    (view === "procurement" && !can("procurement")) ||
    (view === "tracking" && !can("tracking"))
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

function bindEvents() {
  document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
  $("loginForm").addEventListener("submit", handleLogin);
  $("logoutBtn").addEventListener("click", logout);
  ["productSearch", "productTypeFilter", "productStatusFilter"].forEach((id) => $(id).addEventListener("input", renderProducts));
  ["supplierSearch", "supplierTypeFilter"].forEach((id) => $(id).addEventListener("input", renderSuppliers));
  ["orderSearch", "orderMonthFilter"].forEach((id) => $(id).addEventListener("input", renderOrderAnalysis));
  ["cashflowSearch", "cashflowTypeFilter", "cashflowCurrencyFilter"].forEach((id) => $(id).addEventListener("input", renderCashflow));
  $("trackingSearch").addEventListener("input", renderTracking);
  bindProcurementEvents();
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
