const videoList = document.getElementById('videoList');
let db;

// 1. Initialisation d'IndexedDB
const request = indexedDB.open("OfflineTubeDB", 1);

request.onupgradeneeded = (e) => {
  db = e.target.result;
  if (!db.objectStoreNames.contains("videos")) {
    db.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
  }
};

request.onsuccess = (e) => {
  db = e.target.result;
  loadSavedVideos();
};

request.onerror = (e) => {
  console.error("Erreur IndexedDB :", e.target.errorCode);
};

// 2. Traitement des fichiers sélectionnés
function handleFileSelect(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  Array.from(files).forEach(file => {
    if (file.type.startsWith('video/')) {
      saveVideoToDB(file);
    }
  });

  event.target.value = '';
}

// 3. Enregistrement en base
function saveVideoToDB(file) {
  const transaction = db.transaction(["videos"], "readwrite");
  const store = transaction.objectStore("videos");

  const videoData = {
    name: file.name,
    blob: file,
    date: Date.now()
  };

  const addRequest = store.add(videoData);
  addRequest.onsuccess = () => {
    loadSavedVideos();
  };
}

// 4. Chargement de la liste (léger, aucune vidéo n'est chargée en mémoire)
function loadSavedVideos() {
  if (!db) return;

  // Nettoyage de la liste
  videoList.innerHTML = "";

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

// 5. Affichage des cartes avec chargement "À la demande"
function addVideoCardToDOM(videoObj) {
  const card = document.createElement('div');
  card.className = 'video-card';

  const title = document.createElement('div');
  title.className = 'video-title';
  title.textContent = videoObj.name;

  // Zone vidéo
  const videoContainer = document.createElement('div');
  videoContainer.style.marginTop = '10px';

  // Bouton pour charger et lancer la vidéo
  const playBtn = document.createElement('button');
  playBtn.textContent = '▶️ Charger et Regarder';
  playBtn.style.cssText = 'background: #34c759; color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; font-size: 14px;';
  
  let currentBlobURL = null;

  playBtn.onclick = () => {
    // Si la vidéo est déjà chargée, on ne fait rien
    if (videoContainer.querySelector('video')) return;

    // Création du lecteur vidéo uniquement à la demande
    const video = document.createElement('video');
    video.controls = true;
    video.autoplay = true;
    video.style.width = '100%';
    video.style.borderRadius = '8px';
    video.style.marginTop = '10px';

    currentBlobURL = URL.createObjectURL(videoObj.blob);
    video.src = currentBlobURL;

    videoContainer.appendChild(video);
    playBtn.style.display = 'none'; // Masquer le bouton une fois la vidéo chargée
  };

  videoContainer.appendChild(playBtn);

  // Bouton de suppression
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '🗑️ Supprimer';
  deleteBtn.style.cssText = 'background: #e50914; color: white; border: none; padding: 8px 12px; border-radius: 8px; margin-top: 10px; cursor: pointer; display: block;';
  
  deleteBtn.onclick = () => {
    if (currentBlobURL) {
      URL.revokeObjectURL(currentBlobURL);
    }
    deleteVideo(videoObj.id);
  };

  card.appendChild(title);
  card.appendChild(videoContainer);
  card.appendChild(deleteBtn);
  videoList.appendChild(card);
}

// 6. Suppression
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

// 8. Statut réseau
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
