const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config(); // Untuk memuat variabel lingkungan dari file .env
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Mengambil API key dari .env
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Mengatur model generatif
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: "menggunakan bahasa indonesia yang interaktif dan berkarakter menenangkan dengan emoji dan tambahan seperti 'semangat ya!' dan kata kata yang yang positif dan ramah",
});

// Konfigurasi untuk model generatif
const generationConfig = {
  temperature: 2,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

// Fungsi utama untuk menghasilkan ayat sesuai emosi
async function generateAyat(emotion) {
  // Membaca file CSV secara lokal
  const filePath = path.join(__dirname, 'alquran.csv');
  const fileData = fs.readFileSync(filePath, 'utf-8'); // Membaca konten file CSV

  // Mengirim data CSV langsung ke model tanpa mengupload
  const chatSession = model.startChat({
    generationConfig,
    history: [
      {
        role: "user",
        parts: [
          { text: `kutiplah ayat yang relevan yang memberi motivasi ketika saya sedang ${emotion} beserta maknanya yang menenangkan dan relate dengan keadaan emosi. Ayatnya tidak boleh berulang dan harus bervariasi. Data ayat ada di file berikut: ${fileData}` },
        ],
      },
    ],
  });

  const result = await chatSession.sendMessage("INSERT_INPUT_HERE");
  return result.response.text();
}

// Inisiasi server Express
const app = express();

// Menyajikan file statis dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Route untuk API yang menerima parameter emosi
app.get('/generate', async (req, res) => {
  const emotion = req.query.emotion;
  try {
    const ayat = await generateAyat(emotion);
    console.log('Generated Ayat:', ayat); // Log hasil
    res.json({ ayat });
  } catch (error) {
    console.error('Error generating ayat:', error); // Log kesalahan
    res.status(500).json({ error: "Failed to generate ayat" });
  }
});

// Middleware untuk menangani 404 jika route tidak ditemukan
app.use((req, res) => {
  res.status(404).send('404: Not Found');
});

// Menjalankan server di port 3000
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
