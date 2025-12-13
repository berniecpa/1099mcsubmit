import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  if (admin.apps.length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccount) {
      console.warn('⚠️  Firebase service account not configured. Using emulator or local mode.');
      // For development without Firebase, you can skip initialization
      // In production, this should throw an error
      return null;
    }

    try {
      const credentials = JSON.parse(serviceAccount);

      admin.initializeApp({
        credential: admin.credential.cert(credentials),
        projectId: credentials.project_id
      });

      console.log('✅ Firebase Admin initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin:', error);
      throw error;
    }
  }

  return admin;
};

export const firebaseAdmin = initializeFirebase();
export default firebaseAdmin;
