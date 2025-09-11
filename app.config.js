export default {
  name: 'Krishi Sakhi',
  slug: 'krishi-sakhi-farmer',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'krishi-sakhi',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff'
    }
  },
  web: {
    favicon: './assets/images/favicon.png',
    bundler: 'metro'
  },
  plugins: [
    'expo-router'
  ],
  extra: {
    router: {
      origin: false
    }
  }
};
