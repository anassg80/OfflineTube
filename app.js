// ==========================================
// 1. DÉTECTION DU RÉSEAU (Wi-Fi / 4G / Offline)
// ==========================================
function updateOnlineStatus() {
  const statusDiv = document.getElementById('status');
  if (navigator.onLine) {
    statusDiv.textContent = "🌐 Connecté (Prêt pour la synchronisation Wi-Fi)";
    statusDiv.style.color = "#4cd964"; // Vert
  } else {
    statusDiv.textContent = "✈️ Hors-Ligne (Lecture mémoire iPhone)";
    statusDiv.style.color = "#ff9500"; // Orange
  }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// ==========================================
// 2. BASE DE DONNÉES LOCALE (IndexedDB)
// ==========================================
let db;
const dbRequest = indexedDB.open("OfflineTubeDB", 1);

// Création de la table 'videos' si elle n'existe pas
dbRequest.onupgradeneeded = (event) => {
  db = event.target.result;
  if (!db.objectStoreNames.contains("videos")) {
    db.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
  }
};

dbRequest.onsuccess = (event) => {
  db = event.target.result;
  afficherVideos();
};

dbRequest.onerror = (event) => {
  console.error("Erreur lors de l'ouverture de la base de données :", event.target.error);
};

// ==========================================
// 3. SAUVEGARDER UNE VIDÉO EN MEMOIRE
// ==========================================
document.getElementById('videoInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const transaction = db.transaction(["videos"], "readwrite");
  const store = transaction.objectStore("videos");

  const nouvelleVideo = {
    titre: file.name,
    blob: file, // Fichier vidéo brut
    dateAjout: new Date().toLocaleDateString()
  };

  const addRequest = store.add(nouvelleVideo);

  addRequest.onsuccess = () => {
    afficherVideos();
    e.target.value = ""; // Réinitialise l'input
  };

  addRequest.onerror = (err) => {
    console.error("Erreur d'enregistrement de la vidéo :", err);
  };
});

// ==========================================
// 4. AFFICHER LES VIDÉOS DEPUIS LA MÉMOIRE
// ==========================================
function afficherVideos() {
  const videoList = document.getElementById('videoList');
  videoList.innerHTML = "";

  const transaction = db.transaction(["videos"], "readonly");
  const store = transaction.objectStore("videos");
  const getRequest = store.getAll();

  getRequest.onsuccess = () => {
    const videos = getRequest.result;

    if (videos.length === 0) {
      videoList.innerHTML = '<p class="empty-msg">Aucune vidéo enregistrée pour le moment.</p>';
      return;
    }

    // Afficher chaque vidéo
    videos.forEach(video => {
      const videoCard = document.createElement('div');
      videoCard.className = 'video-card';

      const title = document.createElement('h3');
      title.textContent = video.titre;

      const player = document.createElement('video');
      player.controls = true;
      
      // Crée un lien direct vers la vidéo stockée dans la mémoire
      const videoURL = URL.createObjectURL(video.blob);
      player.src = videoURL;

      videoCard.appendChild(title);
      videoCard.appendChild(player);
      videoList.appendChild(videoCard);
    });
  };
}
// Enregistrer le Service Worker pour le mode 100% hors-ligne permanent
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => console.log("PWA prête pour le hors-ligne h24 !"))
    .catch((err) => console.log("Erreur Service Worker :", err));
}
