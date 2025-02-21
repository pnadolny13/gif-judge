module.exports = {
  name: 'app',
  slug: 'app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'myapp',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/splash.png',
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
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png'
  },
  extra: {
    REACT_APP_REST_API_URL: process.env.REACT_APP_REST_API_URL || 'http://127.0.0.1:8000',
    REACT_APP_WS_API_URL: process.env.REACT_APP_WS_API_URL || 'ws://127.0.0.1:8000',
    WEBSOCKET_API_ENDPOINT: process.env.WEBSOCKET_API_ENDPOINT || 'ws://127.0.0.1:8000'
  }
}; 