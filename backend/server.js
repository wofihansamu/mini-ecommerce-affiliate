// backend/server.js
// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static('public'));

app.get('/api/shopee-preview', async (req, res) => {
  try {
    const shortUrl = req.query.url;
    
    // 1. Handle semua jenis redirect (301 dan 302)
    const getRedirectUrl = async (url) => {
      try {
        const response = await axios.head(url, {
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 400
        });
        return response.headers.location;
      } catch (error) {
        if (error.response && error.response.headers.location) {
          return error.response.headers.location;
        }
        throw error;
      }
    };

    // 2. Dapatkan URL lengkap
    const fullUrl = await getRedirectUrl(shortUrl);
    
    // 3. Ekstrak ID produk dengan pola yang lebih komprehensif
    const urlPatterns = [
      /i\.(\d+)\.(\d+)/, // Format lama
      /-i\.(\d+)\.(\d+)\?/, // Format baru dengan query string
      /product\/(\d+)\/(\d+)/, // Format alternatif
      /item\/(\d+)\/(\d+)/ // Format lainnya
    ];

    let shopId, productId;
    for (const pattern of urlPatterns) {
      const match = fullUrl.match(pattern);
      if (match) {
        shopId = match[1];
        productId = match[2];
        break;
      }
    }

    if (!shopId || !productId) {
      throw new Error('Tidak dapat mengekstrak ID produk dari URL');
    }

    // 4. Dapatkan data produk dari API Shopee
    const apiUrl = `https://shopee.co.id/api/v4/item/get?itemid=${productId}&shopid=${shopId}`;
    const apiResponse = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Referer': fullUrl,
        'Accept': 'application/json',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 5000
    });

    // 5. Validasi respons API
    if (!apiResponse.data || !apiResponse.data.data) {
      throw new Error('Respons API Shopee tidak valid');
    }

    const productData = apiResponse.data.data;
    
    // 6. Format respons
    const result = {
      name: productData.name,
      description: productData.description,
      mainImage: `https://cf.shopee.co.id/file/${productData.image}`,
      images: productData.images.map(img => `https://cf.shopee.co.id/file/${img}`),
      price: productData.price / 100000,
      rating: productData.item_rating?.rating_star || 0,
      shopName: productData.shop_name || ''
    };

    res.json(result);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: error.message || 'Terjadi kesalahan saat memproses permintaan'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));