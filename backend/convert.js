// Import modul fs untuk membaca dan menulis file, dan cheerio untuk parsing HTML
const fs = require('fs');
const cheerio = require('cheerio');

// Nama file HTML input yang akan diproses
const htmlFilePath = 'Report Belum Kirim DT-01-07-25-0505.html'; // Menggunakan nama file asli
// Nama file HTML output yang akan dibuat
const outputHtmlFilePath = 'summary_report.html';

/**
 * Mengonversi status teks dari tabel Fresh/Bakery/Loyalty menjadi simbol silang (✗) atau string kosong.
 * Berdasarkan interpretasi gambar, ✗ berarti 'BELUM KIRIM', string kosong berarti 'SUDAH TERSEDIA' atau tidak ada.
 * @param {string} statusText - Teks status dari tabel HTML (Fresh/Bakery/Loyalty).
 * @returns {string} Simbol ✗ (belum kirim) atau string kosong (sudah kirim).
 */
function getDeliveryStatusIcon(statusText) {
    // Jika statusnya 'FILE DT BELUM KIRIM', berarti belum terkirim
    if (statusText === 'FILE DT BELUM KIRIM') {
        return '✗'; // Silang berarti 'BELUM KIRIM'
    }
    // Untuk status lain (seperti 'FILE DT SUDAH TERSEDIA' atau kosong), berarti sudah terkirim atau tidak relevan
    return ''; // String kosong berarti 'SUDAH TERSEDIA' atau tidak ada data
}

/**
 * Mengonversi status teks dari tabel "Belum Approve" menjadi simbol '⚠️' atau string kosong.
 * '⚠️' berarti 'BELUM APPROVE', string kosong berarti sudah approve atau tidak ada data.
 * @param {string} statusText - Teks status dari kolom Fresh/Bakery/Loyalty di tabel "Belum Approve".
 * @returns {string} Simbol '⚠️' atau string kosong.
 */
function getApprovalStatusIcon(statusText) {
    if (statusText === 'BELUM APPROVE') {
        return '⚠️'; // '⚠️' berarti 'BELUM APPROVE'
    }
    return ''; // String kosong untuk sudah disetujui atau tidak ada data
}

/**
 * Fungsi utama untuk memproses file HTML dan menghasilkan ringkasan dalam bentuk file HTML.
 */
async function processHtmlReport() {
    try {
        // Membaca konten file HTML input
        const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

        // Memuat konten HTML ke cheerio untuk parsing
        const $ = cheerio.load(htmlContent);

        // Map untuk menyimpan data gabungan (pengiriman DT dan persetujuan)
        // Kunci adalah nomor STORE, nilai adalah objek yang berisi status pengiriman dan persetujuan
        const combinedReportData = new Map();

        // --- Fungsi pembantu untuk memproses tabel kategori pengiriman DT ---
        /**
         * Memproses tabel untuk kategori pengiriman DT tertentu dan memperbarui data toko.
         * @param {string} sectionId - ID bagian HTML yang berisi tabel (misal: '#content1' untuk Fresh).
         * @param {string} categoryKey - Kunci kategori dalam objek deliveryData (misal: 'fresh').
         */
        function processDeliveryCategoryTable(sectionId, categoryKey) {
            $(`${sectionId} .table-responsive tbody tr`).each((i, row) => {
                const store = $(row).find('td').eq(2).text().trim(); // Kolom STORE (indeks 2)
                const status = $(row).find('td').eq(5).text().trim(); // Kolom STATUS (indeks 5)

                if (store) {
                    // Inisialisasi data toko jika belum ada
                    if (!combinedReportData.has(store)) {
                        combinedReportData.set(store, {
                            delivery: { fresh: '', bakery: '', loyalty: '' }, // Default ke string kosong (sudah terkirim)
                            approval: { fresh: '', bakery: '', loyalty: '' } // Default ke string kosong (sudah disetujui)
                        });
                    }
                    // Perbarui status pengiriman untuk kategori ini
                    combinedReportData.get(store).delivery[categoryKey] = getDeliveryStatusIcon(status);
                }
            });
        }

        // --- Memproses setiap kategori pengiriman DT ---
        console.log('Memproses data Fresh...');
        processDeliveryCategoryTable('#content1', 'fresh'); // Fresh
        console.log('Memproses data Bakery...');
        processDeliveryCategoryTable('#content2', 'bakery'); // Bakery
        console.log('Memproses data Loyalty...');
        processDeliveryCategoryTable('#content3', 'loyalty'); // Loyalty

        // --- Memproses tabel "Belum Approve" ---
        console.log('Memproses data Belum Approve...');
        $('#content5 .table-responsive tbody tr').each((i, row) => {
            const store = $(row).find('td').eq(1).text().trim(); // Kolom STORE (indeks 1)
            const freshStatus = $(row).find('td').eq(3).text().trim(); // Kolom FRESH (indeks 3)
            const bakeryStatus = $(row).find('td').eq(4).text().trim(); // Kolom BAKERY (indeks 4)
            const loyaltyStatus = $(row).find('td').eq(5).text().trim(); // Kolom LOYALTY (indeks 5)

            if (store) {
                // Inisialisasi data toko jika belum ada (jika toko hanya ada di tabel approve)
                if (!combinedReportData.has(store)) {
                    combinedReportData.set(store, {
                        delivery: { fresh: '', bakery: '', loyalty: '' },
                        approval: { fresh: '', bakery: '', loyalty: '' }
                    });
                }
                // Perbarui status persetujuan untuk kategori ini
                combinedReportData.get(store).approval.fresh = getApprovalStatusIcon(freshStatus);
                combinedReportData.get(store).approval.bakery = getApprovalStatusIcon(bakeryStatus);
                combinedReportData.get(store).approval.loyalty = getApprovalStatusIcon(loyaltyStatus);
            }
        });

        // Mengurutkan semua nomor STORE yang unik
        const sortedStores = Array.from(combinedReportData.keys()).sort((a, b) => parseInt(a) - parseInt(b));

        // Ekstrak tanggal dan jam dari nama file
        const dateMatch = htmlFilePath.match(/DT-(\d{2}-\d{2}-\d{2})/);
        const timeMatch = htmlFilePath.match(/-(\d{4})\.html/);
        const reportDate = dateMatch ? dateMatch[1] : 'Unknown Date';
        let reportTime = 'Unknown Time';
        if (timeMatch && timeMatch[1]) {
            const rawTime = timeMatch[1];
            if (rawTime.length === 4) {
                reportTime = `${rawTime.substring(0, 2)}.${rawTime.substring(2, 4)}`;
            }
        }

        // --- Membangun string HTML untuk output ---
        let htmlOutput = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ringkasan Status DT & Approval</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #f3f4f6;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            padding: 30px;
            max-width: 600px; /* Lebar disesuaikan untuk 3 kolom */
            width: 100%;
            margin-bottom: 30px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #e5e7eb;
            padding: 12px 15px;
            text-align: left;
        }
        th {
            background-color: #f9fafb;
            font-weight: 700;
            color: #374151;
        }
        tr:nth-child(even) {
            background-color: #f9fafb;
        }
        .crossmark {
            color: #ef4444; /* Merah untuk silang (belum kirim) */
            font-weight: bold;
        }
        .approval-pending {
            color: #f59e0b; /* Amber/Oranye untuk '⚠️' (belum approve) */
            font-weight: bold;
        }
        .checkmark {
            color: #10b981; /* Hijau untuk centang (sudah upload & approve) */
            font-weight: bold;
        }
        .text-center {
            text-align: center;
        }
        .legend {
            margin-top: 20px;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            font-size: 0.9em;
            color: #4a5568;
        }
        .legend p {
            margin-bottom: 5px;
        }
        .legend p:last-child {
            margin-bottom: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Ringkasan Status DT & Approval</h1>
        <div class="legend">
            <h3 class="text-lg font-semibold text-gray-700 mb-2">Cara Membaca Simbol:</h3>
            <p><span class="crossmark">✗</span> : File DT Belum Diunggah</p>
            <p><span class="approval-pending">⚠️</span> : File DT Sudah Diunggah, Belum Disetujui</p>
            <p><span class="checkmark">✓</span> : File DT Sudah Diunggah & Sudah Disetujui</p>
        </div>
        <p class="text-gray-600 mb-6">AS OF ${reportTime} WIB (${reportDate})</p>
        
        <div class="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">STORE</th>
                        <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">BAKERY</th>
                        <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">FRESH</th>
                        <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">LOYALTY</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
        `;

        // Baris data untuk laporan gabungan
        sortedStores.forEach(store => {
            const data = combinedReportData.get(store);
            const delivery = data.delivery;
            const approval = data.approval;

            // Fungsi untuk menentukan status gabungan dan simbol
            const getCombinedStatus = (deliveryStatus, approvalStatus) => {
                if (deliveryStatus === '✗') { // Jika file belum diunggah
                    return `<span class="crossmark">✗</span>`; // Belum Upload
                } else if (approvalStatus === '⚠️') { // Jika sudah diunggah tapi belum di-approve
                    return `<span class="approval-pending">⚠️</span>`; // Belum Approve
                } else { // Jika sudah diunggah dan sudah di-approve
                    return `<span class="checkmark">✓</span>`; // Sudah Upload & Sudah Approve
                }
            };

            const bakeryCombinedStatus = getCombinedStatus(delivery.bakery, approval.bakery);
            const freshCombinedStatus = getCombinedStatus(delivery.fresh, approval.fresh);
            const loyaltyCombinedStatus = getCombinedStatus(delivery.loyalty, approval.loyalty);

            htmlOutput += `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${store}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">${bakeryCombinedStatus}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">${freshCombinedStatus}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">${loyaltyCombinedStatus}</td>
                    </tr>
            `;
        });

        htmlOutput += `
                </tbody>
            </table>
        </div>
        
    </div>
</body>
</html>
        `;

        // Menulis string HTML ke file output
        fs.writeFileSync(outputHtmlFilePath, htmlOutput, 'utf8');
        console.log(`Proses selesai. Laporan HTML telah disimpan ke: ${outputHtmlFilePath}`);

    } catch (error) {
        console.error('Terjadi kesalahan saat memproses file HTML:', error);
    }
}

// Menjalankan fungsi utama
processHtmlReport();
