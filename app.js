const appContainer = document.getElementById('app');

let heroLoopInterval;
let selectedHeroIndex = 0;
let rotationalItems = [];
let currentMediaState = { id: '', type: '', season: '1', episode: '1' };

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

function router() {
    clearInterval(heroLoopInterval); 
    const hash = window.location.hash || '#home';
    window.scrollTo(0, 0);
    
    if (hash === '#home') {
        renderHomeView();
    } else if (hash.startsWith('#movie/') || hash.startsWith('#tv/')) {
        const [type, id] = hash.substring(1).split('/');
        renderDetailsView(id, type);
    } else if (hash.startsWith('#search/')) {
        const query = hash.substring(8);
        renderSearchView(query);
    }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);

// PC Search
document.getElementById('search-form-desktop').addEventListener('submit', (e) => {
    e.preventDefault();
    const query = document.getElementById('search-input-desktop').value.trim();
    if (query) window.location.hash = `#search/${query}`;
});

// Horizontal Trending Backdrops (16:9)
function generateTrendingCard(item) {
    const type = item.media_type || 'movie';
    const title = item.title || item.name || 'Untitled';
    const genreText = type === 'movie' ? 'movie' : 'tv show';
    const imgPath = item.backdrop_path ? CONFIG.IMG_URL + item.backdrop_path : 'https://via.placeholder.com/600x337/111/fff?text=U4films';
    
    return `
        <a href="#${type}/${item.id}" class="trending-card">
            <div class="trending-img-wrapper">
                <img src="${imgPath}" class="trending-img" loading="lazy">
                <div class="trending-overlay">
                    <div class="trending-title">${title}</div>
                    <div class="trending-genre">${genreText}</div>
                </div>
            </div>
        </a>
    `;
}

// Vertical Recommended Posters (2:3)
function generateGridCard(item, forcedType) {
    const type = forcedType || item.media_type || 'movie';
    const title = item.title || item.name || 'Untitled';
    const year = (item.release_date || item.first_air_date || '----').substring(0, 4);
    const imgPath = item.poster_path ? CONFIG.IMG_URL + item.poster_path : 'https://via.placeholder.com/500x750/111/fff?text=U4films';
    
    const duration = type === 'movie' ? '1h 45m' : '45 min';

    return `
        <a href="#${type}/${item.id}" class="poster-card">
            <div class="poster-img-wrapper">
                <span class="hd-badge">HD</span>
                <img src="${imgPath}" class="poster-img" loading="lazy">
            </div>
            <div class="poster-meta">
                <span>${year}</span>
                <span class="type-badge">${type === 'movie' ? 'Movie' : 'TV'}</span>
                <span>${duration}</span>
            </div>
            <div class="poster-title">${title}</div>
        </a>
    `;
}

async function renderHomeView() {
    appContainer.innerHTML = '<div style="text-align:center; padding:120px 0;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color: var(--accent);"></i></div>';
    
    const trendingData = await api.getTrending();
    const recommendedData = await api.getRecommended();
    
    if (!trendingData || !recommendedData) {
        appContainer.innerHTML = `<div style="text-align:center; padding:80px 5%;"><h3 style="color: #ff4444;">API Error</h3><p>Verify config.js key.</p></div>`;
        return;
    }

    rotationalItems = trendingData.results.slice(0, 8);
    const trendingSliderItems = trendingData.results.slice(0, 15);

    appContainer.innerHTML = `
        <div id="dynamic-hero-mount"></div>
        
        <h2 class="section-title section-title-center"><i class="fas fa-fire"></i> TRENDING NOW <i class="fas fa-fire"></i></h2>
        <div class="trending-container">
            ${trendingSliderItems.map(item => generateTrendingCard(item)).join('')}
        </div>

        <h2 class="section-title"><i class="fas fa-play"></i> RECOMMENDED</h2>
        <div class="grid-container">
            ${recommendedData.slice(0, 60).map(item => generateGridCard(item, 'movie')).join('')}
        </div>
    `;

    setupSmoothHero();
}

function setupSmoothHero() {
    const target = document.getElementById('dynamic-hero-mount');
    if (!target) return;

    target.innerHTML = `
        <div id="hero-layer-1" class="hero active"></div>
        <div id="hero-layer-2" class="hero"></div>
    `;

    paintHeroLayer(document.getElementById('hero-layer-1'), rotationalItems[0]);
    
    let activeLayer = 1;
    heroLoopInterval = setInterval(() => {
        selectedHeroIndex = (selectedHeroIndex + 1) % rotationalItems.length;
        const nextItem = rotationalItems[selectedHeroIndex];
        
        const currentDiv = document.getElementById(`hero-layer-${activeLayer}`);
        activeLayer = activeLayer === 1 ? 2 : 1;
        const nextDiv = document.getElementById(`hero-layer-${activeLayer}`);
        
        paintHeroLayer(nextDiv, nextItem);
        nextDiv.classList.add('active');
        currentDiv.classList.remove('active');

    }, 4000);
}

function paintHeroLayer(div, item) {
    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date || '').substring(0, 4);
    const vote = item.vote_average ? item.vote_average.toFixed(1) : '8.9';
    const type = item.media_type || 'movie';

    div.style.backgroundImage = `url('${CONFIG.IMG_URL_ORIGINAL}${item.backdrop_path}')`;
    div.innerHTML = `
        <div class="hero-overlay"></div>
        <div class="hero-content">
            <h1 class="hero-title">${title}</h1>
            <div class="meta-tags">
                <span class="badge-cyan">4K</span>
                <span class="badge-outline">TV-MA</span>
                <span><i class="fas fa-star" style="color: #fff; font-size: 0.6rem;"></i> ${vote}</span>
                <span>${year}</span>
                <span>1h 55m</span>
            </div>
            <div class="hero-genre">horror • thriller</div>
            <button class="btn-play" onclick="window.location.hash='#${type}/${item.id}'">
                <i class="fas fa-play" style="font-size: 0.9rem;"></i> Watch Now
            </button>
        </div>
    `;
}

async function renderDetailsView(id, type) {
    appContainer.innerHTML = '<div style="text-align:center; padding:100px 0;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color: var(--accent);"></i></div>';
    
    const item = await api.getDetails(id, type);
    const similar = await api.getSimilar(id, type);
    if (!item) return;

    currentMediaState = { id, type, season: '1', episode: '1' };
    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date || '----').substring(0, 4);
    const vote = item.vote_average ? item.vote_average.toFixed(1) : '0.0';

    appContainer.innerHTML = `
        <div id="interactive-details-panel" style="position:relative; height: 65vh; background-image: url('${CONFIG.IMG_URL_ORIGINAL}${item.backdrop_path}'); background-size: cover; background-position: center top; display: flex; align-items: flex-end; justify-content: center; text-align: center;">
            <div class="hero-overlay"></div>
            <div class="hero-content">
                <h1 class="hero-title">${title}</h1>
                <div class="meta-tags">
                    <span class="badge-cyan">4K</span>
                    <span class="badge-outline">HD</span>
                    <span><i class="fas fa-star" style="color: #fff; font-size: 0.6rem;"></i> ${vote}</span>
                    <span>${year}</span>
                </div>
                <div class="hero-genre">${item.genres?.map(g => g.name).join(' • ') || 'Media'}</div>
                <button class="btn-play" onclick="mountStreamingFrame()">
                    <i class="fas fa-play" style="font-size: 0.9rem;"></i> Watch Now
                </button>
            </div>
        </div>

        <div id="video-frame-mount" class="player-container"></div>
        
        <div class="detail-overview">
            <p>${item.overview}</p>
        </div>

        <h2 class="section-title section-title-left"><i class="fas fa-play"></i> More Like This</h2>
        <div class="grid-container">
            ${similar?.results.slice(0, 18).map(sim => generateGridCard(sim, type)).join('') || '<p>No similar items found.</p>'}
        </div>
    `;
}

window.mountStreamingFrame = function() {
    document.getElementById('interactive-details-panel').style.display = 'none';
    const playerBox = document.getElementById('video-frame-mount');
    playerBox.style.display = 'block';

    const { id, type, season, episode } = currentMediaState;
    const srcUrl = type === 'movie' 
        ? `https://vidsrc.to/embed/movie/${id}` 
        : `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`;

    playerBox.innerHTML = `<iframe src="${srcUrl}" allowfullscreen></iframe>`;
};

async function renderSearchView(query) {
    appContainer.innerHTML = '<div style="text-align:center; padding:100px 0;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color: var(--accent);"></i></div>';
    const data = await api.search(query);
    appContainer.innerHTML = `
        <h2 class="section-title section-title-left" style="margin-top:100px;">Results: "${decodeURIComponent(query)}"</h2>
        <div class="grid-container">
            ${data?.results.filter(i => i.poster_path).map(item => generateGridCard(item, item.media_type)).join('') || '<p style="padding: 0 5%;">No items found.</p>'}
        </div>
    `;
}
