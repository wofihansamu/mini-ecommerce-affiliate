<template>
  <div class="product-card">
    <a :href="product.affiliateLink" target="_blank" rel="noopener noreferrer">
      <!-- ID Product sebagai Lingkaran di Pojok Kiri Atas -->
      <div class="product-id-badge">{{ product.id }}</div>

      <div v-if="product.imageUrl" class="product-image-container">
        <!-- Lazy Load Image: Gunakan v-if dan dynamic src -->
        <img
          :src="product.imageUrl"
          :alt="product.name"
          class="product-image"
        />
        <div v-if="!isImageLoaded" class="image-loading-placeholder">
            <!-- Placeholder saat gambar sedang dimuat -->
            <div class="mini-spinner"></div>
        </div>
      </div>
      <div class="product-info">
        <h3 class="product-name">{{ product.name }}</h3>
        <p class="product-description">{{ product.description }}</p>
        <button class="buy-button">Beli Sekarang</button>
      </div>
    </a>
  </div>
</template>

<script>
export default {
  name: 'ProductCard',
  props: {
    product: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      isImageLoaded: false, // Status apakah gambar sudah dimuat
      observer: null        // Intersection Observer instance for image
    };
  },
  mounted() {
    this.$nextTick(() => {
      // Hanya observasi jika ada imageUrl
      if (this.product.imageUrl) {
        this.setupImageIntersectionObserver();
      } else {
        // Jika tidak ada gambar, set isImageLoaded true agar placeholder no-image tampil
        this.isImageLoaded = true;
      }
    });
  },
  beforeUnmount() {
    // Hentikan observer saat komponen dihancurkan
    if (this.observer) {
      this.observer.disconnect();
    }
  },
  methods: {
    setupImageIntersectionObserver() {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.isImageLoaded = true; // Set true untuk memicu pemuatan gambar
            this.observer.unobserve(entry.target); // Hentikan observasi setelah gambar dimuat
          }
        });
      }, {
        root: null, // viewport sebagai root
        rootMargin: '100px', // Memuat gambar saat 100px mendekati viewport
        threshold: 0 // Memuat segera setelah elemen terlihat
      });

      // Amati elemen image container
      const imageContainer = this.$el.querySelector('.product-image-container');
      if (imageContainer) {
        this.observer.observe(imageContainer);
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.product-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  position: relative;

  a {
    display: flex;
    flex-direction: column;
    text-decoration: none;
    color: inherit;
    height: 100%;
  }

  .product-id-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background-color: #007bff;
    color: white;
    border-radius: 15px;
    padding: 5px 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.7em;
    font-weight: bold;
    z-index: 10;
    min-width: 25px;
    box-sizing: border-box;
    text-align: center;
    white-space: nowrap;
  }

  .product-image-container {
    width: 100%;
    height: 150px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f0f0f0;
    border-bottom: 1px solid #eee;

    .product-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .no-image-placeholder {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      background-color: #f8f8f8;
      color: #999;
      font-style: italic;
      text-align: center;
      padding: 10px;
    }

    /* Gaya untuk placeholder loading gambar */
    .image-loading-placeholder {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      background-color: #e9e9e9; /* Warna abu-abu saat loading */
    }

    /* Gaya Spinner kecil untuk gambar */
    .mini-spinner {
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-left-color: #666; /* Warna spinner */
      border-radius: 50%;
      width: 20px;
      height: 20px;
      animation: spin 1s linear infinite;
    }
  }

  .product-info {
    padding: 15px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;

    .product-name {
      font-size: 1.1em;
      margin-top: 0;
      margin-bottom: 5px;
      color: #333;
    }

    .product-description {
      font-size: 0.9em;
      color: #666;
      margin-bottom: 10px;
      flex-grow: 1;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .buy-button {
      background-color: #007bff;
      color: #fff;
      border: none;
      padding: 10px 15px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 0.9em;
      align-self: flex-start;
      margin-top: auto;
      width: 100%;
    }

    .buy-button:hover {
      background-color: #0056b3;
    }
  }
}

/* Keyframes untuk animasi spinner */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
