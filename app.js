const NPOINT_URL = "https://api.npoint.io/1afce02931a785197b7a";

const galleryGrid = document.getElementById("galleryGrid");
const uploadBtn = document.getElementById("uploadBtn");
const photoTitleInput = document.getElementById("photoTitle");
const photoFileInput = document.getElementById("photoFile");

function loadPhotos() {
    fetch(NPOINT_URL)
        .then(response => response.json())
        .then(data => {
            galleryGrid.innerHTML = "";
            if (data.photos) {
                data.photos.forEach(photo => {
                    const card = document.createElement("div");
                    card.className = "photo-card";
                    card.innerHTML = `
                        <img src="${photo.image}" alt="${photo.title}">
                        <p>${photo.title}</p>
                    `;
                    galleryGrid.appendChild(card);
                });
            }
        })
        .catch(error => console.log("Error loading photos:", error));
}

uploadBtn.addEventListener("click", () => {
    const title = photoTitleInput.value;
    const file = photoFileInput.files[0];

    if (!title || !file) {
        alert("Please enter a title and choose a photo!");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const base64Image = event.target.result;
        
        fetch(NPOINT_URL)
            .then(res => res.json())
            .then(data => {
                if (!data.photos) {
                    data.photos = [];
                }
                
                data.photos.push({
                    title: title,
                    image: base64Image
                });

                return fetch(NPOINT_URL, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                });
            })
            .then(() => {
                alert("Photo uploaded successfully!");
                photoTitleInput.value = "";
                photoFileInput.value = "";
                loadPhotos();
            })
            .catch(error => console.log("Error uploading:", error));
    };

    reader.readAsDataURL(file);
});

loadPhotos();
