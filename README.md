# 🌾 Krishi Sakhi Farmer

> **A comprehensive agricultural marketplace platform empowering farmers with modern technology**

[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## 📱 Overview

Krishi Sakhi Farmer is a modern React Native application built with Expo that provides farmers with a comprehensive platform to manage their agricultural activities, sell products, and connect with buyers. The app features a beautiful, intuitive interface with real-time data synchronization powered by Supabase.

## ✨ Features

### 🏠 **Dashboard**
- Real-time farm statistics and analytics
- Recent activities overview
- Quick access to key metrics
- Pull-to-refresh functionality

### ✅ **Task Management**
- Create, update, and track farm tasks
- Priority-based task organization
- Status tracking (Pending, In Progress, Completed)
- Due date management
- Modern UI with filtering and animations
- Floating action button for quick task creation

### 🛒 **Marketplace**
- Product listing management
- Price and inventory tracking
- Order management system
- Real-time status updates

### 💬 **Messaging**
- Direct communication with buyers
- Real-time chat interface
- Message history and notifications
- Unread message indicators

### 👤 **Profile Management**
- Comprehensive farmer profile
- Farm information and certifications
- Location and contact details
- Verification status

## 🛠️ Tech Stack

### **Frontend**
- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and tools
- **TypeScript** - Type-safe development
- **Expo Router** - File-based navigation
- **NativeWind** - Tailwind CSS for React Native
- **React Native Reanimated** - Smooth animations

### **Backend & Database**
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Relational database
- **Real-time subscriptions** - Live data updates

### **UI/UX**
- **Custom Components** - Reusable UI components
- **Themed Design** - Light/dark mode support
- **Responsive Layout** - Adaptive design
- **Haptic Feedback** - Enhanced user experience

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g @expo/cli`)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/krishi-sakhi-farmer.git
   cd krishi-sakhi-farmer
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Add your Supabase credentials
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

5. **Run on device/simulator**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web
   npm run web
   ```

## �� Platform Support

- **iOS** - Native iOS app
- **Android** - Native Android app
- **Web** - Progressive Web App

## ��️ Project Structure
krishi-sakhi-farmer/
├── app/ # App router pages
│ ├── (tabs)/ # Tab navigation screens
│ │ ├── index.tsx # Dashboard
│ │ ├── tasks.tsx # Task management
│ │ ├── marketplace.tsx # Product listings
│ │ ├── messages.tsx # Messaging
│ │ ├── profile.tsx # User profile
│ │ └── dashboard.tsx # Additional dashboard
│ └── layout.tsx # Root layout
├── components/ # Reusable components
│ ├── ui/ # UI components
│ └── ... # Feature components
├── services/ # Backend services
│ ├── entities/ # Entity services
│ ├── repositories/ # Data repositories
│ └── validators/ # Input validation
├── lib/ # Utilities and configurations
│ └── supabase/ # Supabase client
├── hooks/ # Custom React hooks
├── contexts/ # React contexts
├── types/ # TypeScript type definitions
├── utils/ # Utility functions
├── constants/ # App constants
└── assets/ # Images, fonts, etc.


## 🔧 Available Scripts

```bash
# Development
npm start                 # Start Expo development server
npm run android          # Run on Android device/emulator
npm run ios              # Run on iOS device/simulator
npm run web              # Run in web browser

# Code Quality
npm run lint             # Run ESLint
npm run reset-project    # Reset to clean state
```

## �� Design System

### **Color Palette**
- **Primary Green**: `#4CAF50` - Success, actions
- **Blue**: `#2196F3` - Information, links
- **Orange**: `#FF9800` - Warnings, pending states
- **Red**: `#F44336` - Errors, destructive actions
- **Dark Theme**: Optimized for low-light usage

### **Typography**
- **Headings**: Bold, clear hierarchy
- **Body Text**: Readable, accessible sizing
- **Labels**: Consistent, informative

### **Components**
- **Cards**: Elevated, rounded corners
- **Buttons**: Touch-friendly, with feedback
- **Forms**: Validated, user-friendly
- **Navigation**: Intuitive, accessible

## 🔐 Authentication & Security

- **Supabase Auth** - Secure user authentication
- **Row Level Security** - Database-level security
- **Input Validation** - Client and server-side validation
- **Error Handling** - Comprehensive error management

## 📊 Database Schema

The app uses a comprehensive PostgreSQL schema with the following key entities:

- **Users & Profiles** - User management and farmer profiles
- **Farm Tasks** - Task management and tracking
- **Products & Listings** - Marketplace functionality
- **Orders & Payments** - Transaction management
- **Messages** - Communication system
- **Reviews & Ratings** - Feedback system

## �� Deployment

### **Expo Application Services (EAS)**

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Configure EAS**
   ```bash
   eas build:configure
   ```

3. **Build for production**
   ```bash
   # Android
   eas build --platform android
   
   # iOS
   eas build --platform ios
   ```

4. **Submit to app stores**
   ```bash
   eas submit --platform android
   eas submit --platform ios
   ```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### **Development Guidelines**

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Development Team** - SIH 2025 Participants
- **Mentors** - Industry experts and faculty
- **Contributors** - Open source community

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/krishi-sakhi-farmer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/krishi-sakhi-farmer/discussions)
- **Email**: support@krishisakhi.com

## �� Acknowledgments

- **Expo Team** - For the amazing development platform
- **Supabase** - For the powerful backend services
- **React Native Community** - For the robust ecosystem
- **Open Source Contributors** - For the libraries and tools

---

<div align="center">

**Built with ❤️ for the farming community**

[⭐ Star this repo](https://github.com/yourusername/krishi-sakhi-farmer) | [🐛 Report Bug](https://github.com/yourusername/krishi-sakhi-farmer/issues) | [💡 Request Feature](https://github.com/yourusername/krishi-sakhi-farmer/issues)

</div>
