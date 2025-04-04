# Ezan Vakfı - Admin Panel

Bu Node.js loyihasi, Ezan Vakfı veb-sayti uchun admin panel yaratadi. Tizim orqali yangiliklar, galereya va boshqa ma'lumotlarni qo'shish, o'zgartirish va o'chirishni osonlashtiradi.

## Texnologiyalar

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: Passport.js
- **Template Engine**: EJS
- **File Uploads**: Multer
- **UI Framework**: AdminLTE 3, Bootstrap 4

## O'rnatish

1. Loyihani klonlash:
```bash
git clone <repo_url>
cd ezan-vakfi
```

2. Kerakli paketlarni o'rnatish:
```bash
npm install
```

3. `.env` faylini sozlang (namunasi `.env.example`):
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ezan-vakfi
SESSION_SECRET=your-secret-key
NODE_ENV=development
```

4. MongoDB serveringiz ishga tushganiga ishonch hosil qiling.

5. Dastlabki administrator yaratish:
```bash
npm run create-admin
```

6. Serverni ishga tushirish:
```bash
npm run dev
```

## Asosiy funksiyalar

- Foydalanuvchi boshqaruvi (admin/editor rollari)
- Yangiliklar qo'shish, tahrirlash va o'chirish
- Galereya boshqaruvi
- Loyihalar boshqaruvi
- Fayl yuklash

## API Nuqtalari

API REST API formatida mavjud:

- `/api/news` - Yangiliklar ro'yxati
- `/api/news/:slug` - Alohida yangilik
- `/api/gallery` - Galereya ro'yxati
- `/api/gallery/:id` - Alohida galereya
- `/api/projects` - Loyihalar ro'yxati
- `/api/projects/:slug` - Alohida loyiha
- `/api/search?q=query` - Qidiruv

## Litsenziya

MIT 