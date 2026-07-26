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

// 2. Traitement et Enregistrement sécurisé (Anti-Doublons)
function handleFileSelect(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  // On filtre pour être sûr de ne prendre que les fichiers vidéos
  const videoFiles = Array.from(files).filter(file => file.type.startsWith('video/'));
  if (videoFiles.length === 0) return;

  let filesSavedCount = 0; // Compteur de sauvegardes réussies

  videoFiles.forEach(file => {
    const transaction = db.transaction(["videos"], "readwrite");
    const store = transaction.objectStore("videos");

    const videoData = {
      name: file.name,
      blob: file,
      date: Date.now()
    };

    const addRequest = store.add(videoData);
    
    addRequest.onsuccess = () => {
      filesSavedCount++;
      // On recharge la liste UNIQUEMENT quand la dernière vidéo du lot a fini de s'enregistrer
      if (filesSavedCount === videoFiles.length) {
        loadSavedVideos();
      }
    };
  });

  // On vide l'input pour pouvoir rajouter les mêmes fichiers plus tard si on veut
  event.target.value = ''; 
}

// 3. Chargement de la liste corrigé
function loadSavedVideos() {
  if (!db) return;

  const transaction = db.transaction(["videos"], "readonly");
  const store = transaction.objectStore("videos");
  const getAllRequest = store.getAll();

  getAllRequest.onsuccess = () => {
    // Le nettoyage de l'écran se fait ICI, pile au moment où la base de données répond
    videoList.innerHTML = ""; 

    const videos = getAllRequest.result;
    videos.forEach(videoObj => {
      addVideoCardToDOM(videoObj);
    });
  };
}

// 4. Affichage des cartes avec chargement "À la demande" (Zéro Lag)
function addVideoCardToDOM(videoObj) {
  const card = document.createElement('div');
  card.className = 'video-card';

  const title = document.createElement('div');
  title.className = 'video-title';
  title.textContent = videoObj.name;

  const videoContainer = document.createElement('div');
  videoContainer.style.marginTop = '10px';

  const playBtn = document.createElement('button');
  playBtn.textContent = '▶️ Charger et Regarder';
  playBtn.style.cssText = 'background: #34c759; color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; font-size: 14px;';
  
  let currentBlobURL = null;

  playBtn.onclick = () => {
    // Évite de lancer plusieurs lecteurs vidéos si on clique 2 fois
    if (videoContainer.querySelector('video')) return;

    const video = document.createElement('video');
    video.controls = true;
    video.autoplay = true;
    video.style.width = '100%';
    video.style.borderRadius = '8px';
    video.style.marginTop = '10px';

    currentBlobURL = URL.createObjectURL(videoObj.blob);
    video.src = currentBlobURL;

    videoContainer.appendChild(video);
    playBtn.style.display = 'none'; // Cache le bouton vert une fois en lecture
  };

  videoContainer.appendChild(playBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '🗑️ Supprimer';
  deleteBtn.style.cssText = 'background: #e50914; color: white; border: none; padding: 8px 12px; border-radius: 8px; margin-top: 10px; cursor: pointer; display: block;';
  
  deleteBtn.onclick = () => {
    if (currentBlobURL) {
      URL.revokeObjectURL(currentBlobURL); // Libère la RAM proprement
    }
    deleteVideo(videoObj.id);
  };

  card.appendChild(title);
  card.appendChild(videoContainer);
  card.appendChild(deleteBtn);
  videoList.appendChild(card);
}

// 5. Suppression
function deleteVideo(id) {
  const transaction = db.transaction(["videos"], "readwrite");
  const store = transaction.objectStore("videos");
  store.delete(id).onsuccess = () => {
    loadSavedVideos();
  };
}

// 6. Barre de recherche
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

// 7. Statut réseau
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
