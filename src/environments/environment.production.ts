export const environment = {
  production: true,
  // 招待制登録の「ひみつのことば」。関係者にだけ口頭やメッセージで共有する想定。
  // デプロイ前に必ず変更すること。
  signupSecretWord: 'ポイズン・シャワーまほうのちから',
  firebaseConfig: {
    apiKey: 'AIzaSyAa9WHZmxQ_4Y-nMJOxQgcCjH9XyLZB-lw',
    authDomain: 'meat-meet-fort.firebaseapp.com',
    projectId: 'meat-meet-fort',
    storageBucket: 'meat-meet-fort.firebasestorage.app',
    messagingSenderId: '312942224217',
    appId: '1:312942224217:web:64c73f165ee52459cde248',
  },
};
