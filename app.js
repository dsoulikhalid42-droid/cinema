const appContainer = document.getElementById('app');

let heroLoopInterval;
let selectedHeroIndex = 0;
let rotationalItems = [];
let currentMediaState = { id: '', type: '', season: '1', episode: '1' };

function router() {
    clearInterval(heroLoopInterval); 
    const hash = window.location.hash || '#home';
    window.scrollTo(0, 0);
    
    if (hash === '#home') {
        document.title = "U4films - Watch Free Movies & TV Shows";
        renderHomeView();
    } else if (hash.startsWith('#movie/') || hash.startsWith('#tv/')) {
        const [type, id] = hash.substring(1).split('/');
        renderDetailsView(id, type);
    } else if (hash.startsWith('#search/')) {
        const query = hash.substring(8);
        document.title = `Search: ${decodeURIComponent(query)} - U4films`;
        renderSearchView(query);
    }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);

// ---- SEARCH ----
window.toggleMobileSearch = function() {
    const bar = document.getElementById('mobile-search-bar');
    if (bar.style.display === 'none' || bar.style.display === '') {
        bar.style.display = 'block';
        document.getElementById('search-input-mobile').focus();
    } else {
        bar.style.display = 'none';
    }
};

document.getElementById('search-desk').addEventListener('submit', (e) => {
    e.preventDefault();
    const query = document.getElementById('search-input-desk').value.trim();
    if (query) window.location.hash = `#search/${query}`;
});

document.getElementById('search-mobile').addEventListener('submit', (e) => {
    e.preventDefault();
    const query = document.getElementById('search-input-mobile').value.trim();
    if (query) {
        window.location.hash = `#search/${query}`;
        document.getElementById('mobile-search-bar').style.display = 'none';
    }
});

// ---- CARD BUILDERS ----
function genTrendCard(item) {
    const type = item.media_type || 'movie';
    const title = item.title || item.name || 'Untitled';
    const genreText = type === 'movie' ? 'movie' : 'tv show';
    const imgPath = item.backdrop_path ? CONFIG.IMG_URL + item.backdrop_path : 'https://via.placeholder.com/600x337/111/fff?text=No+Image';
    
    return `
        <a href="#${type}/${item.id}" class="f-trend-card">
            <div class="f-trend-img-wrap">
                <img src="${imgPath}" loading="lazy" alt="${title}">
                <div class="f-trend-overlay">
                    <div class="f-trend-title">${title}</div>
                    <div class="f-trend-genre">${genreText}</div>
                </div>
            </div>
        </a>
    `;
}

function genGridCard(item, forcedType) {
    const type = forcedType || item.media_type || 'movie';
    const title = item.title || item.name || 'Untitled';
    const year = (item.release_date || item.first_air_date || '----').substring(0, 4);
    const imgPath = item.poster_path ? CONFIG.IMG_URL + item.poster_path : 'https://via.placeholder.com/500x750/111/fff?text=No+Poster';
    const duration = type === 'movie' ? '1h 45m' : '45 min';

    return `
        <a href="#${type}/${item.id}" class="f-grid-card">
            <div class="f-grid-img-wrap">
                <span class="f-hd-badge">HD</span>
                <img src="${imgPath}" loading="lazy" alt="${title}">
            </div>
            <div class="f-grid-meta">
                <span>${year}</span>
                <span class="f-type-badge">${type === 'movie' ? 'Movie' : 'TV'}</span>
                <span>${duration}</span>
            </div>
            <div class="f-grid-title">${title}</div>
        </a>
    `;
}

// Skeleton Loader HTML
function getSkeletonHTML() {
    return `<div style="padding: 100px 5%; max-width: 800px; margin: 0 auto;">
                <div class="skeleton-box" style="height: 300px; margin-bottom: 20px;"></div>
                <div class="skeleton-box" style="height: 30px; width: 60%; margin-bottom: 10px;"></div>
                <div class="skeleton-box" style="height: 20px; width: 40%;"></div>
            </div>`;
}

// ---- VIEWS ----
async function renderHomeView() {
    appContainer.innerHTML = getSkeletonHTML();
    
    const trendingData = await api.getTrending();
    const recommendedMixed = await api.getRecommended();
    
    if (!trendingData || !recommendedMixed) return;

    rotationalItems = trendingData.results.filter(i => i.backdrop_path).slice(0, 8);
    const trendList = trendingData.results.filter(i => i.backdrop_path).slice(0, 15);
    const gridList = recommendedMixed.filter(i => i.poster_path).slice(0, 60);

    appContainer.innerHTML = `
        <div id="f-hero-mount" class="f-hero-wrapper"></div>
        
        <h2 class="f-sec-title"><i class="fas fa-fire" style="color: var(--accent);"></i> TRENDING</h2>
        <div class="f-trend-slider">
            ${trendList.map(item => genTrendCard(item)).join('')}
        </div>

        <h2 class="f-sec-title"><i class="fas fa-play" style="color: var(--accent);"></i> RECOMMENDED</h2>
        <div class="f-grid">
            ${gridList.map(item => genGridCard(item, item.media_type)).join('')}
        </div>
    `;

    setupHero();
}

function setupHero() {
    const target = document.getElementById('f-hero-mount');
    if (!target) return;

    target.innerHTML = `
        <div id="hero-l1" class="f-hero-slide active"></div>
        <div id="hero-l2" class="f-hero-slide"></div>
    `;

    paintHero(document.getElementById('hero-l1'), rotationalItems[0]);
    
    let activeL = 1;
    heroLoopInterval = setInterval(() => {
        selectedHeroIndex = (selectedHeroIndex + 1) % rotationalItems.length;
        const nextItem = rotationalItems[selectedHeroIndex];
        
        const curr = document.getElementById(`hero-l${activeL}`);
        activeL = activeL === 1 ? 2 : 1;
        const next = document.getElementById(`hero-l${activeL}`);
        
        paintHero(next, nextItem);
        next.classList.add('active');
        curr.classList.remove('active');
    }, 4500);
}

function paintHero(div, item) {
    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date || '').substring(0, 4);
    const vote = item.vote_average ? item.vote_average.toFixed(1) : '8.9';
    const type = item.media_type || 'movie';

    div.style.backgroundImage = `url('${CONFIG.IMG_URL_ORIGINAL}${item.backdrop_path}')`;
    div.innerHTML = `
        <div class="f-hero-gradient"></div>
        <div class="f-hero-content">
            <h1 class="f-hero-title">${title}</h1>
            <div class="f-hero-meta">
                <span class="f-badge-cyan">4K</span>
                <span class="f-badge-out">TV-MA</span>
                <span><i class="fas fa-star" style="color: #fff; font-size: 0.7rem;"></i> ${vote}</span>
                <span>${year}</span>
            </div>
            <div class="f-hero-genre">HD Release</div>
            <button class="f-btn-play" onclick="window.location.hash='#${type}/${item.id}'">
                <i class="fas fa-play"></i> Watch Now
            </button>
        </div>
    `;
}

async function renderDetailsView(id, type) {
    appContainer.innerHTML = getSkeletonHTML();
    
    const item = await api.getDetails(id, type);
    const similar = await api.getSimilar(id, type);
    if (!item) return;

    currentMediaState = { id, type, season: '1', episode: '1' };
    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date || '----').substring(0, 4);
    
    // SEO Update
    document.title = `${title} (${year}) - U4films`;

    // Base Header
    let html = `
        <div id="f-detail-hero" class="f-hero-wrapper" style="background-image: url('${CONFIG.IMG_URL_ORIGINAL}${item.backdrop_path}'); background-size: cover; background-position: center;">
            <div class="f-hero-gradient"></div>
            <div class="f-hero-content" style="height: 100%; justify-content: flex-end;">
                <h1 class="f-hero-title">${title}</h1>
                <div class="f-hero-meta" style="margin-bottom: 20px;">
                    <span class="f-badge-cyan">HD</span>
                    <span>${year}</span>
                    <span><i class="fas fa-star"></i> ${item.vote_average?.toFixed(1) || '0.0'}</span>
                </div>
                ${type === 'movie' ? `<button class="f-btn-play" onclick="startVideo('${id}', 'movie', 1, 1)"><i class="fas fa-play"></i> Watch Movie</button>` : ''}
            </div>
        </div>

        <div id="f-player-mount" class="f-player-wrap"></div>
        <div class="f-overview"><p>${item.overview}</p></div>
    `;

    // TV SHOW EPISODE LOGIC
    if (type === 'tv') {
        const numSeasons = item.number_of_seasons || 1;
        
        // Build Season Dropdown
        html += `<div class="season-selector-wrap">
                    <select class="season-select" id="season-selector" onchange="loadSeasonEpisodes(${id}, this.value)">
                        ${Array.from({ length: numSeasons }, (_, i) => `<option value="${i + 1}">Season ${i + 1}</option>`).join('')}
                    </select>
                 </div>
                 <div id="episodes-container"></div>`;
    }

    // Similar Grid
    html += `
        <h2 class="f-sec-title"><i class="fas fa-layer-group" style="color: var(--accent);"></i> More Like This</h2>
        <div class="f-grid">
            ${similar?.results.slice(0, 18).map(sim => genGridCard(sim, type)).join('') || '<p>No similar items.</p>'}
        </div>
    `;

    appContainer.innerHTML = html;

    // Auto-load Season 1 if it's a TV Show
    if (type === 'tv') {
        loadSeasonEpisodes(id, 1);
    }
}

// ---- TV SHOW EPISODES ENGINE ----
window.loadSeasonEpisodes = async function(tvId, seasonNum) {
    const epContainer = document.getElementById('episodes-container');
    epContainer.innerHTML = `<div style="padding: 20px 5%; text-align:center; color: var(--accent);"><i class="fas fa-circle-notch fa-spin"></i> Loading Episodes...</div>`;
    
    const seasonData = await api.getSeasonDetails(tvId, seasonNum);
    
    if (!seasonData || !seasonData.episodes) {
        epContainer.innerHTML = `<p style="padding: 20px 5%;">Failed to load episodes.</p>`;
        return;
    }

    let epHtml = `<div class="ep-grid">`;
    seasonData.episodes.forEach(ep => {
        const epNum = ep.episode_number;
        const code = `S${String(seasonNum).padStart(2, '0')}E${String(epNum).padStart(2, '0')}`;
        const epTitle = ep.name || `Episode ${epNum}`;
        const imgPath = ep.still_path ? CONFIG.IMG_URL + ep.still_path : 'https://via.placeholder.com/600x337/111/fff?text=No+Image';
        const desc = ep.overview ? (ep.overview.length > 130 ? ep.overview.substring(0, 130) + '...' : ep.overview) : 'No episode description available.';
        const airDate = ep.air_date ? new Date(ep.air_date).toLocaleDateString() : 'Unknown';
        const runtime = ep.runtime ? `${ep.runtime} min` : 'N/A';

        epHtml += `
            <div class="ep-card">
                <div class="ep-img-wrap" onclick="startVideo('${tvId}', 'tv', '${seasonNum}', '${epNum}')">
                    <img src="${imgPath}" loading="lazy" alt="${epTitle}">
                    <div class="ep-play-overlay"><i class="fas fa-play-circle"></i></div>
                </div>
                <div class="ep-info">
                    <h4 class="ep-title">${code} - ${epTitle}</h4>
                    <div class="ep-meta">
                        <span><i class="far fa-calendar-alt"></i> ${airDate}</span>
                        <span><i class="far fa-clock"></i> ${runtime}</span>
                    </div>
                    <p class="ep-desc">${desc}</p>
                    <button class="ep-watch-btn" onclick="startVideo('${tvId}', 'tv', '${seasonNum}', '${epNum}')">
                        Watch Episode
                    </button>
                </div>
            </div>
        `;
    });
    epHtml += `</div>`;
    epContainer.innerHTML = epHtml;
};

// Start Media Player Engine
window.startVideo = function(id, type, season = 1, episode = 1) {
    document.getElementById('f-detail-hero').style.display = 'none';
    const player = document.getElementById('f-player-mount');
    player.style.display = 'block';
    
    // Scroll smoothly to player
    player.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const srcUrl = type === 'movie' 
        ? `https://vidsrc.to/embed/movie/${id}` 
        : `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`;

    player.innerHTML = `<iframe src="${srcUrl}" allowfullscreen></iframe>`;
};

async function renderSearchView(query) {
    appContainer.innerHTML = getSkeletonHTML();
    const data = await api.search(query);
    appContainer.innerHTML = `
        <h2 class="f-sec-title" style="margin-top:50px;">Results: "${decodeURIComponent(query)}"</h2>
        <div class="f-grid">
            ${data?.results.filter(i => i.poster_path).map(item => genGridCard(item, item.media_type)).join('')}
        </div>
    `;
}
