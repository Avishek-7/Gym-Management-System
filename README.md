# 🏋️ Gym Management System

A comprehensive, modern web application for managing gym operations, members, billing, diet plans, and more. Built with React, TypeScript, Firebase, and Tailwind CSS.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-12.2.1-FFCA28?logo=firebase)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Available Scripts](#-available-scripts)
- [User Roles](#-user-roles)
- [Key Features Breakdown](#-key-features-breakdown)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 👥 Member Management
- **User Selection**: Create member profiles from existing Firebase Auth users
- **Comprehensive Profiles**: Track personal info, emergency contacts, medical conditions
- **Package Assignment**: Link members to fee packages with expiry tracking
- **Status Management**: Active, inactive, and suspended member states
- **Search & Filter**: Quickly find members by name, email, or membership ID

### 💰 Billing & Payments
- **Bill Creation**: Generate itemized bills for members
- **Payment Tracking**: Record and manage payment history
- **Subscription Management**: Handle recurring membership subscriptions
- **Receipt Generation**: Auto-generate receipts for payments
- **Discount System**: Apply and track discounts on bills

### 🍎 Diet Management
- **Custom Diet Plans**: Create personalized meal plans for members
- **Meal Builder**: Design meals with detailed macros and food items
- **Diet Templates**: Save and reuse common diet plans
- **Progress Tracking**: Monitor member adherence to diet plans
- **Nutritional Analysis**: Track calories, protein, carbs, and fats

### 💊 Supplement Store
- **Inventory Management**: Track supplement stock levels
- **Sales Tracking**: Record supplement sales to members
- **Stock History**: Maintain detailed stock movement logs
- **Low Stock Alerts**: Get notified when inventory runs low
- **Category Management**: Organize supplements by type

### 📊 Analytics & Reports
- **Dashboard Analytics**: Real-time stats on revenue, members, and activity
- **Revenue Reports**: Track income from memberships and sales
- **Member Analytics**: Visualize membership trends and distribution
- **Payment Status**: Monitor pending and completed payments
- **Activity Tracking**: View gym check-in patterns

### 🔔 Notifications
- **Scheduled Notifications**: Auto-send notifications at specific times
- **Monthly Reminders**: Bulk notifications for membership renewals
- **Payment Reminders**: Alert members about due payments
- **Custom Templates**: Create reusable notification templates
- **Multi-channel**: Email and in-app notifications

### 🔐 Security & Access Control
- **Role-Based Access (RBAC)**: Admin, Trainer, and Member roles
- **Firebase Auth**: Secure authentication with email/password
- **Firestore Rules**: Granular security rules for data access
- **Approval Workflow**: Trainer role requires admin approval
- **Session Management**: Secure session handling and logout

### 🎨 UI/UX Features
- **Dark Theme**: Modern dark glass-morphism design
- **Responsive**: Works seamlessly on desktop, tablet, and mobile
- **Animated Components**: Smooth transitions and micro-interactions
- **Loading States**: Clear feedback during data operations
- **Toast Notifications**: User-friendly success/error messages

## 🛠 Tech Stack

### Frontend
- **React 19.1.1** - UI library
- **TypeScript 5.8.3** - Type-safe JavaScript
- **Vite 7.1.2** - Fast build tool and dev server
- **React Router DOM 7.9.1** - Client-side routing
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Framer Motion 12.23.16** - Animation library
- **Lucide React** - Icon library
- **Recharts 3.2.1** - Chart library for analytics

### Backend & Database
- **Firebase 12.2.1**
  - **Authentication** - User management
  - **Firestore** - NoSQL database
  - **Cloud Functions** - Serverless backend (optional)
  - **Storage** - File storage (optional)

### UI Components
- **Radix UI** - Accessible component primitives
  - Dialog, Select, Checkbox, Label
- **Shadcn/UI** - Pre-built component library
- **Class Variance Authority** - Component variant management
- **Tailwind Merge** - Conditional class merging

### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting
- **PostCSS & Autoprefixer** - CSS processing
- **React Hook Form 7.63.0** - Form management

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Firebase Account** (with a project set up)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Avishek-7/Gym-Management-System.git
   cd gym-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.com)
   - Enable **Authentication** (Email/Password)
   - Create a **Firestore Database**
   - Copy your Firebase config

4. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

5. **Deploy Firestore security rules**
   ```bash
   firebase login
   firebase init firestore
   firebase deploy --only firestore:rules
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

   The app will open at `http://localhost:5173`

## 📁 Project Structure

```
gym-management-system/
├── public/                      # Static assets
├── src/
│   ├── assets/                  # Images, icons
│   ├── components/
│   │   ├── admin/              # Admin-specific components
│   │   │   ├── DietDetailsModals.tsx
│   │   │   ├── MemberManagement.tsx
│   │   │   ├── SupplementStoreModals.tsx
│   │   │   └── ...
│   │   ├── auth/               # Authentication components
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── common/             # Shared components
│   │   │   ├── Background.tsx
│   │   │   ├── NavBar.tsx
│   │   │   └── ...
│   │   ├── member/             # Member-specific components
│   │   └── ui/                 # UI primitives (buttons, inputs, etc.)
│   ├── context/
│   │   └── AuthContext.tsx     # Authentication context
│   ├── hooks/
│   │   ├── useAuth.ts          # Auth hook
│   │   └── useNotifications.ts
│   ├── pages/
│   │   ├── admin/              # Admin pages
│   │   │   └── AdminDashboard.tsx
│   │   ├── auth/               # Auth pages
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── member/             # Member pages
│   │   └── user/               # User pages
│   ├── services/
│   │   ├── approval/           # User approval service
│   │   ├── auth/               # Authentication services
│   │   ├── billing/            # Billing & payment services
│   │   ├── core/               # Firebase config & core services
│   │   ├── diet/               # Diet plan services
│   │   ├── inventory/          # Supplement inventory services
│   │   ├── member/             # Member management services
│   │   ├── notification/       # Notification services
│   │   ├── reports/            # Analytics & reports services
│   │   ├── storage/            # File storage services
│   │   └── user/               # User services
│   ├── types/
│   │   ├── approval.ts         # Approval types
│   │   ├── billing.ts          # Billing types
│   │   ├── diet.ts             # Diet types
│   │   ├── member.ts           # Member types
│   │   ├── notification.ts     # Notification types
│   │   ├── supplement.ts       # Supplement types
│   │   └── ...
│   ├── utils/                  # Utility functions
│   ├── App.tsx                 # Main app component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── firestore.rules             # Firestore security rules
├── .env                        # Environment variables (create this)
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

## ⚙️ Configuration

### Firebase Setup

1. **Authentication**
   - Enable Email/Password provider
   - Optional: Enable Google, Facebook, etc.

2. **Firestore Database**
   - Start in production mode
   - Deploy the security rules from `firestore.rules`

3. **Collections Structure**
   ```
   users/                    # User accounts
   userRoles/               # User roles (admin/trainer/member)
   userProfiles/            # User profile data
   members/                 # Gym member profiles
   packages/                # Fee packages
   bills/                   # Billing records
   payments/                # Payment records
   receipts/                # Payment receipts
   subscriptions/           # Membership subscriptions
   dietPlans/               # Diet plans
   dietProgress/            # Diet adherence tracking
   dietTemplates/           # Reusable diet templates
   supplements/             # Supplement inventory
   supplementSales/         # Supplement sales records
   supplementStockHistory/  # Stock movement history
   notifications/           # User notifications
   scheduledNotifications/  # Scheduled notifications
   notificationTemplates/   # Notification templates
   pendingApprovals/        # Trainer approval requests
   reports/                 # Generated reports
   analytics/               # Analytics data
   ```

### Environment Variables

Create a `.env` file with your Firebase credentials:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

## 📜 Available Scripts

```bash
# Development
npm run dev              # Start dev server at localhost:5173

# Build
npm run build           # Build for production

# Preview
npm run preview         # Preview production build locally

# Linting
npm run lint            # Run ESLint

# Tailwind
npm run tailwindcss:init # Initialize Tailwind CSS
```

## 👤 User Roles

### Admin
- **Full Access**: Complete control over all features
- **Member Management**: Add, edit, delete members
- **Billing**: Create bills, record payments
- **Diet Plans**: Create and manage diet plans
- **Reports**: View all analytics and reports
- **Approvals**: Approve/reject trainer applications
- **Settings**: Configure packages, notifications, etc.

### Trainer
- **Limited Access**: Focus on training and diet management
- **View Members**: See member profiles and progress
- **Diet Plans**: Create diet plans for members
- **Attendance**: Mark member attendance
- **Reports**: View training-related reports

### Member
- **Self-Service**: View own information and progress
- **Profile**: View and update personal profile
- **Bills**: View bills and payment history
- **Diet Plans**: View assigned diet plans
- **Notifications**: Receive and read notifications
- **Progress**: Track personal fitness progress

## 🎯 Key Features Breakdown

### 1. Member Creation from Firebase Users

**Problem Solved**: Prevents duplicate members by allowing admins to select existing authenticated users.

**How it works**:
1. Admin clicks "Add Member"
2. System shows all Firebase Auth users without member profiles
3. Admin searches and selects a user
4. Email pre-fills from user account (locked)
5. Admin completes remaining details
6. Member profile linked to Firebase user via `userId`

**Benefits**:
- No duplicate emails
- Consistent data between auth and members
- Easy user-to-member promotion

### 2. Diet Plan Management

**Comprehensive meal planning system**:
- Create custom diet plans with multiple meals
- Track macronutrients (calories, protein, carbs, fats)
- Add multiple food items per meal
- Set diet goals (weight loss, muscle gain, maintenance)
- Monitor member adherence
- Save templates for reuse

### 3. Billing System

**Complete billing workflow**:
- Itemized bill creation
- Tax calculation
- Discount application
- Payment recording
- Receipt generation
- Payment reminders
- Subscription tracking

### 4. Role-Based Registration

**Secure user registration**:
- Users choose role during signup (Member/Trainer)
- Admin registration disabled
- Trainers require admin approval
- Approval workflow with pending requests
- Email notifications on approval/rejection

### 5. Analytics Dashboard

**Real-time insights**:
- Revenue trends (monthly, yearly)
- Member growth charts
- Payment status overview
- Activity heatmaps
- Package distribution
- Top-performing metrics

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

### Deploy to Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize hosting**
   ```bash
   firebase init hosting
   ```

3. **Deploy**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

### Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

### Deploy to Netlify

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy via Netlify CLI or drag-and-drop** the `dist` folder to Netlify

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add comments for complex logic
- Test thoroughly before submitting PR
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Avishek Kumar**
- GitHub: [@Avishek-7](https://github.com/Avishek-7)
- Email: avishekkumar7550@gmail.com

## 🙏 Acknowledgments

- [React](https://react.dev/) - UI library
- [Firebase](https://firebase.google.com/) - Backend platform
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Radix UI](https://www.radix-ui.com/) - UI primitives
- [Lucide](https://lucide.dev/) - Icon library
- [Recharts](https://recharts.org/) - Chart library

## 📞 Support

For support, email avishekkumar7550@gmail.com or open an issue on GitHub.

---

**Made by Avishek Kumar**
