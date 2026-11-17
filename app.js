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

const uploadForm = document.getElementById('upload-form');
const submitBtn = document.getElementById('submit-btn');
const galleryGrid = document.getElementById('gallery-grid');
const emptyMessage = document.getElementById('empty-message');

// Helper function to compress and convert image to text instantly
function processImage(file, maxWidth = 600, quality = 0.6) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert directly to a fast data string
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
        };
    });
}

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
        // 1. Process and compress image instantly in the browser
        const imageDataUrl = await processImage(file);

        // 2. Save memory directly to Firestore Database
        await db.collection('memories').add({
            title: title,
            imageUrl: imageDataUrl,
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
