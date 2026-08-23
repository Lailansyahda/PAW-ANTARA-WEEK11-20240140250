# Toko Cart App — State Management, Dynamic Rendering, Komponen Berbasis Data

API + tampilan (EJS + Tailwind), tanpa AI. Fokus materi: katalog produk, keranjang
belanja dengan badge dinamis, dan dark/light mode — semuanya demo konsep **state
management sederhana**, **dynamic rendering**, dan **komponen berbasis data (badge
& card)**.

## Struktur folder
```
toko-cart-app/
├── app.js
├── config/database.js         # koneksi sequelize (postgres)
├── models/
│   ├── admin.model.js
│   ├── product.model.js
│   └── index.js
├── controllers/
│   ├── admin.controller.js    # login/logout admin
│   ├── product.controller.js  # CRUD produk
│   └── page.controller.js     # render halaman utama
├── middlewares/auth.middleware.js
├── routes/
│   ├── admin.routes.js
│   ├── product.routes.js
│   └── page.routes.js
├── seeders/seed.js            # admin + produk dummy
├── utils/response.js
├── views/
│   ├── index.ejs               # halaman utama
│   └── partials/
│       ├── badge.ejs           # komponen badge, berbasis data {label, color}
│       └── product-card.ejs    # komponen kartu produk
└── public/js/
    ├── store.js                 # state management: getState/setState/subscribe
    ├── theme.js                 # state dark/light mode
    ├── cart.js                  # state keranjang + badge dinamis
    └── products.js              # render katalog + filter + hook tombol keranjang
```

## Cara install & jalanin

1. Bikin database:
```sql
CREATE DATABASE toko_cart_db;
```

2. Copy `.env.example` jadi `.env`, sesuaikan kredensial DB.

3. Install & seed:
```bash
npm install
npm run seed
```

4. Jalankan:
```bash
npm run dev
```

5. Buka `http://localhost:3000` di **browser** (bukan Postman) buat liat tampilannya.

## Endpoint API

| Method | Endpoint             | Auth  | Keterangan       |
|--------|------------------------|-------|--------------------|
| POST   | /api/admin/login       | -     | Login admin (session) |
| POST   | /api/admin/logout      | admin | Logout             |
| GET    | /api/products          | -     | List produk (JSON) |
| POST   | /api/products          | admin | Tambah produk       |
| PUT    | /api/products/:id      | admin | Update produk       |
| DELETE | /api/products/:id      | admin | Hapus produk        |
| GET    | /                       | -     | Halaman utama (EJS) |

Login admin default (dari seeder): `admin` / `admin123`.

## Konsep yang kedemo

### 1. State management sederhana (`public/js/store.js`)
Pola dasar: satu object `state` jadi sumber kebenaran satu-satunya, `setState()` buat
ubah, `subscribe()` buat daftar fungsi yang mau tau kalo state berubah. Dipake ulang
buat 2 kebutuhan berbeda: `themeStore` (tema) dan `cartStore` (keranjang) — nunjukin
pola yang sama bisa dipake buat state apapun.

### 2. Komponen berbasis data (badge & card)
`badge.ejs` cuma nerima `{ label, color }`, gak ada logic spesifik per kasus. Dipake
buat 2 hal beda: status stok produk (`Tersedia`/`Habis`) dan nantinya bisa dipake buat
hal lain juga — karena dia generic. `product-card.ejs` manggil `badge.ejs` di
dalamnya (komposisi). Pola yang sama ditulis versi JS di `products.js` biar
konsisten waktu render ulang di client.

### 3. Dynamic rendering
- **Katalog produk**: render pertama dari server (SSR EJS). Begitu klik filter
  (Semua/Tersedia/Habis), render selanjutnya murni di client (`renderProductList()`
  di `products.js`) — gak reload halaman.
- **Badge keranjang**: setiap kali `addToCart()` atau `changeQty()` dipanggil,
  `cartStore` berubah, otomatis men-trigger `renderCart()` yang update angka badge,
  isi drawer, dan total harga — semuanya SEKALI JALAN dari satu sumber state, bukan
  di-update manual satu-satu di banyak tempat.
- **Dark/light mode**: klik toggle → `themeStore` berubah → `renderTheme()`
  nambah/hapus class `dark` di `<html>` + ganti icon + simpen ke `localStorage`.

## Kenapa keranjang & tema disimpen di `localStorage`?

Keduanya **state di client**, gak perlu nyimpen ke database (beda sama data produk
yang emang perlu persist di server buat semua orang). `localStorage` dipake biar gak
ilang pas halaman di-reload — konsep tambahan yang bisa dijelasin: bedanya state yang
"per-user, sementara di browser" vs "data yang perlu ada di server buat semua orang".

## Ide pengembangan lanjut
- Checkout beneran (submit isi keranjang ke endpoint baru, buat record order di DB)
- Halaman admin (EJS) buat kelola produk tanpa harus lewat Postman
- Search produk (state `searchQuery` di `productStore`, filter tambahan)

## Fitur tambahan (Tugas Week 11)

Pengembangan di bawah ini nambahin fitur di atas struktur project yang udah ada,
tanpa ngubah arsitektur inti (`store.js`, pola badge/card, dsb).

### 1. Wishlist / Produk Favorit (`public/js/wishlist.js`)
State ke-3 yang dibikin pake `createStore()` yang sama (setelah `themeStore` &
`cartStore`) — buktiin pola state management-nya reusable buat kebutuhan
apapun. Klik ikon 🤍/❤️ di tiap kartu produk buat toggle status favorit,
disimpen ke `localStorage` biar gak ilang pas reload. Ada juga:
- **Badge dinamis** di navbar (`#wishlist-badge`) yang nunjukin jumlah produk
  favorit, pola render-nya sama persis kayak badge keranjang.
- **Filter "❤️ Favorit"** di baris filter katalog, ditambahin ke
  `getFilteredProducts()` di `productStore` — klik ikon hati di navbar atau
  tombol filter buat nampilin cuma produk yang di-favoritkan.

### 2. Search produk (state `searchQuery`)
Input teks di atas katalog (`#search-input`) nge-update
`productStore.setState({ searchQuery })` tiap kali user ngetik. Hasilnya
langsung difilter ulang di client (`getFilteredProducts()`) tanpa reload
halaman — dynamic rendering murni dari satu sumber state.

### 3. Sort harga (state `sortBy`)
Dropdown `#sort-select` (`Default` / `Harga Rendah ke Tinggi` / `Harga Tinggi
ke Rendah`) nge-update `productStore.setState({ sortBy })`. Filter, search,
dan sort semuanya jalan berurutan dari **satu** `productStore.state` yang
sama, gak ada state kepisah buat masing-masing fitur.

### Kenapa desainnya kayak gini?
Tiga fitur di atas sengaja dibikin numpang di pola yang udah ada
(`createStore`, komponen badge generic, render-ulang-dari-state) buat
nunjukin poin utama materi: begitu ada satu pola state management sederhana
yang solid, nambah fitur baru (search, sort, wishlist) tinggal nambah field
di state + 1 fungsi render, gak perlu nulis ulang arsitekturnya.

---

## Screenshot

### Tampilan utama (dark/light mode)
<img width="1365" height="672" alt="Screenshot 2026-08-23 065018" src="https://github.com/user-attachments/assets/c03cda36-dda1-4ed0-9426-891eb040cca7" />
<img width="1362" height="672" alt="image" src="https://github.com/user-attachments/assets/60f43ad2-f8fc-4c9e-b80c-a8a0b77459dc" />

### Fitur search produk
<img width="1365" height="678" alt="image" src="https://github.com/user-attachments/assets/da5660be-cc31-4456-aa59-f33b8dc7b068" />

### Fitur wishlist / favorit
<img width="1365" height="675" alt="image" src="https://github.com/user-attachments/assets/49499c4f-2306-460a-9fe9-1e7e06cef288" />

### Keranjang belanja
<img width="1365" height="680" alt="image" src="https://github.com/user-attachments/assets/6fb836c1-e380-4fb0-aa5f-ee075d3631f1" />
