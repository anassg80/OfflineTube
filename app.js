const videoList = document.getElementById('videoList');
let db;

// 1. Initialisation de la base de données IndexedDB
const request = indexedDB.open("OfflineTubeDB", 1);

request.onupgradeneeded = (e) => {
  db = e.target.result;
  if (!db.objectStoreNames.contains("videos")) {
    db.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
  }
};

request.onsuccess = (e) => {
  db = e.target.result;
  loadSavedVideos(); // Charger les vidéos enregistrées dès l'ouverture
};

request.onerror = (e) => {
  console.error("Erreur de base de données :", e.target.errorCode);
};

// 2. Traitement des fichiers sélectionnés
function handleFileSelect(event) {
  const files = event.target.files;
  for (let file of files) {
    if (file.type.startsWith('video/')) {
      saveVideoToDB(file);
    }
  }
}

// 3. Enregistrer la vidéo dans IndexedDB
function saveVideoToDB(file) {
  const transaction = db.transaction(["videos"], "readwrite");
  const store = transaction.objectStore("videos");

  const videoData = {
    name: file.name,
    blob: file
  };

  const addRequest = store.add(videoData);
  addRequest.onsuccess = () => {
    // Recharger la liste une fois enregistrée
    loadSavedVideos();
  };
}

// 4. Charger et afficher toutes les vidéos sauvegardées
function loadSavedVideos() {
  videoList.innerHTML = ""; // Vider la liste actuelle

  const transaction = db.transaction(["videos"], "readonly");
  const store = transaction.objectStore("videos");
  const getAllRequest = store.getAll();

  getAllRequest.onsuccess = () => {
    const videos = getAllRequest.result;
    videos.forEach(videoObj => {
      addVideoCardToDOM(videoObj);
    });
  };
}

// 5. Afficher une carte vidéo
function addVideoCardToDOM(videoObj) {
  const card = document.createElement('div');
  card.className = 'video-card';

  const title = document.createElement('div');
  title.className = 'video-title';
  title.textContent = videoObj.name;

  const video = document.createElement('video');
  video.controls = true;
  video.src = URL.createObjectURL(videoObj.blob);

  // Bouton de suppression
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '🗑️ Supprimer';
  deleteBtn.style.cssText = 'background: #e50914; color: white; border: none; padding: 8px 12px; border-radius: 8px; margin-top: 10px; cursor: pointer; display: block;';
  deleteBtn.onclick = () => deleteVideo(videoObj.id);

  card.appendChild(title);
  card.appendChild(video);
  card.appendChild(deleteBtn);
  videoList.appendChild(card);
}

// 6. Supprimer une vidéo
function deleteVideo(id) {
  const transaction = db.transaction(["videos"], "readwrite");
  const store = transaction.objectStore("videos");
  store.delete(id).onsuccess = () => {
    loadSavedVideos();
  };
}

// 7. Barre de recherche
function filterVideos() {
  const input = document.getElementById('searchInput').value.toLowerCase();
  const cards = document.querySelectorAll('.video-card');

  cards.forEach(card => {
    const title = card.querySelector('.video-title').textContent.toLowerCase();
    if (title.includes(input)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// 8. Gestion de la connexion
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

function updateOnlineStatus() {
  const badge = document.getElementById('statusBadge');
  if (!badge) return;

  if (navigator.onLine) {
    badge.textContent = '🌐 Connecté (Prêt pour la synchronisation Wi-Fi)';
    badge.style.backgroundColor = '#1e2922';
    badge.style.color = '#4cd964';
    badge.style.borderColor = '#23472b';
  } else {
    badge.textContent = '✈️ Mode Avion (Lecture locale activée)';
    badge.style.backgroundColor = '#2c221e';
    badge.style.color = '#ff9500';
    badge.style.borderColor = '#473223';
  }
}

updateOnlineStatus();
