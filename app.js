const videoList = document.getElementById('videoList');
const mainPlayer = document.getElementById('mainPlayer');

function handleFileSelect(event) {
  const files = event.target.files;
  for (let file of files) {
    if (file.type.startsWith('video/')) {
      addVideoToList(file);
    }
  }
}

function addVideoToList(file) {
  const card = document.createElement('div');
  card.className = 'video-card';
  card.textContent = '▶ ' + file.name;

  card.onclick = () => {
    const fileURL = URL.createObjectURL(file);
    mainPlayer.src = fileURL;
    mainPlayer.style.display = 'block';
    mainPlayer.play();
  };

  videoList.appendChild(card);
}

function filterVideos() {
  const input = document.getElementById('searchInput').value.toLowerCase();
  const cards = document.querySelectorAll('.video-card');

  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    if (text.includes(input)) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}
