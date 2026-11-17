// TODO: Replace with your own free Firebase project credentials
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

const uploadForm = document.getElementById('upload-form');
const submitBtn = document.getElementById('submit-btn');
const galleryGrid = document.getElementById('gallery-grid');
const emptyMessage = document.getElementById('empty-message');

// Handle Image Upload
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('photo-title').value;
    const fileInput = document.getElementById('photo-file');
    const file = fileInput.files[0];

    if (!file) return;

    submitBtn.textContent = "Uploading...";
    submitBtn.disabled = true;

    try {
        // 1. Upload image to Firebase Storage
        const storageRef = storage.ref(`images/${Date.now()}_${file.name}`);
        const snapshot = await storageRef.put(file);
        const downloadUrl = await snapshot.ref.getDownloadURL();

        // 2. Save memory info to Firestore Database
        await db.collection('memories').add({
            title: title,
            imageUrl: downloadUrl,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Reset Form
        uploadForm.reset();
        submitBtn.textContent = "Upload Photo";
        submitBtn.disabled = false;
    } catch (error) {
        console.error("Error uploading memory: ", error);
        alert("Upload failed. Please check your Firebase configuration.");
        submitBtn.textContent = "Upload Photo";
        submitBtn.disabled = false;
    }
});

// Load and Display Memories in Real-Time
db.collection('memories').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
    galleryGrid.innerHTML = "";
    
    if (snapshot.empty) {
        emptyMessage.style.display = "block";
        return;
    }

    emptyMessage.style.display = "none";

    snapshot.forEach((doc) => {
        const memory = doc.data();
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `
            <img src="${memory.imageUrl}" alt="${memory.title}">
            <h3>${memory.title}</h3>
        `;
        galleryGrid.appendChild(item);
    });
});
