// ─── 사진 갤러리 렌더 ───
async function renderPhotoGalleries() {
  try {
    const res = await fetch('data/photos.json');
    const photos = await res.json();

    // Fisher-Yates shuffle
    function shuffleArray(a) {
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
    }

    for (const [category, filenames] of Object.entries(photos)) {
      const grid = document.querySelector(`#sec-${category} .photo-grid`);
      if (!grid) continue;

      // 랜덤 배치: 원본 배열을 건드리지 않도록 복사 후 셔플
      const items = filenames.slice();
      shuffleArray(items);

      grid.innerHTML = items.map((fn, i) => {
        const path = category === 'portraiture'
          ? 'portraiture'
          : category === 'personalwork'
            ? 'Personal Works'
            : category.charAt(0).toUpperCase() + category.slice(1);
        // portraiture에서 특정 파일에만 희미한 테두리 적용
        let extraClass = '';
        if (category === 'portraiture') {
          const highlightList = ['portrait17', 'portrait22', 'portrait23'];
          if (highlightList.includes(fn)) extraClass = ' faint-border';
        }
        const isPersonal = category === 'personalwork';
        const itemClass = `photo-item${extraClass}${isPersonal ? ' personalwork' : ''}`;
        return `<div class="${itemClass}" onclick="openLightbox(event, '${path}/${fn}.jpg')">
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

    // 전역 변수에 비디오 데이터 저장
    if (window.allVideos) {
      window.allVideos.commercial = videos.commercial || [];
      window.allVideos.music = videos.music || [];
      window.allVideos.sketch = videos.sketch || [];
    }

    // Commercial
    const cmGrid = document.querySelector('#acc-cm .video-grid');
    if (cmGrid) {
      cmGrid.innerHTML = videos.commercial.map((v, i) =>
        `<div class="video-card" onclick="openVideoModal('${v.id}', 'commercial', ${i})">
          <img loading="lazy" decoding="async" src="https://img.youtube.com/vi/${v.id}/hqdefault.jpg"
               alt="${v.title}" onerror="this.onerror=null;this.style.display='none'">
          <div class="video-overlay">
            <div class="play-ring"><svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg></div>
            <div class="video-label">${v.title}</div>
          </div>
        </div>`
      ).join('');
    }

    // Music Video
    const mvGrid = document.querySelector('#acc-mv .video-grid');
    if (mvGrid) {
      mvGrid.innerHTML = videos.music.map((v, i) =>
        `<div class="video-card" onclick="openVideoModal('${v.id}', 'music', ${i})">
          <img loading="lazy" decoding="async" src="https://img.youtube.com/vi/${v.id}/hqdefault.jpg"
               alt="${v.title}" onerror="this.onerror=null;this.style.display='none'">
          <div class="video-overlay">
            <div class="play-ring"><svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg></div>
            <div class="video-label">${v.title}</div>
          </div>
        </div>`
      ).join('');
    }

    // Sketch
    const skGrid = document.querySelector('#acc-sk .video-grid');
    if (skGrid) {
      skGrid.innerHTML = videos.sketch.map((v, i) => {
        const videoId = v.id || 'wB4jX87odgw';
        return `<div class="video-card" onclick="openVideoModal('${videoId}', 'sketch', ${i})" style="width:calc(33.333% - 0.8rem);">
          <img loading="lazy" decoding="async" src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="${v.title}" onerror="this.onerror=null;this.style.display='none'">
          <div class="video-overlay">
            <div class="play-ring"><svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg></div>
            <div class="video-label">${v.title}</div>
          </div>
        </div>`;
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