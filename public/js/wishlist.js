function loadWishlistFromStorage() {
  try {
    const saved = localStorage.getItem('wishlist');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

const wishlistStore = createStore({
  ids: loadWishlistFromStorage(), // array of string id produk yang di-favoritkan
});

/**
 * Render badge jumlah favorit di navbar - pola SAMA PERSIS kayak
 * renderCart() di cart.js: tiap wishlistStore berubah, badge ke-update
 * otomatis lewat subscribe(), gak ada update manual di banyak tempat.
 */
function renderWishlistBadge(state) {
  const badge = document.getElementById('wishlist-badge');
  const total = state.ids.length;

  if (total > 0) {
    badge.textContent = total > 99 ? '99+' : total;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }

  localStorage.setItem('wishlist', JSON.stringify(state.ids));
}

wishlistStore.subscribe(renderWishlistBadge);
renderWishlistBadge(wishlistStore.getState()); // sync badge pas pertama load

// --- actions ---
function toggleWishlist(id) {
  const ids = wishlistStore.getState().ids;
  const exists = ids.includes(id);

  wishlistStore.setState({
    ids: exists ? ids.filter((wid) => wid !== id) : [...ids, id],
  });
}

function isWishlisted(id) {
  return wishlistStore.getState().ids.includes(String(id));
}

// klik ikon hati di navbar -> filter katalog biar cuma nampilin produk favorit
document.getElementById('wishlist-toggle').addEventListener('click', () => {
  setFilter('wishlist'); // setFilter ada di products.js, di-load setelah file ini
  document.getElementById('product-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
});