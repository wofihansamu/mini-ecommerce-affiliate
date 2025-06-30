const express = require('express');
const axios = require('axios'); // Untuk membuat permintaan HTTP ke URL eksternal
const cheerio = require('cheerio'); // Untuk parsing HTML (seperti jQuery untuk server-side)
const cors = require('cors'); // Untuk mengizinkan permintaan dari frontend Vue Anda

const app = express();
const PORT = process.env.PORT || 3000; // Port default 3000

// Middleware
app.use(cors()); // Izinkan semua permintaan lintas domain (untuk pengembangan)
app.use(express.json()); // Izinkan parsing JSON untuk request body

// Endpoint untuk mendapatkan pratinjau link
app.post('/api/preview-link', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Lakukan permintaan HTTP ke URL yang diberikan
    const { data } = await axios.get(url, {
      timeout: 5000, // Timeout setelah 5 detik
      headers: {
        // Penting: Beberapa situs mungkin memblokir user-agent default axios.
        // Meniru browser bisa membantu.
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // Parsing HTML menggunakan Cheerio
    const $ = cheerio.load(data);

    // Ekstrak metadata
    const title = $('head title').text() || $('meta[property="og:title"]').attr('content') || $('meta[name="twitter:title"]').attr('content') || '';
    const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || $('meta[name="twitter:description"]').attr('content') || '';
    const imageUrl = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || '';
    const siteName = $('meta[property="og:site_name"]').attr('content') || '';
    const favicon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || '';

    // Bentuk URL gambar dan favicon menjadi absolut jika relatif
    function getAbsoluteUrl(baseUrl, relativeUrl) {
      if (!relativeUrl) return '';
      try {
        return new URL(relativeUrl, baseUrl).href;
      } catch (e) {
        return relativeUrl; // Jika gagal, kembalikan URL asli
      }
    }

    const absoluteImageUrl = getAbsoluteUrl(url, imageUrl);
    const absoluteFavicon = getAbsoluteUrl(url, favicon);


    res.json({
      title: title.trim(),
      description: description.trim(),
      imageUrl: absoluteImageUrl.trim(),
      siteName: siteName.trim(),
      favicon: absoluteFavicon.trim(),
      originalUrl: url
    });

  } catch (error) {
    console.error('Error fetching or parsing URL:', error.message);
    let errorMessage = 'Failed to fetch link preview.';
    if (error.response && error.response.status === 404) {
      errorMessage = 'Link not found (404).';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timed out.';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Invalid domain or network issue.';
    }
    res.status(500).json({ error: errorMessage, details: error.message });
  }
});

// Mulai server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});