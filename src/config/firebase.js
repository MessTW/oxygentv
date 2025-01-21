import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDc4x2fvV2Z65qI_TGk_SWwFNpfHRJtnoI",
  authDomain: "fridayhd-c6673.firebaseapp.com",
  databaseURL: "https://fridayhd-c6673-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "fridayhd-c6673",
  storageBucket: "fridayhd-c6673.firebasestorage.app",
  messagingSenderId: "70589323647",
  appId: "1:70589323647:web:0a8bfdfacccb9d9e9a624a",
  measurementId: "G-679QYE16SL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.appdata');
provider.addScope('https://www.googleapis.com/auth/drive.file');

export { auth, provider, db };
