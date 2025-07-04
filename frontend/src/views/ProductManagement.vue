<template>
    <div class="product-management-page">
      <header class="management-header">
        <h1>Manajemen Produk</h1>
        <router-link to="/" class="back-to-store">Kembali ke Toko</router-link>
      </header>
  
      <div class="add-product-section card">
        <h2>Tambah Produk Baru</h2>
        <form class="product-form">
          <!-- <div class="form-group">
            <label for="newId">ID Produk:</label>
            <input type="number" id="newId" v-model.number="newProduct.id" required min="1"/>
          </div> -->
          <div class="form-group">
            <label for="newAffiliateLink">Link Afiliasi:</label>
            <input autocomplete="off" type="url" id="newAffiliateLink" v-model="newProduct.affiliateLink" required />
            <button class="btn btn-primary m-1" @click="getLinkPreview">Get Auto</button>
          </div>
          <div class="form-group">
            <label for="newName">Nama Produk:</label>
            <input autocomplete="off" type="text" id="newName" v-model="newProduct.name" required />
          </div>
          <div class="form-group">
            <label for="newDescription">Deskripsi:</label>
            <textarea id="newDescription" v-model="newProduct.description" required></textarea>
          </div>
          <div class="form-group">
            <label for="newImageUrl">URL Gambar (Opsional):</label>
            <input autocomplete="off" type="url" id="newImageUrl" v-model="newProduct.imageUrl" />
          </div>
          
          <button @click="addProduct" class="btn btn-primary">Tambah Produk</button>
        </form>
      </div>
  
      <div class="product-list-management-section card">
        <h2>Daftar Produk</h2>
        <p v-if="products.length === 0 && !isLoading">Tidak ada produk untuk dikelola.</p>
        <div v-else class="product-management-grid">
          <div v-for="product in products" :key="product.id" class="product-management-item">
            <div class="item-id-badge">{{ product.id }}</div>
            <img
              v-if="product.imageUrl"
              :src="product.imageUrl"
              :alt="product.name"
              class="item-image"
            />
            <div v-else class="item-no-image-placeholder">No Image</div>
            <div class="item-info">
              <h3>{{ product.name }}</h3>
              <p>{{ product.description }}</p>
              <div class="item-actions">
                <button @click="editProduct(product)" class="btn btn-secondary">Edit</button>
                <button @click="confirmDelete(product.id)" class="btn btn-danger">Hapus</button>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Edit Product Modal -->
      <div v-if="showEditModal" class="modal-overlay">
        <div class="modal-content">
          <h2>Edit Produk</h2>
          <form @submit.prevent="updateProduct" class="product-form">
            <!-- <div class="form-group">
              <label for="editId">ID Produk:</label>
              <input type="number" id="editId" v-model.number="editingProduct.id" required readonly />
            </div> -->
            <div class="form-group">
              <label for="editName">Nama Produk:</label>
              <input type="text" id="editName" v-model="editingProduct.name" required />
            </div>
            <div class="form-group">
              <label for="editDescription">Deskripsi:</label>
              <textarea id="editDescription" v-model="editingProduct.description" required></textarea>
            </div>
            <div class="form-group">
              <label for="editImageUrl">URL Gambar (Opsional):</label>
              <input type="url" id="editImageUrl" v-model="editingProduct.imageUrl" />
            </div>
            <div class="form-group">
              <label for="editAffiliateLink">Link Afiliasi:</label>
              <input type="url" id="editAffiliateLink" v-model="editingProduct.affiliateLink" required />
            </div>
            <div class="modal-actions">
              <button type="submit" class="btn btn-primary">Simpan Perubahan</button>
              <button type="button" @click="cancelEdit" class="btn btn-secondary">Batal</button>
            </div>
          </form>
        </div>
      </div>
  
      <!-- Confirmation Dialog for Delete -->
      <div v-if="showConfirmDialog" class="modal-overlay">
        <div class="modal-content small-modal">
          <h2>Konfirmasi Hapus</h2>
          <p>Anda yakin ingin menghapus produk ini?</p>
          <div class="modal-actions">
            <button @click="deleteProduct" class="btn btn-danger">Ya, Hapus</button>
            <button @click="cancelDelete" class="btn btn-secondary">Batal</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios'
  export default {
    name: 'ProductManagement',
    data() {
      return {
        apiUrl : window.api_server,
        products: [], // Daftar produk yang dikelola
        newProduct: {
          name: '',
          description: '',
          imageUrl: '',
          imageOthers: [],
          affiliateLink: ''
        },
        editingProduct: null, // Produk yang sedang diedit
        showEditModal: false, // Kontrol tampilan modal edit
        showConfirmDialog: false, // Kontrol tampilan dialog konfirmasi hapus
        productIdToDelete: null, // ID produk yang akan dihapus
        isLoading: false // Status loading
      };
    },
    mounted() {
      this.fetchProducts();
    },
    methods: {
      async getShopeePreviewBrowser(url) {
        // Gunakan CORS proxy untuk menghindari blokiran
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        
        // Dapatkan URL lengkap
        const fullUrl = await fetch('api/shopee-preview?url='+url, { redirect: 'manual' })
          .then(res => res.headers.get('location'));
        
        // Ekstrak IDs
        const ids = fullUrl.match(/i\.(\d+)\.(\d+)/);
        
        // Ambil data produk
        const apiUrl = `${proxyUrl}https://shopee.co.id/api/v4/item/get?itemid=${ids[2]}&shopid=${ids[1]}`;
        
        const response = await fetch(apiUrl, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': fullUrl
          }
        });
        
        const data = await response.json();
        
        return {
          name: data.data.name,
          description: data.data.description,
          mainImage: `https://cf.shopee.co.id/file/${data.data.image}`,
          images: data.data.images?.map(img => `https://cf.shopee.co.id/file/${img}`)
        };
      },
      async getLinkPreview() {
        const shortUrl = this.newProduct.affiliateLink
          axios.get(this.apiUrl + '/api/shopee-preview?url='+shortUrl)
          .then(res=>{
            this.newProduct.name = res.data.name
            this.newProduct.description = res.data.description
            this.newProduct.imageUrl = `https://cf.shopee.co.id/file/${res.data.image}`
            this.newProduct.imageOthers = res.data.images?.map(img => `https://cf.shopee.co.id/file/${img}`)
          })
          .catch(err=>{
            console.error(err)
          })

      },
      async fetchProducts() {
        this.isLoading = true;
        try {
          const response = await fetch(this.apiUrl + '/api/product');
          if (!response.ok) {
            throw new Error('Failed to fetch products');
          }
          this.products = JSON.parse(JSON.stringify(await response.json()));
        } catch (error) {
          console.error('Error fetching products:', error);
        } finally {
          this.isLoading = false;
        }
      },
      addProduct() {
        if (!this.newProduct.name || !this.newProduct.description || !this.newProduct.affiliateLink) {
          alert('Mohon lengkapi semua bidang yang wajib diisi.');
          return;
        }
        axios.post(this.apiUrl + '/api/product',{
          item: this.newProduct
        }).then(res=>{
          this.products.push({ ...this.newProduct });
          this.resetNewProductForm();
          alert(res.data);
          this.fetchProducts();
          })
          .catch(err=>{
            console.error(err)
            alert(err.message);
          })
        
      },
      editProduct(product) {
        // Membuat salinan produk untuk diedit agar tidak langsung mengubah data asli
        this.editingProduct = { ...product };
        this.showEditModal = true;
      },
      updateProduct() {
        if (!this.editingProduct.name || !this.editingProduct.description || !this.editingProduct.affiliateLink) {
          alert('Mohon lengkapi semua bidang yang wajib diisi.');
          return;
        }
        axios.put(this.apiUrl + '/api/product',{
          item: this.editingProduct
        }).then(res=>{
            const index = this.products.findIndex(p => p.id === this.editingProduct.id);
            this.products.splice(index, 1, { ...this.editingProduct }); // Ganti produk lama dengan yang baru
            this.showEditModal = false;
            this.editingProduct = null;
            alert(res.data);
          })
          .catch(err=>{
            console.error(err)
            alert(err.message);
          })
      },
      confirmDelete(id) {
        this.productIdToDelete = id;
        this.showConfirmDialog = true;
      },
      deleteProduct() {
        axios.delete(this.apiUrl + '/api/product/'+this.productIdToDelete)
          .then(res=>{
            this.showConfirmDialog = false;
            this.productIdToDelete = null;
            alert(res.data);
            this.fetchProducts();
          })
          .catch(err=>{
            console.error(err)
            alert(err.message);
          })
      },
      cancelEdit() {
        this.showEditModal = false;
        this.editingProduct = null;
      },
      cancelDelete() {
        this.showConfirmDialog = false;
        this.productIdToDelete = null;
      },
      resetNewProductForm() {
        this.newProduct = {
          name: '',
          description: '',
          imageUrl: '',
          affiliateLink: '',
          imageOthers: []
        };
      }
    }
  };
  </script>
  
  <style lang="scss" scoped>
  .product-management-page {
    padding: 15px;
    max-width: 800px; /* Lebih lebar dari product list untuk manajemen */
    margin: 0 auto;
  }
  
  .management-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
  
    h1 {
      color: #ffffff;
      font-size: 2em;
      margin: 0;
    }
  
    .back-to-store {
      background-color: #28a745;
      color: white;
      padding: 8px 15px;
      border-radius: 5px;
      text-decoration: none;
      font-size: 0.9em;
      &:hover {
        background-color: #218838;
      }
    }
  }
  
  .card {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 20px;
    margin-bottom: 25px;
  
    h2 {
      color: #333;
      margin-top: 0;
      margin-bottom: 20px;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
  }
  
  .product-form {
    .form-group {
      margin-bottom: 15px;
      label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
        color: #555;
      }
      input[type="text"],
      input[type="number"],
      input[type="url"],
      textarea {
        width: calc(100% - 22px); /* Adjust for padding and border */
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 5px;
        font-size: 1em;
      }
      textarea {
        resize: vertical;
        min-height: 80px;
      }
    }
  }
  
  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
    transition: background-color 0.2s ease;
    margin-right: 10px; /* Spasi antar tombol */
    &:last-child {
      margin-right: 0;
    }
  }
  
  .btn-primary {
    background-color: #007bff;
    color: white;
    &:hover {
      background-color: #0056b3;
    }
  }
  
  .btn-secondary {
    background-color: #6c757d;
    color: white;
    &:hover {
      background-color: #5a6268;
    }
  }
  
  .btn-danger {
    background-color: #dc3545;
    color: white;
    &:hover {
      background-color: #c82333;
    }
  }
  
  .product-management-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
  }
  
  .product-management-item {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    background-color: #fdfdfd;
    display: flex;
    flex-direction: column;
    position: relative;
    padding-bottom: 10px; /* Ruang untuk tombol aksi */
  
    .item-id-badge {
      position: absolute;
      top: 10px;
      left: 10px; // ID badge di kiri
      background-color: #6f42c1; /* Warna badge berbeda untuk manajemen */
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
  
    .item-image {
      width: 100%;
      height: 120px; /* Lebih kecil dari kartu produk utama */
      object-fit: cover;
      border-bottom: 1px solid #eee;
    }
    .item-no-image-placeholder {
      width: 100%;
      height: 120px;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #f0f0f0;
      color: #aaa;
      font-style: italic;
      border-bottom: 1px solid #eee;
    }
  
    .item-info {
      padding: 10px 15px;
      h3 {
        font-size: 1.1em;
        margin-top: 0;
        margin-bottom: 5px;
        color: #333;
      }
      p {
        font-size: 0.8em;
        color: #666;
        margin-bottom: 10px;
        display: -webkit-box;
        -webkit-line-clamp: 2; /* Batasi deskripsi */
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  
    .item-actions {
      display: flex;
      justify-content: flex-end; /* Posisikan tombol di kanan bawah */
      padding: 0 15px 10px;
      gap: 10px; /* Jarak antar tombol */
      margin-top: auto; /* Dorong tombol ke bawah */
    }
  }
  
  /* Modal Styling */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000; /* Pastikan di atas semua konten lain */
  }
  
  .modal-content {
    background-color: #fff;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 90%;
    h2 {
      margin-top: 0;
      margin-bottom: 20px;
      color: #333;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
  }
  
  .modal-content.small-modal {
      max-width: 400px;
      text-align: center;
      p {
          margin-bottom: 20px;
      }
  }
  
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    gap: 10px;
  }
  </style>
  