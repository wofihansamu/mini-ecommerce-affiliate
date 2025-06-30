import { createApp } from 'vue'; // Mengimpor fungsi createApp dari Vue 3
import App from './App.vue';    // Mengimpor komponen utama App.vue
import router from './router';  // Mengimpor konfigurasi router yang telah dibuat

router.afterEach((to) => { // Hook setelah setiap navigasi rute
  document.title = to.meta.title || "Petra's Store"; // Atur judul halaman
});

// Membuat instance aplikasi Vue
// dan memasangkannya (mount) ke elemen dengan id "app" di public/index.html
createApp(App)
  .use(router) // Menggunakan Vue Router di aplikasi
  .mount('#app');