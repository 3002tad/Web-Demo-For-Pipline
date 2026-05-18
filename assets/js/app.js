TrackingSDK.init({
      appId: "markethub-store",
      endpoint: "/track",
      trackPageView: true,
      trackClicks: true,
      trackScroll: true,
      trackViews: true
    });

    let products = [];

    let suppliers = {};

    function expandCatalogProducts(targetCount) {
      const tags = ["deal", "mall", "best", "new"];
      const prefixes = ["Bá»™ sÆ°u táº­p", "PhiÃªn báº£n", "Sáº£n pháº©m", "Combo", "Máº«u má»›i", "HÃ ng chá»n lá»c", "Æ¯u Ä‘Ã£i"];
      const variants = ["Premium", "Daily", "Urban", "Lite", "Pro", "Classic", "Modern", "Essential", "Plus", "Signature"];
      const supplierCategories = Object.keys(suppliers);
      let index = products.length + 1;

      while (products.length < targetCount) {
        const category = supplierCategories[(index - 1) % supplierCategories.length];
        const seedProduct = products.find(function (product) {
          return product.category === category;
        }) || products[0];
        const price = Math.round((180000 + ((index * 7919) % 2300000)) / 10000) * 10000;
        const rating = Number((4.1 + ((index * 37) % 9) / 10).toFixed(1));
        const sold = 120 + ((index * 347) % 9800);
        const tag = tags[index % tags.length];

        products.push({
          id: "p" + String(index).padStart(3, "0"),
          name: `${prefixes[index % prefixes.length]} ${category} ${variants[index % variants.length]} ${String(index).padStart(3, "0")}`,
          category,
          price,
          rating,
          sold,
          tag,
          image: seedProduct.image,
          description: `Sáº£n pháº©m ${category.toLowerCase()} Ä‘Æ°á»£c tuyá»ƒn chá»n bá»Ÿi ${suppliers[category].name}, phÃ¹ há»£p cho nhu cáº§u mua sáº¯m háº±ng ngÃ y.`
        });

        index += 1;
      }
    }

    let categoryImages = {};
    const cart = new Map();
    let searchTerm = "";
    let activeCategory = "Táº¥t cáº£";
    let priceMode = "all";
    let tagMode = "all";
    let ratingMode = "all";
    let sortMode = "featured";

    async function loadStoreData() {
      const responses = await Promise.all([
        fetch("/data/products.json"),
        fetch("/data/suppliers.json"),
        fetch("/data/categories.json")
      ]);

      if (responses.some(function (response) { return !response.ok; })) {
        throw new Error("Cannot load store data");
      }

      const data = await Promise.all(responses.map(function (response) {
        return response.json();
      }));

      products = data[0];
      suppliers = data[1];
      categoryImages = data[2];
    }

    function prepareProducts() {
      expandCatalogProducts(500);
      products.forEach(function (product, index) {
        product.supplier = suppliers[product.category];
        product.shipping = index % 3 === 0 ? "Freeship Extra" : "Giao trong 2-3 ngày";
        product.origin = product.supplier.location;
        product.stock = 24 + index * 7;
      });
    }
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
    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");
    const cartPanel = document.getElementById("cartPanel");
    const detailPanel = document.getElementById("detailPanel");
    const detailContent = document.getElementById("detailContent");
    const checkoutPanel = document.getElementById("checkoutPanel");
    const successBox = document.getElementById("successBox");

    function money(value) {
      return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
    }

    function categories() {
      return ["Táº¥t cáº£"].concat(Array.from(new Set(products.map(function (product) {
        return product.category;
      }))));
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
        .filter(function (product) {
          const bySearch = !term || product.name.toLowerCase().includes(term) || product.category.toLowerCase().includes(term) || product.description.toLowerCase().includes(term) || product.tag.includes(term);
          const byCategory = activeCategory === "Táº¥t cáº£" || product.category === activeCategory;
          const byTag = tagMode === "all" || product.tag === tagMode;
          const byRating = ratingMode === "all" || product.rating >= Number(ratingMode);
          return bySearch && byCategory && byTag && byRating && matchesPrice(product);
        })
        .sort(function (a, b) {
          if (sortMode === "price_asc") return a.price - b.price;
          if (sortMode === "price_desc") return b.price - a.price;
          if (sortMode === "sold_desc") return b.sold - a.sold;
          if (sortMode === "rating_desc") return b.rating - a.rating;
          return products.indexOf(a) - products.indexOf(b);
        });
    }

    function renderCategories() {
      const cats = categories();
      categoryGrid.innerHTML = cats.map(function (category) {
        const image = categoryImages[category] || categoryImages["Táº¥t cáº£"];
        return `
          <button class="category-card" type="button" data-category="${category}" data-track-name="category_${category}">
            <span class="category-icon"><img src="${image}" alt="${category}"></span>
            <strong>${category}</strong>
          </button>
        `;
      }).join("");

      categorySelect.innerHTML = cats.map(function (category) {
        return `<option value="${category}">${category}</option>`;
      }).join("");
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
              <span>ÄÃ£ bÃ¡n ${product.sold}</span>
            </div>
            ${compact ? "" : `
              <div class="card-actions">
                <button class="tiny-button" type="button" data-detail-id="${product.id}" data-track-name="view_detail_${product.id}">Xem</button>
                <button class="tiny-button" type="button" data-add-id="${product.id}" data-track-name="add_${product.id}">ThÃªm</button>
              </div>
            `}
          </div>
        </article>
      `;
    }

    function renderDeals() {
      dealRow.innerHTML = products
        .filter(function (product) {
          return product.tag === "deal" || product.tag === "best";
        })
        .slice(0, 6)
        .map(function (product) {
          return `
            <button class="deal-card" type="button" data-detail-id="${product.id}" data-track-name="flash_${product.id}">
              <img src="${product.image}" alt="${product.name}">
              <span class="deal-body">
                <strong>${money(product.price)}</strong>
                <span class="muted">ÄÃ£ bÃ¡n ${product.sold}</span>
              </span>
            </button>
          `;
        }).join("");
    }

    function renderProducts() {
      const visible = filteredProducts();
      resultSummary.textContent = `${visible.length} sáº£n pháº©m phÃ¹ há»£p`;
      productGrid.innerHTML = visible.map(function (product) {
        return productCard(product, false);
      }).join("");
    }

    function trackCatalogChanged(eventName, extra) {
      renderProducts();
      TrackingSDK.track(eventName, Object.assign({
        searchTerm: searchTerm || null,
        category: activeCategory,
        priceMode,
        tagMode,
        ratingMode,
        sortMode,
        visibleProducts: filteredProducts().length
      }, extra || {}));
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
      const product = products.find(function (item) {
        return item.id === productId;
      });
      if (!product) return;
      const relatedProducts = products
        .filter(function (item) {
          return item.id !== product.id && (item.category === product.category || item.tag === product.tag);
        })
        .slice(0, 4);

      detailContent.innerHTML = `
        <div class="detail-layout">
          <div class="detail-media">
            <img src="${product.image}" alt="${product.name}">
            <div class="thumb-row" aria-label="áº¢nh sáº£n pháº©m phá»¥">
              <span>áº¢nh 1</span>
              <span>áº¢nh 2</span>
              <span>áº¢nh 3</span>
              <span>Video</span>
            </div>
            <div class="detail-section supplier-card">
              <span class="supplier-avatar">${product.supplier.name.charAt(0)}</span>
              <div>
                <strong>${product.supplier.name}</strong>
                <p class="muted">${product.supplier.location} | ${product.supplier.products} sáº£n pháº©m</p>
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
              <span class="muted">ÄÃ£ bÃ¡n ${product.sold}</span>
            </div>
            <dl class="detail-specs">
              <div><dt>ÄÃ¡nh giÃ¡</dt><dd>${product.rating}/5 sao</dd></div>
              <div><dt>Danh má»¥c</dt><dd>${product.category}</dd></div>
              <div><dt>Kho hÃ ng</dt><dd>${product.stock} sáº£n pháº©m</dd></div>
              <div><dt>Xuáº¥t xá»©</dt><dd>${product.origin}</dd></div>
            </dl>
            <div class="detail-section">
              <strong>Váº­n chuyá»ƒn & báº£o hÃ nh</strong>
              <p class="muted">${product.shipping}. Äá»•i tráº£ 7 ngÃ y cho sáº£n pháº©m Ä‘á»§ Ä‘iá»u kiá»‡n. NhÃ  cung cáº¥p pháº£n há»“i ${product.supplier.response} tin nháº¯n.</p>
            </div>
            <div class="card-actions">
              <button class="secondary-button" type="button" data-wishlist-id="${product.id}" data-track-name="wishlist_${product.id}">YÃªu thÃ­ch</button>
              <button class="primary-button" type="button" data-add-id="${product.id}" data-track-name="detail_add_${product.id}">ThÃªm giá»</button>
            </div>
          </div>
        </div>
        <div class="detail-section" style="margin-top:18px;">
          <strong>MÃ´ táº£ sáº£n pháº©m</strong>
          <p class="muted">${product.description} Sáº£n pháº©m thuá»™c gian hÃ ng ${product.supplier.name}, cÃ³ thÃ´ng tin váº­n chuyá»ƒn, Ä‘á»•i tráº£ vÃ  nhÃ  cung cáº¥p rÃµ rÃ ng Ä‘á»ƒ báº¡n yÃªn tÃ¢m trÆ°á»›c khi Ä‘áº·t hÃ ng.</p>
        </div>
        <div class="detail-section" style="margin-top:12px;">
          <strong>Sáº£n pháº©m liÃªn quan</strong>
          <div class="related-grid">
            ${relatedProducts.map(function (item) {
              return `
                <button class="related-card" type="button" data-detail-id="${item.id}" data-track-name="related_${item.id}">
                  <img src="${item.image}" alt="${item.name}">
                  <strong>${item.name}</strong>
                  <span class="price">${money(item.price)}</span>
                </button>
              `;
            }).join("")}
          </div>
        </div>
      `;

      openPanel(detailPanel);
      TrackingSDK.track("product_detail_open", productPayload(product));
    }

    function addToCart(productId) {
      const product = products.find(function (item) {
        return item.id === productId;
      });
      if (!product) return;

      const current = cart.get(productId) || { product, quantity: 0 };
      current.quantity += 1;
      cart.set(productId, current);
      renderCart();
      TrackingSDK.track("add_to_cart", Object.assign(productPayload(product), {
        quantity: current.quantity,
        cartValue: cartValue()
      }));
    }

    function cartValue() {
      return Array.from(cart.values()).reduce(function (total, item) {
        return total + item.product.price * item.quantity;
      }, 0);
    }

    function cartSize() {
      return Array.from(cart.values()).reduce(function (total, item) {
        return total + item.quantity;
      }, 0);
    }

    function renderCart() {
      cartCount.textContent = String(cartSize());
      cartTotal.textContent = money(cartValue());

      if (cart.size === 0) {
        cartItems.innerHTML = "<p class=\"muted\">Giá» hÃ ng Ä‘ang trá»‘ng.</p>";
        return;
      }

      cartItems.innerHTML = Array.from(cart.values()).map(function (item) {
        return `
          <div class="cart-item">
            <img src="${item.product.image}" alt="${item.product.name}">
            <div>
              <strong>${item.product.name}</strong>
              <p class="muted">${item.quantity} x ${money(item.product.price)}</p>
            </div>
            <button class="close-button" type="button" data-remove-id="${item.product.id}" data-track-name="remove_${item.product.id}">-</button>
          </div>
        `;
      }).join("");
    }

    function openCart() {
      renderCart();
      openPanel(cartPanel);
      TrackingSDK.track("cart_open", { itemCount: cartSize(), cartValue: cartValue() });
    }

    function startCheckout() {
      if (cart.size === 0) {
        TrackingSDK.track("checkout_blocked", { reason: "empty_cart" });
        return;
      }
      closePanel(cartPanel);
      successBox.classList.remove("show");
      openPanel(checkoutPanel);
      TrackingSDK.track("checkout_started", { itemCount: cartSize(), cartValue: cartValue() });
    }

    function completeOrder() {
      const order = {
        orderId: "ORDER-" + Date.now(),
        itemCount: cartSize(),
        cartValue: cartValue(),
        shippingMethod: document.getElementById("shippingMethod").value,
        paymentMethod: document.getElementById("paymentMethod").value
      };
      TrackingSDK.track("checkout_step", { step: "customer_info_submitted", hasName: Boolean(document.getElementById("customerName").value), hasEmail: Boolean(document.getElementById("customerEmail").value) });
      TrackingSDK.track("purchase_completed", order);
      successBox.classList.add("show");
      cart.clear();
      renderCart();
    }

    document.getElementById("searchForm").addEventListener("submit", function (event) {
      event.preventDefault();
      searchTerm = searchInput.value;
      trackCatalogChanged("search_submit");
      document.getElementById("products").scrollIntoView({ behavior: "smooth" });
    });

    document.querySelector(".keyword-row").addEventListener("click", function (event) {
      const button = event.target.closest("[data-keyword]");
      if (!button) return;
      searchTerm = button.getAttribute("data-keyword");
      searchInput.value = searchTerm;
      trackCatalogChanged("quick_keyword");
    });

    categoryGrid.addEventListener("click", function (event) {
      const button = event.target.closest("[data-category]");
      if (!button) return;
      activeCategory = button.getAttribute("data-category");
      categorySelect.value = activeCategory;
      trackCatalogChanged("category_filter");
    });

    categorySelect.addEventListener("change", function () {
      activeCategory = categorySelect.value;
      trackCatalogChanged("category_select_changed");
    });

    priceFilter.addEventListener("change", function () {
      priceMode = priceFilter.value;
      trackCatalogChanged("price_filter_changed");
    });

    tagFilter.addEventListener("change", function () {
      tagMode = tagFilter.value;
      trackCatalogChanged("tag_filter_changed");
    });

    ratingFilter.addEventListener("change", function () {
      ratingMode = ratingFilter.value;
      trackCatalogChanged("rating_filter_changed");
    });

    sortSelect.addEventListener("change", function () {
      sortMode = sortSelect.value;
      trackCatalogChanged("sort_changed");
    });

    tabRow.addEventListener("click", function (event) {
      const button = event.target.closest("[data-tab]");
      if (!button) return;
      tabRow.querySelectorAll(".tab-button").forEach(function (tab) {
        tab.classList.toggle("active", tab === button);
      });
      tagMode = button.getAttribute("data-tab");
      tagFilter.value = tagMode;
      trackCatalogChanged("recommendation_tab");
    });

    document.getElementById("resetFiltersButton").addEventListener("click", function () {
      searchTerm = "";
      activeCategory = "Táº¥t cáº£";
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
      tabRow.querySelectorAll(".tab-button").forEach(function (tab) {
        tab.classList.toggle("active", tab.getAttribute("data-tab") === "all");
      });
      trackCatalogChanged("filters_reset");
    });

    document.body.addEventListener("click", function (event) {
      const detailButton = event.target.closest("[data-detail-id]");
      const addButton = event.target.closest("[data-add-id]");
      const removeButton = event.target.closest("[data-remove-id]");
      const wishlistButton = event.target.closest("[data-wishlist-id]");
      const voucherButton = event.target.closest("[data-voucher-code]");
      const supplierButton = event.target.closest("[data-supplier-name]");

      if (detailButton) showProductDetail(detailButton.getAttribute("data-detail-id"));
      if (addButton) addToCart(addButton.getAttribute("data-add-id"));
      if (wishlistButton) {
        const product = products.find(function (item) {
          return item.id === wishlistButton.getAttribute("data-wishlist-id");
        });
        if (product) TrackingSDK.track("wishlist_added", productPayload(product));
      }
      if (voucherButton) {
        TrackingSDK.track("voucher_saved", { code: voucherButton.getAttribute("data-voucher-code") });
      }
      if (supplierButton) {
        TrackingSDK.track("supplier_open", { supplier: supplierButton.getAttribute("data-supplier-name") });
      }
      if (removeButton) {
        const productId = removeButton.getAttribute("data-remove-id");
        const item = cart.get(productId);
        if (!item) return;
        item.quantity -= 1;
        if (item.quantity <= 0) cart.delete(productId);
        renderCart();
        TrackingSDK.track("remove_from_cart", { productId, cartValue: cartValue() });
      }
      if (event.target.matches("[data-close-panel]")) closePanel(event.target.closest(".panel"));
    });

    document.getElementById("openCartButton").addEventListener("click", openCart);
    document.getElementById("checkoutButton").addEventListener("click", startCheckout);
    document.getElementById("completeOrderButton").addEventListener("click", completeOrder);

    async function initializeStore() {
      await loadStoreData();
      prepareProducts();
      renderCategories();
      renderDeals();
      renderProducts();
      renderCart();
      startFlashCountdown();

      products.slice(0, 60).forEach(function (product, index) {
        window.setTimeout(function () {
          TrackingSDK.track("product_impression", Object.assign(productPayload(product), { position: index + 1 }));
        }, 250 + index * 45);
      });
    }

    initializeStore().catch(function (error) {
      console.error(error);
      resultSummary.textContent = "Không tải được dữ liệu sản phẩm.";
    });


