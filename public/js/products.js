const productStore = createStore({
  products: window.__INITIAL_PRODUCTS__ || [],
  filter: 'all', // 'all' | 'available' | 'out' | 'wishlist'
  searchQuery: '', // state baru: kata kunci pencarian
  sortBy: 'default', // state baru: 'default' | 'price-asc' | 'price-desc'
});

function renderBadge({ label, color }) {
  const colorMap = {
    green: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700',
    red: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700',
    gray: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
  };
  const classes = colorMap[color] || colorMap.gray;
  return `<span class="inline-block px-2 py-1 text-xs font-semibold rounded-full border ${classes}">${label}</span>`;
}

function renderProductCard(product) {
  const isAvailable = product.stock > 0;
  const badge = renderBadge({
    label: isAvailable ? 'Tersedia' : 'Habis',
    color: isAvailable ? 'green' : 'red',
  });

  const favorited = isWishlisted(product.id);
  const wishlistBtn = `
    <button
      class="wishlist-btn shrink-0 text-lg leading-none"
      data-id="${product.id}"
      title="${favorited ? 'Hapus dari favorit' : 'Tambah ke favorit'}"
    >${favorited ? '❤️' : '🤍'}</button>
  `;

  return `
    <div class="product-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow" data-stock="${product.stock}">
      <div class="flex items-start justify-between gap-2 mb-2">
        <h3 class="font-semibold text-gray-800 dark:text-gray-100 flex-1">${product.name}</h3>
        ${badge}
        ${wishlistBtn}
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">${product.description || 'Tanpa deskripsi'}</p>
      <div class="flex items-center justify-between mb-3">
        <span class="text-blue-600 dark:text-blue-400 font-bold">Rp${Number(product.price).toLocaleString('id-ID')}</span>
        <span class="text-xs text-gray-400 dark:text-gray-500">Stok: ${product.stock}</span>
      </div>
      <button
        class="add-to-cart-btn w-full ${isAvailable ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'} text-sm font-semibold py-2 rounded-lg transition-colors"
        data-id="${product.id}"
        data-name="${product.name}"
        data-price="${product.price}"
        ${isAvailable ? '' : 'disabled'}
      >
        ${isAvailable ? '+ Tambah ke Keranjang' : 'Stok Habis'}
      </button>
    </div>
  `;
}

/**
 * Derived value dari state: filter status stok, filter wishlist, search,
 * lalu sort - semuanya jalan berurutan dari satu productStore.state,
 * gak ada state duplikat buat masing-masing fitur.
 */
function getFilteredProducts(state) {
  let list = state.products;

  if (state.filter === 'available') {
    list = list.filter((p) => p.stock > 0);
  } else if (state.filter === 'out') {
    list = list.filter((p) => p.stock === 0);
  } else if (state.filter === 'wishlist') {
    const favoritedIds = wishlistStore.getState().ids;
    list = list.filter((p) => favoritedIds.includes(String(p.id)));
  }

  const query = state.searchQuery.trim().toLowerCase();
  if (query !== '') {
    list = list.filter((p) => p.name.toLowerCase().includes(query));
  }

  if (state.sortBy === 'price-asc') {
    list = [...list].sort((a, b) => a.price - b.price);
  } else if (state.sortBy === 'price-desc') {
    list = [...list].sort((a, b) => b.price - a.price);
  }

  return list;
}

function renderProductList(state) {
  const container = document.getElementById('product-list');
  const emptyState = document.getElementById('empty-state');
  const filtered = getFilteredProducts(state);

  if (filtered.length === 0) {
    container.innerHTML = '';
    emptyState.textContent =
      state.filter === 'wishlist'
        ? 'Belum ada produk favorit. Klik ikon 🤍 di kartu produk buat nambahin.'
        : 'Gak ada produk yang cocok sama filter ini';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  container.innerHTML = filtered.map(renderProductCard).join('');
}

productStore.subscribe(renderProductList);
// wishlist juga men-trigger render ulang produk: dipake buat 2 hal,
// nyinkronin ikon hati di kartu, dan nge-refresh daftar pas filter = 'wishlist'
wishlistStore.subscribe(() => renderProductList(productStore.getState()));
renderProductList(productStore.getState()); // render ulang sekali di client biar ikon hati sinkron sama localStorage

/**
 * Helper dipake bareng sama tombol filter di bawah katalog & tombol
 * hati di navbar (wishlist.js), biar gak duplikat logic ganti class aktif.
 */
function setFilter(filterValue) {
  productStore.setState({ filter: filterValue });

  document.querySelectorAll('.filter-btn').forEach((b) => {
    const isActive = b.dataset.filter === filterValue;
    b.classList.toggle('bg-blue-600', isActive);
    b.classList.toggle('text-white', isActive);
    b.classList.toggle('bg-gray-200', !isActive);
    b.classList.toggle('dark:bg-gray-700', !isActive);
    b.classList.toggle('text-gray-700', !isActive);
    b.classList.toggle('dark:text-gray-300', !isActive);
  });
}

// tombol filter
document.getElementById('filter-buttons').addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  setFilter(btn.dataset.filter);
});

// input pencarian - dynamic rendering: tiap ketikan langsung filter ulang
// katalog di client, gak ada reload & gak nunggu tombol submit
document.getElementById('search-input').addEventListener('input', (e) => {
  productStore.setState({ searchQuery: e.target.value });
});

// dropdown sort harga
document.getElementById('sort-select').addEventListener('change', (e) => {
  productStore.setState({ sortBy: e.target.value });
});

/**
 * event delegation buat tombol "Tambah ke Keranjang" & tombol wishlist -
 * dipasang di container, bukan per-tombol, soalnya kartu di-render ulang
 * tiap kali filter/search/sort/wishlist berubah.
 */
document.getElementById('product-list').addEventListener('click', (e) => {
  const wishBtn = e.target.closest('.wishlist-btn');
  if (wishBtn) {
    toggleWishlist(wishBtn.dataset.id);
    return;
  }

  const btn = e.target.closest('.add-to-cart-btn');
  if (!btn || btn.disabled) return;

  addToCart({
    id: btn.dataset.id,
    name: btn.dataset.name,
    price: Number(btn.dataset.price),
  });

  // buka keranjang otomatis biar user liat item baru masuk
  cartStore.setState({ isOpen: true });
});