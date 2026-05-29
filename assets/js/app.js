let products = [];
let categoryImages = {};
const cart = new Map();

const SESSION_KEY = "pipeline_session_id";
const ANONYMOUS_KEY = "pipeline_anonymous_id";
const AUTH_STATE_KEY = "markethub_auth_state";
const ALL_CATEGORY = "Tat ca";
const FALLBACK_IMAGE = "/template-assets/imgs/page/homepage1/computer.png";

let searchTerm = "";
let activeCategory = ALL_CATEGORY;
let priceMode = "all";
let tagMode = "all";
let ratingMode = "all";
let sortMode = "featured";
let checkoutStartedAt = null;
let purchaseCompleted = false;
let cartFeedbackTimer = null;

const categoryGrid = document.getElementById("categoryGrid");
const categorySelect = document.getElementById("categorySelect");
const dealRow = document.getElementById("dealRow");
const flashCountdown = document.getElementById("flashCountdown");
const productGrid = document.getElementById("productGrid");
const resultSummary = document.getElementById("resultSummary");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const priceFilter = document.getElementById("priceFilter");
const tagFilter = document.getElementById("tagFilter");
const ratingFilter = document.getElementById("ratingFilter");
const tabRow = document.getElementById("tabRow");
const cartCount = document.getElementById("cartCount");
const floatingCartCount = document.getElementById("floatingCartCount");
const floatingCartButton = document.getElementById("floatingCartButton");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartPanel = document.getElementById("cartPanel");
const detailPanel = document.getElementById("detailPanel");
const detailContent = document.getElementById("detailContent");
const checkoutPanel = document.getElementById("checkoutPanel");
const successBox = document.getElementById("successBox");
const accountButton = document.querySelector('[data-track-name="account_menu"]');
const openPurchasedButton = document.getElementById("openPurchasedButton");
const authPanel = document.getElementById("authPanel");
const authLoginButton = document.getElementById("authLoginButton");
const authRegisterButton = document.getElementById("authRegisterButton");
const authLogoutButton = document.getElementById("authLogoutButton");
const authUserSummary = document.getElementById("authUserSummary");
const purchasedPanel = document.getElementById("purchasedPanel");
const purchasedList = document.getElementById("purchasedList");
const purchasedSummary = document.getElementById("purchasedSummary");
const refreshPurchasedButton = document.getElementById("refreshPurchasedButton");

const noopTracking = {
  trackSearch: () => Promise.resolve(),
  trackFilterApply: () => Promise.resolve(),
  trackProductView: () => Promise.resolve(),
  trackProductClick: () => Promise.resolve(),
  trackPageView: () => Promise.resolve(),
  trackCustom: () => Promise.resolve(),
  setUserId: () => {},
  clearUserId: () => {}
};

function tracker() {
  return window.tracking || noopTracking;
}

function getAuthState() {
  try {
    const raw = localStorage.getItem(AUTH_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setAuthState(state) {
  try {
    if (state) {
      localStorage.setItem(AUTH_STATE_KEY, JSON.stringify({ user: state.user }));
    }
  } catch {
    // ignore
  }
}

function clearAuthState() {
  try {
    localStorage.removeItem(AUTH_STATE_KEY);
  } catch {
    // ignore
  }
}

let authState = getAuthState();

document.addEventListener("error", (event) => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || image.dataset.fallbackApplied === "true") return;
  image.dataset.fallbackApplied = "true";
  image.src = FALLBACK_IMAGE;
}, true);

function repairBrokenImages(root = document) {
  root.querySelectorAll("img").forEach((image) => {
    if (image.dataset.fallbackApplied === "true") return;
    if (image.complete && image.naturalWidth === 0) {
      image.dataset.fallbackApplied = "true";
      image.src = FALLBACK_IMAGE;
    }
  });
}

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function getSessionId() {
  return storageGet(SESSION_KEY) || "anonymous-browser-session";
}

function getAnonymousId() {
  return storageGet(ANONYMOUS_KEY) || null;
}

function setTrackingUser(userId) {
  if (userId) {
    tracker().setUserId?.(userId);
    return;
  }

  if (tracker().clearUserId) {
    tracker().clearUserId();
    return;
  }

  tracker().setUserId?.(null);
}

async function apiFetch(url, options = {}) {
  const withAuthHeaders = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: withAuthHeaders
  });

  if (response.status === 401 && authState?.user?.id) {
    clearAuthState();
    authState = null;
    updateAuthUi();
    setTrackingUser(null);
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

function updateAuthUi() {
  if (!accountButton) return;
  if (authState?.user?.name) {
    accountButton.innerHTML = `<span>${authState.user.name}</span>`;
    authUserSummary.textContent = `Bạn đang đăng nhập bằng ${authState.user.email}.`;
    authLoginButton?.classList.add("is-hidden");
    authRegisterButton?.classList.add("is-hidden");
    authLogoutButton?.classList.remove("is-hidden");
  } else {
    accountButton.innerHTML = "<span>Tài khoản</span>";
    authUserSummary.textContent = "Đăng nhập hoặc tạo tài khoản để đồng bộ hành vi mua sắm.";
    authLoginButton?.classList.remove("is-hidden");
    authRegisterButton?.classList.remove("is-hidden");
    authLogoutButton?.classList.add("is-hidden");
  }
}

async function loginFlow() {
  const email = window.prompt("Nhập email đăng nhập:");
  if (!email) return;
  const password = window.prompt("Nhập mật khẩu:");
  if (!password) return;

  const res = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    alert("Đăng nhập thất bại.");
    return;
  }

  const payload = await res.json();
  authState = { user: payload.data.user };
  setAuthState(authState);
  updateAuthUi();
  setTrackingUser(authState.user.id);
}

async function registerFlow() {
  const email = window.prompt("Nhập email đăng ký:");
  if (!email) return;
  const password = window.prompt("Tạo mật khẩu:");
  if (!password) return;
  const name = window.prompt("Nhập tên hiển thị:", email.split("@")[0] || "User");
  if (!name) return;

  const registerRes = await fetch("/api/auth/register", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name })
  });

  if (registerRes.status === 409) {
    alert("Email đã tồn tại. Vui lòng đăng nhập.");
    return;
  }

  if (!registerRes.ok) {
    alert("Không thể tạo tài khoản. Vui lòng thử lại.");
    return;
  }

  const loginRes = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!loginRes.ok) {
    alert("Tạo tài khoản thành công, nhưng đăng nhập tự động thất bại.");
    return;
  }

  const payload = await loginRes.json();
  authState = { user: payload.data.user };
  setAuthState(authState);
  updateAuthUi();
  setTrackingUser(authState.user.id);
}

async function logoutFlow() {
  if (!authState) return;
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" }
  });
  clearAuthState();
  authState = null;
  updateAuthUi();
  setTrackingUser(null);
}

async function restoreAuthSession() {
  if (authState?.user?.id) {
    setTrackingUser(authState.user.id);
    updateAuthUi();
  }

  try {
    const res = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" }
    });

    if (res.status === 401) {
      clearAuthState();
      authState = null;
      updateAuthUi();
      setTrackingUser(null);
      return;
    }

    if (!res.ok) return;
    const payload = await res.json();
    authState = { user: payload.data.user };
    setAuthState(authState);
    updateAuthUi();
    setTrackingUser(authState.user.id);
  } catch {
    // Anonymous browsing does not require an auth session.
  }
}

function money(value) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

async function loadStoreData() {
  const [productResponse, categoryResponse] = await Promise.all([
    apiFetch("/api/products"),
    apiFetch("/api/categories"),
    apiFetch("/api/suppliers")
  ]);

  products = productResponse.data;
  categoryImages = categoryResponse.data.reduce((images, category) => {
    images[category.name] = category.image;
    return images;
  }, {});
  categoryImages[ALL_CATEGORY] = categoryImages[Object.keys(categoryImages)[0]] || "";
}

function categories() {
  return [ALL_CATEGORY].concat(Array.from(new Set(products.map((product) => product.category))));
}

function productPayload(product) {
  return {
    productId: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    rating: product.rating,
    sold: product.sold,
    tag: product.tag,
    supplier: product.supplier.name
  };
}

function matchesPrice(product) {
  if (priceMode === "under_500") return product.price < 500000;
  if (priceMode === "500_1200") return product.price >= 500000 && product.price <= 1200000;
  if (priceMode === "over_1200") return product.price > 1200000;
  return true;
}

function filteredProducts() {
  const term = searchTerm.trim().toLowerCase();

  return products
    .filter((product) => {
      const bySearch = !term
        || product.name.toLowerCase().includes(term)
        || product.category.toLowerCase().includes(term)
        || product.description.toLowerCase().includes(term)
        || product.tag.includes(term);
      const byCategory = activeCategory === ALL_CATEGORY || product.category === activeCategory;
      const byTag = tagMode === "all" || product.tag === tagMode;
      const byRating = ratingMode === "all" || product.rating >= Number(ratingMode);
      return bySearch && byCategory && byTag && byRating && matchesPrice(product);
    })
    .sort((a, b) => {
      if (sortMode === "price_asc") return a.price - b.price;
      if (sortMode === "price_desc") return b.price - a.price;
      if (sortMode === "sold_desc") return b.sold - a.sold;
      if (sortMode === "rating_desc") return b.rating - a.rating;
      return products.indexOf(a) - products.indexOf(b);
    });
}

function renderCategories() {
  const cats = categories();
  categoryGrid.innerHTML = cats.map((category) => {
    const image = categoryImages[category] || categoryImages[ALL_CATEGORY];
    const label = category === ALL_CATEGORY ? "Tất cả" : category;
    return `
      <button class="category-card" type="button" data-category="${category}" data-track-name="category_${category}">
        <span class="category-icon"><img src="${image}" alt="${label}"></span>
        <strong>${label}</strong>
      </button>
    `;
  }).join("");

  categorySelect.innerHTML = cats
    .map((category) => `<option value="${category}">${category === ALL_CATEGORY ? "Tất cả" : category}</option>`)
    .join("");
  window.setTimeout(() => repairBrokenImages(categoryGrid), 250);
}

function startFlashCountdown() {
  let remainingSeconds = 2 * 60 * 60 + 18 * 60 + 45;

  function formatTime(value) {
    return String(value).padStart(2, "0");
  }

  function renderCountdown() {
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;
    flashCountdown.textContent = `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;
    remainingSeconds = remainingSeconds > 0 ? remainingSeconds - 1 : 2 * 60 * 60 + 18 * 60 + 45;
  }

  renderCountdown();
  window.setInterval(renderCountdown, 1000);
}

function productCard(product, compact) {
  return `
    <article class="product-card" data-track-view="product_${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-body">
        <span class="badge">${product.tag}</span>
        <h3 class="product-name">${product.name}</h3>
        <strong class="price">${money(product.price)}</strong>
        <span class="supplier-line">${product.supplier.name}</span>
        <div class="rating-line">
          <span>${product.rating} sao</span>
          <span>Đã bán ${product.sold}</span>
        </div>
        ${compact ? "" : `
          <div class="card-actions">
            <button class="tiny-button" type="button" data-detail-id="${product.id}" data-track-name="view_detail_${product.id}">Xem</button>
            <button class="tiny-button" type="button" data-add-id="${product.id}" data-track-name="add_${product.id}">Thêm</button>
            <button class="tiny-button buy-now-button" type="button" data-buy-now-id="${product.id}" data-track-name="buy_now_${product.id}">Mua ngay</button>
          </div>
        `}
      </div>
    </article>
  `;
}

function renderDeals() {
  dealRow.innerHTML = products
    .filter((product) => product.tag === "deal" || product.tag === "best")
    .slice(0, 6)
    .map((product) => `
      <button class="deal-card" type="button" data-detail-id="${product.id}" data-track-name="flash_${product.id}">
        <img src="${product.image}" alt="${product.name}">
        <span class="deal-body">
          <strong>${money(product.price)}</strong>
          <span class="muted">Đã bán ${product.sold}</span>
        </span>
      </button>
    `).join("");
  window.setTimeout(() => repairBrokenImages(dealRow), 250);
}

function renderProducts() {
  const visible = filteredProducts();
  resultSummary.textContent = `${visible.length} sản phẩm phù hợp`;
  productGrid.innerHTML = visible.map((product) => productCard(product, false)).join("");
  window.setTimeout(() => repairBrokenImages(productGrid), 250);
}

function trackCatalogChanged(eventName) {
  renderProducts();

  const payload = {
    category: activeCategory,
    priceMode,
    tagMode,
    ratingMode,
    sortMode,
    visibleProducts: filteredProducts().length
  };

  if (eventName === "search_submit" || eventName === "quick_keyword") {
    tracker().trackSearch(searchTerm || "").catch(() => {});
  } else {
    tracker().trackFilterApply(payload).catch(() => {});
  }
}

function openPanel(panel) {
  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false");
}

function closePanel(panel) {
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
}

function showProductDetail(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;

  const relatedProducts = products
    .filter((item) => item.id !== product.id && (item.category === product.category || item.tag === product.tag))
    .slice(0, 4);

  detailContent.innerHTML = `
    <div class="detail-layout">
      <div class="detail-media">
        <img src="${product.image}" alt="${product.name}">
        <div class="thumb-row" aria-label="ảnh sản phẩm phụ">
          <span>ảnh 1</span>
          <span>ảnh 2</span>
          <span>ảnh 3</span>
          <span>Video</span>
        </div>
        <div class="detail-section supplier-card">
          <span class="supplier-avatar">${product.supplier.name.charAt(0)}</span>
          <div>
            <strong>${product.supplier.name}</strong>
            <p class="muted">${product.supplier.location} | ${product.supplier.products} sản phẩm</p>
          </div>
          <button class="secondary-button" type="button" data-supplier-name="${product.supplier.name}" data-track-name="visit_supplier">Xem shop</button>
        </div>
      </div>
      <div class="detail-info">
        <span class="badge">${product.tag}</span>
        <h2 class="detail-title">${product.name}</h2>
        <p class="muted">${product.description}</p>
        <div class="detail-price-box">
          <span class="price">${money(product.price)}</span>
          <span class="badge">Voucher -15%</span>
          <span class="muted">Đã bán ${product.sold}</span>
        </div>
        <dl class="detail-specs">
          <div><dt>Đánh giá</dt><dd>${product.rating}/5 sao</dd></div>
          <div><dt>Danh mục</dt><dd>${product.category}</dd></div>
          <div><dt>Kho hàng</dt><dd>${product.stock} sản phẩm</dd></div>
          <div><dt>Xuất xứ</dt><dd>${product.origin}</dd></div>
        </dl>
        <div class="detail-section">
          <strong>Vận chuyển & bảo hành</strong>
          <p class="muted">${product.shipping}. Đổi trả 7 ngày cho sản phẩm đủ điều kiện. Nhà cung cấp phản hồi ${product.supplier.response} tin nhắn.</p>
        </div>
        <div class="card-actions">
          <button class="secondary-button" type="button" data-wishlist-id="${product.id}" data-track-name="wishlist_${product.id}">Yêu thích</button>
          <button class="primary-button" type="button" data-add-id="${product.id}" data-track-name="detail_add_${product.id}">Thêm giỏ</button>
          <button class="primary-button buy-now-button" type="button" data-buy-now-id="${product.id}" data-track-name="detail_buy_now_${product.id}">Mua ngay</button>
        </div>
      </div>
    </div>
    <div class="detail-section" style="margin-top:18px;">
      <strong>Mô tả sản phẩm</strong>
      <p class="muted">${product.description} Sản phẩm thuộc gian hàng ${product.supplier.name}, có thông tin vận chuyển, đổi trả và nhà cung cấp rõ ràng.</p>
    </div>
    <div class="detail-section" style="margin-top:12px;">
      <strong>Sản phẩm liên quan</strong>
      <div class="related-grid">
        ${relatedProducts.map((item) => `
          <button class="related-card" type="button" data-detail-id="${item.id}" data-track-name="related_${item.id}">
            <img src="${item.image}" alt="${item.name}">
            <strong>${item.name}</strong>
            <span class="price">${money(item.price)}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;

  openPanel(detailPanel);
  tracker().trackProductView(product.id, window.location.pathname, {
    name: product.name,
    price: product.price,
    category: product.category
  }).catch(() => {});
}

function syncCart(apiCart) {
  cart.clear();
  apiCart.items.forEach((item) => {
    const product = products.find((candidate) => candidate.id === item.productId) || {
      id: item.productId,
      name: item.nameSnapshot,
      price: item.priceSnapshot,
      image: item.imageSnapshot,
      category: "",
      tag: "",
      rating: 0,
      sold: 0,
      supplier: { name: "" }
    };
    cart.set(item.productId, { product, quantity: item.quantity });
  });
}

async function loadCart() {
  const response = await apiFetch(`/api/cart?sessionId=${encodeURIComponent(getSessionId())}`);
  syncCart(response.data);
  renderCart();
}

async function addToCart(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;

  const response = await apiFetch("/api/cart/items", {
    method: "POST",
    body: JSON.stringify({ sessionId: getSessionId(), productId, quantity: 1 })
  });
  syncCart(response.data);
  renderCart();
  showCartFeedback("Đã thêm vào giỏ");

  const current = cart.get(productId);
  tracker().trackCustom("add_to_cart", {
    product_id: product.id,
    metadata: Object.assign(productPayload(product), {
      quantity: current ? current.quantity : 1,
      cartValue: cartValue()
    })
  }).catch(() => {});
}

async function buyNow(productId) {
  await addToCart(productId);
  closePanel(detailPanel);
  closePanel(cartPanel);
  startCheckout();
}

function cartValue() {
  return Array.from(cart.values()).reduce((total, item) => total + item.product.price * item.quantity, 0);
}

function cartSize() {
  return Array.from(cart.values()).reduce((total, item) => total + item.quantity, 0);
}

function showCartFeedback(message) {
  if (!floatingCartButton) return;
  floatingCartButton.setAttribute("data-feedback", message);
  floatingCartButton.classList.add("has-feedback");
  window.clearTimeout(cartFeedbackTimer);
  cartFeedbackTimer = window.setTimeout(() => {
    floatingCartButton.classList.remove("has-feedback");
    floatingCartButton.removeAttribute("data-feedback");
  }, 1800);
}

function showCheckoutStatus(message, type = "success") {
  successBox.textContent = message;
  successBox.classList.toggle("is-error", type === "error");
  successBox.classList.add("show");
}

function renderCart() {
  const currentCartSize = String(cartSize());
  cartCount.textContent = currentCartSize;
  floatingCartCount.textContent = currentCartSize;
  cartTotal.textContent = money(cartValue());

  if (cart.size === 0) {
    cartItems.innerHTML = "<p class=\"muted\">Giỏ hàng đang trống.</p>";
    return;
  }

  cartItems.innerHTML = Array.from(cart.values()).map((item) => `
    <div class="cart-item">
      <img src="${item.product.image}" alt="${item.product.name}">
      <div>
        <strong>${item.product.name}</strong>
        <p class="muted">${item.quantity} x ${money(item.product.price)}</p>
      </div>
      <button class="close-button" type="button" data-remove-id="${item.product.id}" data-track-name="remove_${item.product.id}">-</button>
    </div>
  `).join("");
}

async function openCart() {
  await loadCart();
  openPanel(cartPanel);
}

function startCheckout() {
  if (cart.size === 0) return;
  closePanel(cartPanel);
  successBox.classList.remove("show");
  openPanel(checkoutPanel);
  checkoutStartedAt = Date.now();
  purchaseCompleted = false;
  tracker().trackCustom("checkout_start", {
    metadata: { itemCount: cartSize(), cartValue: cartValue() }
  }).catch(() => {});
}

async function completeOrder() {
  const items = Array.from(cart.values());
  const paymentMethod = document.getElementById("paymentMethod").value;

  const response = await apiFetch("/api/orders", {
    method: "POST",
    body: JSON.stringify({
      sessionId: getSessionId(),
      anonymousId: getAnonymousId(),
      paymentMethod
    })
  });
  const order = response.data;
  showCheckoutStatus(`Đã tạo đơn ${order.orderCode}. Trạng thái: ${order.status}. Hệ thống đang xử lý đơn hàng.`);
  pollOrderStatus(order.orderCode).catch(() => {});

  items.forEach((item) => {
    tracker().trackCustom("purchase_succeeded", {
      product_id: item.product.id,
      metadata: {
        name: item.product.name,
        price: item.product.price,
        category: item.product.category,
        amount: item.product.price * item.quantity,
        quantity: item.quantity,
        order_id: order.orderCode,
        orderCode: order.orderCode,
        payment_method: paymentMethod
      }
    }).catch(() => {});
  });

  cart.clear();
  renderCart();
  purchaseCompleted = true;
  checkoutStartedAt = null;
}

async function pollOrderStatus(orderCode) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const response = await apiFetch(`/api/orders/${encodeURIComponent(orderCode)}`);
    const order = response.data;
    showCheckoutStatus(`Đơn ${order.orderCode}: ${order.status}.`, order.status === "failed" ? "error" : "success");
    if (["completed", "failed", "cancelled"].includes(order.status)) return order;
  }
  return null;
}

function renderPurchasedProducts(items) {
  if (!purchasedList) return;

  if (!items.length) {
    purchasedList.innerHTML = `
      <div class="empty-state">
        <strong>Chưa có đơn hàng đã mua</strong>
        <p class="muted">Các sản phẩm thanh toán thành công sẽ xuất hiện tại đây.</p>
      </div>
    `;
    return;
  }

  purchasedList.innerHTML = items.map((item) => `
    <article class="purchased-item">
      <img src="${item.image || FALLBACK_IMAGE}" alt="${item.name}">
      <div class="purchased-info">
        <strong>${item.name}</strong>
        <p class="muted">Đã mua ${item.totalQuantity} sản phẩm</p>
        <p class="muted">Gần nhất: ${new Date(item.lastPurchasedAt).toLocaleString("vi-VN")}</p>
        <p class="order-codes">${item.orderCodes.join(", ")}</p>
      </div>
      <button class="secondary-button" type="button" data-repurchase-id="${item.productId}" data-track-name="repurchase_${item.productId}">Mua lại</button>
    </article>
  `).join("");
  window.setTimeout(() => repairBrokenImages(purchasedList), 250);
}

async function openPurchasedProducts() {
  if (!authState?.user?.id) {
    closePanel(authPanel);
    alert("Vui lòng đăng nhập để xem đơn hàng đã mua.");
    openPanel(authPanel);
    return;
  }

  purchasedList.innerHTML = "<p class=\"muted\">Đang tải đơn hàng...</p>";
  purchasedSummary.textContent = `Đơn hàng đã mua của ${authState.user.email}.`;
  openPanel(purchasedPanel);
  tracker().trackPageView?.("/me/purchased-products");

  try {
    const response = await apiFetch("/api/me/purchased-products");
    renderPurchasedProducts(response.data || []);
  } catch {
    purchasedList.innerHTML = "<p class=\"muted\">Không thể tải đơn hàng. Vui lòng đăng nhập lại.</p>";
  }
}

document.getElementById("searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  searchTerm = searchInput.value;
  trackCatalogChanged("search_submit");
  document.getElementById("products").scrollIntoView({ behavior: "smooth" });
});

document.querySelector(".keyword-row").addEventListener("click", (event) => {
  const button = event.target.closest("[data-keyword]");
  if (!button) return;
  searchTerm = button.getAttribute("data-keyword");
  searchInput.value = searchTerm;
  trackCatalogChanged("quick_keyword");
});

categoryGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.getAttribute("data-category");
  categorySelect.value = activeCategory;
  trackCatalogChanged("category_filter");
});

categorySelect.addEventListener("change", () => {
  activeCategory = categorySelect.value;
  trackCatalogChanged("category_select_changed");
});

priceFilter.addEventListener("change", () => {
  priceMode = priceFilter.value;
  trackCatalogChanged("price_filter_changed");
});

tagFilter.addEventListener("change", () => {
  tagMode = tagFilter.value;
  trackCatalogChanged("tag_filter_changed");
});

ratingFilter.addEventListener("change", () => {
  ratingMode = ratingFilter.value;
  trackCatalogChanged("rating_filter_changed");
});

sortSelect.addEventListener("change", () => {
  sortMode = sortSelect.value;
  trackCatalogChanged("sort_changed");
});

tabRow.addEventListener("click", (event) => {
  const button = event.target.closest("[data-tab]");
  if (!button) return;
  tabRow.querySelectorAll(".tab-button").forEach((tab) => {
    tab.classList.toggle("active", tab === button);
  });
  tagMode = button.getAttribute("data-tab");
  tagFilter.value = tagMode;
  trackCatalogChanged("recommendation_tab");
});

document.getElementById("resetFiltersButton").addEventListener("click", () => {
  searchTerm = "";
  activeCategory = ALL_CATEGORY;
  priceMode = "all";
  tagMode = "all";
  ratingMode = "all";
  sortMode = "featured";
  searchInput.value = "";
  categorySelect.value = activeCategory;
  priceFilter.value = priceMode;
  tagFilter.value = tagMode;
  ratingFilter.value = ratingMode;
  sortSelect.value = sortMode;
  tabRow.querySelectorAll(".tab-button").forEach((tab) => {
    tab.classList.toggle("active", tab.getAttribute("data-tab") === "all");
  });
  trackCatalogChanged("filters_reset");
});

document.body.addEventListener("click", async (event) => {
  const detailButton = event.target.closest("[data-detail-id]");
  const addButton = event.target.closest("[data-add-id]");
  const buyNowButton = event.target.closest("[data-buy-now-id]");
  const removeButton = event.target.closest("[data-remove-id]");

  if (detailButton) {
    const id = detailButton.getAttribute("data-detail-id");
    const clicked = products.find((product) => product.id === id);
    tracker().trackProductClick(id, window.location.pathname,
      clicked ? { name: clicked.name, price: clicked.price, category: clicked.category } : {}
    ).catch(() => {});
    showProductDetail(id);
  }

  if (addButton) {
    const originalText = addButton.textContent;
    addButton.disabled = true;
    addButton.textContent = "Đang thêm";
    try {
      await addToCart(addButton.getAttribute("data-add-id"));
      addButton.textContent = "Đã thêm";
      window.setTimeout(() => {
        addButton.textContent = originalText;
      }, 900);
    } catch (error) {
      showCartFeedback("Không thể thêm giỏ");
      addButton.textContent = originalText;
      console.error(error);
    } finally {
      window.setTimeout(() => {
        addButton.disabled = false;
      }, 300);
    }
  }

  if (buyNowButton) {
    const originalText = buyNowButton.textContent;
    buyNowButton.disabled = true;
    buyNowButton.textContent = "Đang mở";
    try {
      await buyNow(buyNowButton.getAttribute("data-buy-now-id"));
    } catch (error) {
      showCartFeedback("Không thể mua ngay");
      buyNowButton.textContent = originalText;
      console.error(error);
    } finally {
      buyNowButton.disabled = false;
      if (document.body.contains(buyNowButton)) {
        buyNowButton.textContent = originalText;
      }
    }
  }

  if (removeButton) {
    const productId = removeButton.getAttribute("data-remove-id");
    const item = cart.get(productId);
    if (!item) return;
    const response = await apiFetch(`/api/cart/items/${encodeURIComponent(productId)}`, {
      method: "PATCH",
      body: JSON.stringify({ sessionId: getSessionId(), quantity: item.quantity - 1 })
    });
    syncCart(response.data);
    renderCart();
    tracker().trackCustom("remove_from_cart", {
      product_id: item.product.id,
      metadata: Object.assign(productPayload(item.product), {
        quantity_before: item.quantity,
        quantity_after: Math.max(item.quantity - 1, 0),
        cartValue: cartValue()
      })
    }).catch(() => {});
  }

  if (event.target.matches("[data-close-panel]")) {
    const panel = event.target.closest(".panel");
    if (
      panel?.id === "checkoutPanel"
      && cart.size > 0
      && checkoutStartedAt
      && !purchaseCompleted
    ) {
      tracker().trackCustom("cart_abandoned", {
        metadata: {
          reason: "checkout_closed",
          itemCount: cartSize(),
          cartValue: cartValue(),
          checkoutStartedAt: new Date(checkoutStartedAt).toISOString()
        }
      }).catch(() => {});
    }
    closePanel(panel);
  }
});

document.getElementById("openCartButton").addEventListener("click", () => {
  openCart().catch(console.error);
});
floatingCartButton.addEventListener("click", () => {
  openCart().catch(console.error);
});
document.getElementById("checkoutButton").addEventListener("click", startCheckout);
document.getElementById("completeOrderButton").addEventListener("click", () => {
  const button = document.getElementById("completeOrderButton");
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Đang đặt hàng";
  showCheckoutStatus("Đang gửi đơn hàng...");
  completeOrder().catch((error) => {
    showCheckoutStatus("Không thể đặt hàng. Vui lòng kiểm tra API/RabbitMQ và thử lại.", "error");
    tracker().trackCustom("payment_failed", {
      metadata: {
        reason: error?.message || "checkout_error",
        itemCount: cartSize(),
        cartValue: cartValue(),
        payment_method: document.getElementById("paymentMethod")?.value || "unknown"
      }
    }).catch(() => {});
    console.error(error);
  }).finally(() => {
    button.disabled = false;
    button.textContent = originalText;
  });
});

window.addEventListener("beforeunload", () => {
  if (cart.size > 0 && checkoutStartedAt && !purchaseCompleted) {
    tracker().trackCustom("cart_abandoned", {
      metadata: {
        reason: "page_unload",
        itemCount: cartSize(),
        cartValue: cartValue(),
        checkoutStartedAt: new Date(checkoutStartedAt).toISOString()
      }
    }).catch(() => {});
  }
});

async function initializeStore() {
  updateAuthUi();
  await restoreAuthSession();
  await loadStoreData();
  renderCategories();
  renderDeals();
  renderProducts();
  await loadCart();
  startFlashCountdown();
}

initializeStore().catch((error) => {
  console.error(error);
  resultSummary.textContent = "Không tải được dữ liệu sản phẩm.";
});

if (accountButton) {
  accountButton.addEventListener("click", () => {
    updateAuthUi();
    openPanel(authPanel);
  });
}

authLoginButton?.addEventListener("click", async () => {
  closePanel(authPanel);
  await loginFlow();
});

authRegisterButton?.addEventListener("click", async () => {
  closePanel(authPanel);
  await registerFlow();
});

openPurchasedButton?.addEventListener("click", async () => {
  await openPurchasedProducts();
});

refreshPurchasedButton?.addEventListener("click", async () => {
  await openPurchasedProducts();
});

purchasedList?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-repurchase-id]");
  if (!button) return;

  await addToCart(button.getAttribute("data-repurchase-id"));
  closePanel(purchasedPanel);
  await openCart();
});

authLogoutButton?.addEventListener("click", async () => {
  closePanel(authPanel);
  if (authState?.user?.id) {
    await logoutFlow();
  }
});
