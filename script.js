const BIN_ID = '0ebd6cd0b11ec4354181';
const API_URL = `https://api.npoint.io/${BIN_ID}`;

const uploadForm = document.getElementById('uploadForm');
const uploaderNameInput = document.getElementById('uploaderName');
const photoFileInput = document.getElementById('photoFile');
const gallery = document.getElementById('gallery');
const searchInput = document.getElementById('searchInput');
const submitBtn = document.getElementById('submitBtn');

let allPhotos = [];

// Fetch photos from npoint.io object structure
async function fetchPhotos() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        
        // Extract array from the photos property
        allPhotos = Array.isArray(data.photos) ? data.photos : [];
        displayPhotos(allPhotos);
    } catch (error) {
        console.error(error);
        gallery.innerHTML = '<p>Could not load photos. Please check your connection.</p>';
    }
}

// Display photos in the gallery grid
function displayPhotos(photos) {
    gallery.innerHTML = '';
    if (photos.length === 0) {
        gallery.innerHTML = '<p>No photos found matching your search.</p>';
        return;
    }

    // Show newest photos first
    [...photos].reverse().forEach(item => {
        const card = document.createElement('div');
        card.className = 'photo-card';
        card.innerHTML = `
            <img src="${item.image}" alt="Photo by ${item.name}">
            <p><strong>${item.name}</strong></p>
        `;
        gallery.appendChild(card);
    });
}

// Live search filter for names
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const filtered = allPhotos.filter(item => item.name.toLowerCase().includes(query));
    displayPhotos(filtered);
});

// Compress image function with aggressive sizing to keep file size small
function compressImage(file, maxWidth = 350, quality = 0.4) {
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

                resolve(canvas.toDataURL('image/jpeg', quality));
            };
        };
    });
}

// Handle photo upload submission
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = uploaderNameInput.value.trim();
    const file = photoFileInput.files[0];

    if (!file) return;

    submitBtn.textContent = 'Uploading...';
    submitBtn.disabled = true;

    try {
        const compressedBase64 = await compressImage(file);
        const newEntry = { name: name, image: compressedBase64 };
        const updatedPhotos = [...allPhotos, newEntry];

        // Send data wrapped in the photos object structure
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photos: updatedPhotos })
        });

        if (!response.ok) throw new Error('Failed to save upload');

        alert('Photo uploaded successfully!');
        uploadForm.reset();
        await fetchPhotos();
    } catch (error) {
        console.error(error);
        alert('Upload failed. The image might be too large or the network blocked the request.');
    } finally {
        submitBtn.textContent = 'Upload Photo';
        submitBtn.disabled = false;
    }
});

// Load photos on page load
fetchPhotos();
