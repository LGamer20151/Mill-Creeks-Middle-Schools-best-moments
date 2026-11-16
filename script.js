const BIN_ID = '0ebd6cd0b11ec4354181';
const API_URL = `https://api.npoint.io/${BIN_ID}`;

const uploadForm = document.getElementById('uploadForm');
const uploaderNameInput = document.getElementById('uploaderName');
const photoFileInput = document.getElementById('photoFile');
const gallery = document.getElementById('gallery');
const searchInput = document.getElementById('searchInput');

let allPhotos = [];

// Fetch photos from npoint.io
async function fetchPhotos() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        allPhotos = Array.isArray(data) ? data : [];
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
        gallery.innerHTML = '<p>No photos found.</p>';
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

// Live search filter
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const filtered = allPhotos.filter(item => item.name.toLowerCase().includes(query));
    displayPhotos(filtered);
});

// Handle photo upload submission
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = uploaderNameInput.value.trim();
    const file = photoFileInput.files[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(event) {
        const base64Image = event.target.result;
        const newEntry = { name: name, image: base64Image };
        const updatedPhotos = [...allPhotos, newEntry];

        try {
            const response = await fetch(API_URL, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedPhotos)
            });

            if (!response.ok) throw new Error('Failed to save upload');

            alert('Photo uploaded successfully!');
            uploadForm.reset();
            fetchPhotos();
        } catch (error) {
            console.error(error);
            alert('Upload failed. The image file might be too large for the database.');
        }
    };
    reader.readAsDataURL(file);
});

// Initial data load
fetchPhotos();
