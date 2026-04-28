// ─── 사진 갤러리 렌더 ───
async function renderPhotoGalleries() {
  try {
    const res = await fetch('data/photos.json');
    const photos = await res.json();

    for (const [category, filenames] of Object.entries(photos)) {
      const grid = document.querySelector(`#sec-${category} .photo-grid`);
      if (!grid) continue;

      grid.innerHTML = filenames.map((fn, i) => {
        const path = category === 'product' ? 'Product' : category === 'personalwork' ? 'Personal Works' : category === 'moment' ? 'Moment' :
                    category.charAt(0).toUpperCase() + category.slice(1);
        return `<div class="photo-item" onclick="openLightbox('${path}/${fn}.jpg')">
          <img loading="lazy" decoding="async" src="${path}/${fn}.jpg" alt="${category} ${i+1}" onerror="removePhotoItem(this)">
        </div>`;
      }).join('');
    }
  } catch (e) {
    console.log('📦 사진 로드 실패:', e);
  }
}

// ─── 비디오 카드 렌더 ───
async function renderVideoCards() {
  try {
    const res = await fetch('data/videos.json');
    const videos = await res.json();

    // Commercial
    const cmGrid = document.querySelector('#acc-cm .video-grid');
    if (cmGrid) {
      cmGrid.innerHTML = videos.commercial.map(v =>
        `<a href="https://youtu.be/${v.id}" target="_blank" class="video-card">
          <img loading="lazy" decoding="async" src="https://img.youtube.com/vi/${v.id}/hqdefault.jpg"
               alt="${v.title}" onerror="this.onerror=null;this.style.display='none'">
          <div class="video-overlay">
            <div class="play-ring"><svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg></div>
            <div class="video-label">${v.title}</div>
          </div>
        </a>`
      ).join('');
    }

    // Music Video
    const mvGrid = document.querySelector('#acc-mv .video-grid');
    if (mvGrid) {
      mvGrid.innerHTML = videos.music.map(v =>
        `<a href="https://youtu.be/${v.id}" target="_blank" class="video-card">
          <img loading="lazy" decoding="async" src="https://img.youtube.com/vi/${v.id}/hqdefault.jpg"
               alt="${v.title}" onerror="this.onerror=null;this.style.display='none'">
          <div class="video-overlay">
            <div class="play-ring"><svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg></div>
            <div class="video-label">${v.title}</div>
          </div>
        </a>`
      ).join('');
    }

    // Sketch
    const skGrid = document.querySelector('#acc-sk .video-grid');
    if (skGrid) {
      skGrid.innerHTML = videos.sketch.map((v, i) => {
        const href = v.url || `https://youtu.be/${v.id}`;
        const src = v.id ? `https://img.youtube.com/vi/${v.id}/hqdefault.jpg` : 'https://img.youtube.com/vi/wB4jX87odgw/hqdefault.jpg';
        return `<a href="${href}" target="_blank" class="video-card" style="width:calc(33.333% - 0.8rem);">
          <img loading="lazy" decoding="async" src="${src}" alt="${v.title}" onerror="this.onerror=null;this.style.display='none'">
          <div class="video-overlay">
            <div class="play-ring"><svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg></div>
            <div class="video-label">${v.title}</div>
          </div>
        </a>`;
      }).join('');
    }
  } catch (e) {
    console.log('🎬 비디오 로드 실패:', e);
  }
}

// ─── 지도 링크 렌더 ───
function renderMapLinks() {
  const links = [
    {
      name: '네이버지도',
      url: 'https://map.naver.com/v5/search/서울시+성동구+성수동1가+275-3',
      color: '#03C75A',
      logo: '<svg viewBox="0 0 22 22"><rect width="22" height="22" rx="4" fill="#03C75A"/><path d="M7 15V7h1.8l3.4 5.1V7H14v8h-1.8L8.8 9.9V15H7z" fill="white"/></svg>'
    },
    {
      name: '카카오맵',
      url: 'https://map.kakao.com/?q=서울시+성동구+성수동1가+275-3',
      color: '#FEE500',
      logo: '<svg viewBox="0 0 22 22"><rect width="22" height="22" rx="5" fill="#FEE500"/><path d="M11 3.5C8.0 3.5 5.5 6.0 5.5 9.1c0 2.1 1.1 3.9 2.8 5.3L11 18.5l2.7-4.1c1.7-1.4 2.8-3.2 2.8-5.3C16.5 6.0 14.0 3.5 11 3.5zm0 7.7c-1.2 0-2.1-1.0-2.1-2.1 0-1.2 1.0-2.1 2.1-2.1 1.2 0 2.1 1.0 2.1 2.1 0 1.2-1.0 2.1-2.1 2.1z" fill="#3A1D00"/></svg>'
    },
    {
      name: '구글지도',
      url: 'https://maps.google.com/?q=서울시+성동구+성수동1가+275-3',
      color: '#fff',
      logo: '<svg viewBox="0 0 22 22"><rect width="22" height="22" rx="4" fill="#fff" stroke="#e0e0e0"/><tspan fill="#4285F4" font-size="13" font-weight="700" x="11" text-anchor="middle" y="15.5">G</tspan></svg>'
    }
  ];

  const container = document.querySelector('[data-map-links]');
  if (container) {
    container.innerHTML = links.map(m =>
      `<a href="${m.url}" target="_blank" style="display:inline-flex;align-items:center;gap:0.65rem;font-size:0.82rem;color:var(--text);text-decoration:none;transition:opacity 0.2s;" onmouseover="this.style.opacity=0.5" onmouseout="this.style.opacity=1">
        <svg width="22" height="22" viewBox="0 0 22 22" style="flex-shrink:0;border-radius:4px;">${m.logo}</svg>
        ${m.name}
      </a>`
    ).join('');
  }
}

// ─── 초기화 ───
document.addEventListener('DOMContentLoaded', () => {
  renderPhotoGalleries();
  renderVideoCards();
  renderMapLinks();
});