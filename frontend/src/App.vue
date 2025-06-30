<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style lang="scss">
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #333; /* Warna teks default */
  min-height: 100vh; /* Pastikan background mencakup seluruh tinggi viewport */

  /* --- Gradasi Warna Oranye dan Hijau --- */
  background: linear-gradient(to right, #834ceb, #930ee0); /* Oranye ke Hijau Muda */
  /* Anda bisa mencoba arah lain, contoh:
     background: linear-gradient(to bottom, #FFA500, #90EE90);
     background: linear-gradient(45deg, #FFA500, #90EE90);
  */
  /* Atau gunakan kode hex warna yang berbeda untuk oranye/hijau yang lebih spesifik:
     background: linear-gradient(to right, #FF8C00, #3CB371); // DarkOrange ke MediumSeaGreen
  */
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>