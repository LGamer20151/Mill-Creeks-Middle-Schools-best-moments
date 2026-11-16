// REPLACE WITH YOUR NPOINT BIN URL
const API_URL = "https://api.npoint.io/YOUR_BIN_ID";

const uploadForm = document.getElementById('uploadForm');
const galleryGrid = document.getElementById('galleryGrid');
const submitBtn = document.getElementById('submitBtn');

async function loadMoments() {
    try {
        const response = await fetch(API_URL);
        const moments = await response.json();
        galleryGrid.innerHTML = '';
        
        if (!moments || moments.length === 0) {
            galleryGrid.innerHTML = '<p class="text-slate-500 col-span-full text-center py-8">No moments shared yet. Be the first to upload one!</p>';
            return;
        }

        moments.forEach(moment => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100 flex flex-col';
            card.innerHTML = `
                <img src="${moment.image}" alt="School moment" class="w-full h-48 object-cover">
                <div class="p-4 flex-1 flex flex-col justify-between">
                    <p class="text-slate-700 text-sm mb-3">${moment.caption}</p>
                    <span class="text-xs font-medium text-slate-400">Shared by ${moment.author}</span>
                </div>
            `;
            galleryGrid.appendChild(card);
        });
    } catch (error) {
        galleryGrid.innerHTML = '<p class="text-red-500 col-span-full text-center py-8">Failed to load moments. Please check your API URL.</p>';
    }
}

uploadForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('uploaderName').value;
    const caption = document.getElementById('imageCaption').value;
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];

    if (!file) return;

    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;

    const reader = new FileReader();
    reader.onload = async function(event) {
        const img = new Image();
        img.onload = async function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 600;
            const MAX_HEIGHT = 600;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);

            const newMoment = {
                author: name,
                caption: caption,
                image: compressedDataUrl,
                date: new Date().toISOString()
            };

            try {
                const getRes = await fetch(API_URL);
                let moments = await getRes.json();
                if (!Array.isArray(moments)) moments = [];
                
                moments.unshift(newMoment);

                await fetch(API_URL, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(moments)
                });

                uploadForm.reset();
                loadMoments();
            } catch (err) {
                alert('Upload failed. Please try again.');
            } finally {
                submitBtn.textContent = 'Upload Moment';
                submitBtn.disabled = false;
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

loadMoments();
