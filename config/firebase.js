require('dotenv').config();

// Firebase App (the core Firebase SDK) is always required and must be listed first
import * as admin from 'firebase-admin';

const credential = {
  credential: admin.credential.cert({
    project_id: process.env.FIREBASE_PR_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  }),
};

admin.initializeApp(credential);

export default admin;
