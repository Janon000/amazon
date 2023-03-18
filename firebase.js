import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDaLc_hALFjXgHrAwn1ds7WVkFeJfftv-Y",
  authDomain: "amzn-dfe86.firebaseapp.com",
  projectId: "amzn-dfe86",
  storageBucket: "amzn-dfe86.appspot.com",
  messagingSenderId: "272443416895",
  appId: "1:272443416895:web:6dccc094c0eef2fc14738a"
};

const app = !firebase.apps.length 
  ? firebase.initializeApp(firebaseConfig)
  : firebase.app()

  const db = app.firestore()

  export default db