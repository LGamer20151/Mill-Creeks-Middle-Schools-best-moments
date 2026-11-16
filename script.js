const BIN_URL = 'https://api.npoint.io/0ebd6cd0b11ec4354181';

document.addEventListener('DOMContentLoaded', () => {
    fetchPhotos();

    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
});

// Fetch photos from npoint.io
async function fetchPhotos() {
    try {
        const response = await fetch(BIN_URL);
        if (!response.ok) throw new Error('Failed to fetch photos');
        const data = await response.json();
        // Ensure data is an array
        window.allPhotos = Array.isArray(data) ? data : (data.photos || []);
        renderGallery(window.allPhotos);
    } catch (error) {
        console.error('Error loading photos:', error);
        document.getElementById('gallery-grid').innerHTML = '<p>Error loading photos. Please try again later.</p>';
    }
}

// Render photos into the gallery grid
function renderGallery(photos) {
    const grid = document.getElementById('gallery-grid');
    grid.innerHTML = '';

    if (!photos || photos.length === 0) {
        grid.innerHTML = '<p>No memories uploaded yet. Be the first to add one!</p>';
        return;
    }

    // Sort newest first
    const sortedPhotos = [...photos].reverse();

    sortedPhotos.forEach(photo => {
        const card = document.createElement('div');
        card.className = 'photo-card';

        card.innerHTML = `
            <img src="${photo.image}" alt="${escapeHtml(photo.title)}">
            <div class="photo-info">
                <h3>${escapeHtml(photo.title)}</h3>
                <p>${new Date(photo.date).toLocaleDateString()}</p>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Compress image and handle upload
async function handleUpload(e) {
    e.preventDefault();

    const titleInput = document.getElementById('photo-title');
    const fileInput = document.getElementById('photo-file');
    const submitBtn = document.querySelector('.submit-btn');

    if (fileInput.files.length === 0) return;

    const file = fileInput.files[0];
    submitBtn.textContent = 'Compressing & Uploading...';
    submitBtn.disabled = true;

    try {
        // Compress image to prevent size errors
        const compressedDataUrl = await compressImage(file, 800, 0.7);

        // Fetch current bin data first to avoid overwriting others
        const response = await fetch(BIN_URL);
        const currentData = await response.json();
        let photosArray = Array.isArray(currentData) ? currentData : (currentData.photos || []);

        // Create new photo object
        const newPhoto = {
            id: Date.now().toString(),
            title: titleInput.value.trim(),
            image: compressedDataUrl,
            date: new Date().toISOString()
        };

        photosArray.push(newPhoto);

        // Save updated array back to npoint.io
        const updateResponse = await fetch(BIN_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(photosArray)
        });

        if (!updateResponse.ok) throw new Error('Failed to save photo to database');

        // Reset form and refresh gallery
        titleInput.value = '';
        fileInput.value = '';
        window.allPhotos = photosArray;
        renderGallery(window.allPhotos);
        alert('Photo uploaded successfully!');

    } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload photo. The file might still be too large or there was a network error.');
    } finally {
        submitBtn.textContent = 'Upload Photo';
        submitBtn.disabled = false;
    }
}

// Helper function to compress images using canvas
function compressImage(file, maxWidth, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
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
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
}

// Live search filter
function handleSearch(e) {
    const term = e.target.value.toLowerCase();
    if (!window.allPhotos) return;

    const filtered = window.allPhotos.filter(photo => 
        photo.title.toLowerCase().includes(term)
    );
    renderGallery(filtered);
}

// Simple HTML escaper for security
function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
