# Munchie's Restaurant & Ordering Platform 🍔

A modern, high-performance bilingual (Arabic RTL & English LTR) restaurant website and ordering platform built for **Munchie's** in Aswan, Egypt.

---

## 🚀 Features

### Customer Experience
- **Bilingual Interface**: Native Arabic (RTL) and English (LTR) with seamless instant language switching.
- **Brand Identity**: Modern Light visual design using Munchie's signature Purple (`#512080`) and Brand Yellow (`#FFDA35`).
- **Interactive Menu**: Authentic product catalog extracted from flyers — Burgers, Sandwiches, VIP Menu, Fat Burgers, Fries Cups/Conos, and Loaded Specialties.
- **Item Customization**: Bread selection (Kaiser, French, Tortilla, Fat Bun), extra toppings, cheeses, combo add-ons, and kitchen notes.
- **Persistent Cart**: Zustand store with localStorage persistence across page reloads and language toggles.
- **Streamlined Checkout (MVP)**:
  - Branch Pickup at Rose Garden in front of Al Raya - Corniche, Aswan.
  - Cash on Pickup payment model.
  - Nearest available preparation time (ASAP).
  - Clear "Under Construction" badge for delivery zones.
- **Real-Time Order Tracking**: Multi-step visual order progression with atomic cancellation rules (cancellation permitted before kitchen begins preparation).
- **Authentication**: Email/Password registration without mandatory phone OTP.

### Admin Dashboard (`/admin`)
- **Operational Queue**: Real-time incoming orders with Accept, Prepare, Ready, and Complete actions.
- **Catalog Management**: Product availability toggling, price tracking, and categories.
- **Operations & Working Hours**: Automatic weekly schedule (Africa/Cairo timezone) with manual emergency order-acceptance shutoff.
- **Security & Audit Log**: Traceable history of administrative decisions.

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4 + Custom Theme Design Tokens
- **Icons**: Lucide React
- **State Management**: Zustand with persistent storage
- **Localization**: react-i18next with RTL logical properties
- **Validation**: React Hook Form + Zod
- **Backend & Database**: Firebase Auth, Cloud Firestore, Cloud Storage, Cloud Functions
- **Notifications**: react-hot-toast

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local` and fill in your Firebase configuration keys:
```bash
cp .env.example .env.local
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```
Build output will be generated in `dist/` ready for Firebase Hosting.

---

## 📍 Branch Details
- **Location**: حديقة الورد أمام الراية – فرع الكورنيش، أسوان (Rose Garden in front of Al Raya - Corniche Branch, Aswan)
- **Phone**: 01025707026
- **Hours**: Daily 12:00 PM – 03:00 AM (Africa/Cairo)
