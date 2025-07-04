<template>
  <div class="product-list-page">
    <header class="app-header">
      <h1>Petra's Store</h1>
    </header>

    <div class="search-bar">
      <input
        type="text"
        v-model="searchTerm"
        placeholder="Cari produk..."
        class="search-input"
      />
    </div>

    <div class="product-grid" v-if="displayedProducts.length > 0">
      <ProductCard
        v-for="product in displayedProducts"
        :key="product.id"
        :product="product"
      />
    </div>
    <p v-else class="no-products-found">Tidak ada produk ditemukan.</p>

    <!-- Loading indicator / Infinite scroll trigger -->
    <div v-if="hasMoreProducts" ref="scrollTrigger" class="scroll-trigger">
      <p>Memuat lebih banyak produk...</p>
      <div class="spinner"></div>
    </div>
    <p v-else-if="!isLoading && allProducts.length > 0 && !hasMoreProducts" class="end-of-list">
      Anda telah mencapai akhir daftar produk.
    </p>
    <p v-else-if="isLoading" class="loading-initial">Memuat produk awal...</p>
  </div>
</template>

<script>
import ProductCard from '@/components/ProductCard.vue';

const PRODUCTS_PER_PAGE = 6; // Jumlah produk yang akan dimuat setiap kali scroll

export default {
  name: 'ProductList',
  components: {
    ProductCard
  },
  data() {
    return {
      apiUrl: window.api_server,
      allProducts: [],       // Semua produk dari JSON
      displayedProducts: [], // Produk yang saat ini ditampilkan
      searchTerm: '',
      currentPage: 0,
      isLoading: false,
      hasMoreProducts: true,
      observer: null         // Intersection Observer instance for infinite scroll
    };
  },
  computed: {
    filteredProducts() {
      if (!this.searchTerm) {
        return this.allProducts;
      }
      const lowerCaseSearchTerm = this.searchTerm.toLowerCase();
      return this.allProducts.filter(product =>
        product.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        product.description.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }
  },
  watch: {
    // Watch searchTerm changes to reset pagination
    searchTerm() {
      this.resetAndLoadInitialProducts();
    }
  },
  mounted() {
    // Ambil semua data produk sekali saat komponen pertama kali dimuat
    this.fetchAllProducts();
    // Setup Intersection Observer untuk mendeteksi scroll trigger
    this.setupIntersectionObserver();
  },
  beforeUnmount() {
    // Hentikan observer saat komponen dihancurkan untuk mencegah kebocoran memori
    if (this.observer) {
      this.observer.disconnect();
    }
  },
  methods: {
    async fetchAllProducts() {
      this.isLoading = true;
      try {
        const response = await fetch(this.apiUrl + '/api/product');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        this.allProducts = await response.json();
        // Setelah semua data diambil, muat data awal yang akan ditampilkan
        this.resetAndLoadInitialProducts();
      } catch (error) {
        console.error('Error fetching products:', error);
        this.isLoading = false;
        // Tampilkan pesan error kepada pengguna jika perlu
      }
    },

    loadMoreProducts() {
      // Hentikan jika sedang memuat atau tidak ada lagi produk
      if (this.isLoading || !this.hasMoreProducts) return;

      this.isLoading = true;
      // Simulasikan delay panggilan API untuk melihat efek loading
      setTimeout(() => {
        const startIndex = this.currentPage * PRODUCTS_PER_PAGE;
        const endIndex = startIndex + PRODUCTS_PER_PAGE;
        // Ambil produk berikutnya dari daftar yang sudah difilter
        const newProducts = this.filteredProducts.slice(startIndex, endIndex);

        if (newProducts.length > 0) {
          // Tambahkan produk baru ke daftar yang ditampilkan
          this.displayedProducts = [...this.displayedProducts, ...newProducts];
          this.currentPage++;
          // Cek apakah semua produk sudah ditampilkan
          if (this.displayedProducts.length >= this.filteredProducts.length) {
            this.hasMoreProducts = false;
          }
        } else {
          // Tidak ada lagi produk yang bisa dimuat
          this.hasMoreProducts = false;
        }
        this.isLoading = false;
      }, 500); // Simulasi 0.5 detik loading
    },

    resetAndLoadInitialProducts() {
      this.displayedProducts = [];
      this.currentPage = 0;
      this.hasMoreProducts = true;
      this.isLoading = false; // Reset status loading
      // Pastikan DOM diperbarui sebelum memuat produk lagi
      this.$nextTick(() => {
        this.loadMoreProducts(); // Muat produk awal setelah reset
      });
    },

    setupIntersectionObserver() {
      this.observer = new IntersectionObserver((entries) => {
        const [entry] = entries;
        // Jika trigger terlihat dan masih ada produk, serta tidak sedang memuat
        if (entry.isIntersecting && this.hasMoreProducts && !this.isLoading) {
          this.loadMoreProducts(); // Panggil fungsi untuk memuat lebih banyak produk
        }
      }, {
        root: null, // viewport sebagai root
        rootMargin: '0px',
        threshold: 0.1 // Ketika 10% dari trigger terlihat
      });

      // Amati elemen trigger setelah DOM di-render dan elemen ada
      this.$nextTick(() => {
        if (this.$refs.scrollTrigger) {
          this.observer.observe(this.$refs.scrollTrigger);
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.product-list-page {
  padding: 0 15px 15px; /* Sesuaikan padding agar konten tidak terpotong sticky header */
  // max-width: 600px;
  width: 85vw;
  margin: 0 auto;
}

.app-header {
  text-align: center;
  margin-bottom: 0;
  // width: 85vw;
  padding: 15px;
  background-color: rgb(107, 51, 236);
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);

  h1 {
    color: white;
    font-size: 2em;
    font-weight: bold;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    margin: 0;
  }
}

.search-bar {
  margin-bottom: 20px;
  padding: 10px 15px;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  position: sticky;
  top: 70px;
  z-index: 999;
  // width: 85vw;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;

  .search-input {
    width: 90%;
    padding: 10px 15px;
    border: 1px solid #ccc;
    border-radius: 25px;
    font-size: 1em;
    outline: none;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);

    &:focus {
      border-color: #007bff;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }
  }
}

.product-grid {
  display: grid;
  gap: 15px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  justify-content: center;
}

.scroll-trigger, .loading-initial, .end-of-list, .no-products-found {
  text-align: center;
  padding: 20px 0;
  color: #ffffff;
  font-style: italic;
}

/* Gaya Spinner */
.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #007bff;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin: 10px auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
