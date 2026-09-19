# ShanFa Admin Live — Mobile App (React Native / Expo)

Production Admin Mobile Companion & Real-Time Customer Tracking App.
- **Zero Dummy Data**: Fetches 100% live data directly from your MongoDB database through your Next.js backend.
- **Real-Time Sound Notifications**: 
  - **Cart Added**: Soft chime ping (`cart-added`)
  - **Checkout Visited**: Distinct "ling" alert (`checkout-entered`)
  - **New Order**: Cash register celebration chime + vibration pattern (`new-order`)
- **Admin Control From Mobile**:
  - Live Revenue and Order Status KPI counts
  - Full Order Management with 1-tap Status Update (`PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`)
  - Live Product Catalog with 1-tap Online/Offline Switch
  - Live Visitor Activity Stream
- **Minimal White Theme**: Clean Apple iOS / Material 3 white aesthetic (`#FFFFFF`, `#F8FAFC`, `#0F172A`).

---

## 🚀 How to Build Standalone Android APK (Google / Expo Cloud Build)

You do **NOT** need Android Studio or complex SDK setup installed on your computer. Expo Application Services (EAS) builds the `.apk` directly in the cloud!

### 1. Navigate to the mobile app folder:
```bash
cd mobile-app
```

### 2. Install dependencies:
```bash
npm install
```

### 3. Install EAS CLI (if not installed):
```bash
npm install -g eas-cli
```

### 4. Log in to your Expo account:
```bash
npx eas login
```
*(If you don't have an Expo account yet, you can create a free one at [expo.dev](https://expo.dev) in 30 seconds).*

### 5. Build your APK:
```bash
npx eas build -p android --profile preview
```

### 6. Install on Mobile:
- In ~3 to 5 minutes, EAS Cloud will output a **Download Link** and a **QR Code**.
- Open your phone's camera, scan the QR code or open the download URL.
- Tap **Download APK** and install directly on your Android phone!

---

## 🧪 Testing Locally (Expo Go)
If you want to run and test immediately on your phone without building an APK:
```bash
npm start
```
Scan the QR code in the terminal using the **Expo Go** app on Android or iOS.
