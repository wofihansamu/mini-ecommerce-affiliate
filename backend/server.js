// backend/server.js
// server.js
require("dotenv").config()
const env = process.env
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mysql2 = require('mysql2')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const path = require('path')

const toSource = new URL(env.MYSQL_DB_URI);
const poolMiddleWare = mysql2.createPool({
  host: toSource.hostname,
  port: toSource.port,
  user: toSource.username,
  password: toSource.password,
  database: toSource.pathname.substring(1),
  waitForConnections: true,
  multipleStatements: true,
  enableKeepAlive: false, 
  maxIdle: 2,
  idleTimeout: 30000, 
  connectTimeout: 60000,
  connectionLimit: 20, 
  queueLimit: 0
});

function expressDb(req, res, next){
  req.db = poolMiddleWare.promise();
  next();
}

const limiter = rateLimit({
	windowMs: 10 * 1000, //in  second
	max: 200, // Limit each IP to requests per `window` 
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

const app = express();
app.use(cors());
app.use(expressDb);
app.use(express.static('public'));
app.use(limiter)
app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(helmet())
app.use(express.json({limit: '5mb'}));
app.use(express.urlencoded({extended: true, limit: '5mb'}));

app.get('/api/product', async (req, res) => {
  try {
    const [lists] = await req.db.query(`select * from list_item order by id desc`);
    res.json(lists);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: error.message || 'Terjadi kesalahan saat memproses permintaan'
    });
  }
});

app.post('/api/product', async (req, res) => {
  try {
    const item = req.body.item
    await req.db.query(`insert into list_item (name, description, imageUrl, affiliateLink) values (?,?,?,?)`,[
      item.name,
      item.description,
      item.imageUrl,
      item.affiliateLink
    ])
    res.send('Product Berhasil ditambah')
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: error.message || 'Terjadi kesalahan saat memproses permintaan'
    });
  }
});
app.delete('/api/product/:id', async (req, res) => {
  try {
    await req.db.query(`delete from list_item where id=?`,[
      req.params.id
    ])
    res.send('Product Berhasil Dihapus')
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: error.message || 'Terjadi kesalahan saat memproses permintaan'
    });
  }
});
app.put('/api/product', async (req, res) => {
  try {
    const item = req.body.item
    await req.db.query(`update list_item set name=?, description=?, imageUrl=?, affiliateLink=? where id=?`,[
      item.name,
      item.description,
      item.imageUrl,
      item.affiliateLink,
      item.id
    ])
    res.send('Product Berhasil diUpdate')
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: error.message || 'Terjadi kesalahan saat memproses permintaan'
    });
  }
});

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

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
}); 

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`)
})

process.on('SIGINT', ()=>{
	server.close(() => {
		console.log('HTTP server closed')
		process.exit()
	})
})

process.on('SIGTERM', ()=>{
	server.close(() => {
		console.log('HTTP server closed')
		process.exit()
	})
})