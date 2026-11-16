document.addEventListener("DOMContentLoaded", () => {
    const uploadForm = document.getElementById("uploadForm");
    const photoTitleInput = document.getElementById("photoTitle");
    const photoFileInput = document.getElementById("photoFile");
    const galleryContainer = document.getElementById("galleryContainer");

    // Load existing photos on startup
    loadGallery();

    uploadForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const title = photoTitleInput.value;
        const file = photoFileInput.files[0];

        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.src = event.target.result;
            img.onload = function () {
                // Compress image using a canvas to avoid storage limits
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 600;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);

                savePhotoToStorage(title, compressedDataUrl);
                uploadForm.reset();
                loadGallery();
            };
        };
        reader.readAsDataURL(file);
    });

    function savePhotoToStorage(title, imageUrl) {
        const photos = JSON.parse(localStorage.getItem("mcms_photos")) || [];
        photos.unshift({ title: title, url: imageUrl, date: new Date().toISOString() });
        localStorage.setItem("mcms_photos", JSON.stringify(photos));
    }

    function loadGallery() {
        const photos = JSON.parse(localStorage.getItem("mcms_photos")) || [];
        galleryContainer.innerHTML = "";

        if (photos.length === 0) {
            galleryContainer.innerHTML = "<p>No memories uploaded yet. Be the first to add one!</p>";
            return;
        }

        photos.forEach((photo) => {
            const card = document.createElement("div");
            card.className = "photo-card";

            const img = document.createElement("img");
            img.src = photo.url;
            img.alt = photo.title;

            const p = document.createElement("p");
            p.textContent = photo.title;

            card.appendChild(img);
            card.appendChild(p);
            galleryContainer.appendChild(card);
        });
    }
});
