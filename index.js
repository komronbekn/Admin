const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Tasvir modeli
const Image = require('./models/Image');

// Ilovani yaratish
const app = express();
const PORT = 5000;

// CORS ni yoqish
app.use(cors());
app.use(express.json());

// MongoDB bilan ulanish
mongoose.connect('mongodb+srv://nurdullaevkomron0:komron_2010@image.bnz6f.mongodb.net/?retryWrites=true&w=majority&appName=Image', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB ulanish muvaffaqiyatli'))
  .catch((err) => console.error('MongoDB ulanishda xatolik:', err));

// Multer konfiguratsiyasi (video va tasvir)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// Fayl turini tekshirish
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4', 'video/webm'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Faylni qabul qilish
  } else {
    cb(new Error('Fayl turi qo\'llab-quvvatlanmaydi'), false); // Xatolik
  }
};

const upload = multer({ storage, fileFilter });

// Tasvir va video yuklash endpoint
// Fayl yuklash endpointi
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Fayl yuklanmadi' });
  }

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  const fileNameFromClient = req.body.filename || req.file.originalname;  // Fayl nomini clientdan yoki faylni original nomidan olish

  try {
    const newFile = new Image({ url: fileUrl, filename: fileNameFromClient });
    await newFile.save();
    res.status(200).json({ url: fileUrl, filename: fileNameFromClient });  // Fayl URL va fayl nomini qaytarish
  } catch (error) {
    console.error('Faylni saqlashda xatolik:', error);
    res.status(500).json({ error: 'Faylni saqlashda xatolik' });
  }
});




// Fayllarni olish endpoint
app.get('/files', async (req, res) => {
  try {
    const files = await Image.find().select('url filename');  // faqat 'url' va 'filename'ni tanlash
    res.status(200).json(files);
  } catch (error) {
    console.error('Fayllarni olishda xatolik:', error);
    res.status(500).json({ error: 'Fayllarni olishda xatolik' });
  }
});


// Faylni ID bo'yicha olish
app.get('/files/:id', async (req, res) => {
  try {
    const file = await Image.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'Fayl topilmadi' });
    }
    res.status(200).json(file);
  } catch (error) {
    console.error('Faylni ID bo\'yicha olishda xatolik:', error);
    res.status(500).json({ error: 'Faylni olishda xatolik' });
  }
});

// Faylni yangilash (PUT)
app.put('/files/:id', upload.single('file'), async (req, res) => {
  try {
    const file = await Image.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'Fayl topilmadi' });
    }

    // Agar yangi fayl yuklangan bo'lsa, eski faylni o'chirish
    if (req.file) {
      const oldFilePath = path.join(__dirname, 'uploads', file.filename);
      fs.unlinkSync(oldFilePath);  // Faylni serverdan o'chirish

      const newFileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      file.url = newFileUrl;  // Fayl URL'ini yangilash
    }

    await file.save();
    res.status(200).json({ message: 'Fayl muvaffaqiyatli yangilandi' });
  } catch (error) {
    console.error('Faylni yangilashda xatolik:', error);
    res.status(500).json({ error: 'Faylni yangilashda xatolik' });
  }
});

// Faylni o'chirish (DELETE)
// Faylni o'chirish (DELETE)
app.delete('/files/:id', async (req, res) => {
  try {
    const file = await Image.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'Fayl topilmadi' });
    }

    console.log('Fayl topildi:', file);  // Debugging: log the entire file object to see its properties

    // Faylni serverdan o'chirish
    if (!file.filename) {
      console.error('Filename mavjud emas');  // Debugging: log if filename is missing
      return res.status(500).json({ error: 'Faylning filename maydoni yo\'q' });
    }

    const filePath = path.join(__dirname, 'uploads', file.filename);  // Ensure file.filename exists
    console.log('Faylni o\'chirish uchun yo\'l:', filePath);  // Debugging: log the file path

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Fayl muvaffaqiyatli o\'chirildi');  // Debugging: confirm deletion
    } else {
      console.log('Fayl mavjud emas: ', filePath);  // Debugging: log if file doesn't exist
    }

    // Faylni bazadan o'chirish
    await file.remove();
    res.status(200).json({ message: 'Fayl muvaffaqiyatli o\'chirildi' });
  } catch (error) {
    console.error('Faylni o\'chirishda xatolik:', error);
    res.status(500).json({ error: 'Faylni o\'chirishda xatolik' });
  }
});



// Fayllarni xizmat qilish
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serverni ishga tushirish
app.listen(PORT, () => {
  console.log(`Server ishlamoqda: http://localhost:${PORT}`);
});
