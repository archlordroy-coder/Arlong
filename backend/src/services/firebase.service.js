const admin = require('firebase-admin');

let bucket;

const initFirebase = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_BUCKET
      });
      bucket = admin.storage().bucket();
      console.log('✅ Firebase initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase:', error.message);
    }
  }
};

const mirrorToFirebase = async (driveFileId, buffer, mimeType, filename) => {
  if (!bucket) return null;

  try {
    const path = `arlong/${driveFileId}/${filename}`;
    const file = bucket.file(path);

    await file.save(buffer, {
      metadata: { contentType: mimeType }
    });

    await file.makePublic();

    return `https://storage.googleapis.com/${bucket.name}/${path}`;
  } catch (error) {
    console.error('Mirror to Firebase error:', error);
    return null;
  }
};

const deleteFromFirebase = async (driveFileId) => {
  if (!bucket) return;
  try {
    const [files] = await bucket.getFiles({ prefix: `arlong/${driveFileId}/` });
    await Promise.all(files.map(f => f.delete()));
  } catch (error) {
    console.error('Delete from Firebase error:', error);
  }
};

module.exports = { initFirebase, mirrorToFirebase, deleteFromFirebase };
