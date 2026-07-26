const videoList = document.getElementById('videoList');

function handleFileSelect(event) {
  const files = event.target.files;
  for (let file of files) {
    if (file.type.startsWith('video/')) {
      addVideoCard(file);
    }
  }
}

function addVideoCard(file) {
  const card = document.createElement('div');
  card.className = 'video-card';

  const title = document.createElement('div');
  title.className = 'video-title';
  title.textContent = file.name;

  const video = document.createElement('video');
  video.controls = true;
  video.src = URL.createObjectURL(file);

  card.appendChild(title);
  card.appendChild(video);
  videoList.appendChild(card);
}

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

// Gestion du badge de connexion
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

function updateOnlineStatus() {
  const badge = document.getElementById('statusBadge');
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
