import { createRouter, createWebHistory } from 'vue-router';
import ProductList from '../views/ProductList.vue';
import ProductManagement from '../views/ProductManagement.vue'; // Import komponen baru

const routes = [
  {
    path: '/',
    name: 'ProductList',
    component: ProductList
  },
  {
    path: '/manage-products', // Rute baru untuk manajemen produk
    name: 'ProductManagement',
    component: ProductManagement
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
