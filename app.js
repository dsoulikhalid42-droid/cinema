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

document.getElementById('search-desk').addEventListener('submit', (e) => {
    e.preventDefault();
    const query = document.getElementById('search-input-desk').value.trim();
    if (query) window.location.hash = `#search/${query}`;
});

// TRENDING: Built with proper padding wrapper to lock 16:9 ratio
function genTrendCard(item) {
    const type = item.media_type || 'movie';
    const title = item.title || item.name || 'Untitled';
    const genreText = type === 'movie' ? 'movie' : 'tv show';
    const imgPath = item.backdrop_path ? CONFIG.IMG_URL + item.backdrop_path : 'https://via.placeholder.com/600x337/111/fff?text=No+Image';
    
    return `
        <a href="#${type}/${item.id}" class="f-trend-card">
            <div class="f-trend-img-wrap">
                <img src="${imgPath}" loading="lazy">
                <div class="f-trend-overlay">
                    <div class="f-trend-title">${title}</div>
                    <div class="f-trend-genre">${genreText}</div>
                </div>
            </div>
        </a>
    `;
}

// RECOMMENDED: Built with proper padding wrapper to lock 2:3 vertical ratio
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
                <img src="${imgPath}" loading="lazy">
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

async function renderHomeView() {
    appContainer.innerHTML = '<div style="text-align:center; padding:120px 0;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color: var(--accent);"></i></div>';
    
    const trendingData = await api.getTrending();
    const recommendedData = await api.getRecommended();
    
    if (!trendingData || !recommendedData) return;

    rotationalItems = trendingData.results.filter(i => i.backdrop_path).slice(0, 8);
    const trendList = trendingData.results.filter(i => i.backdrop_path).slice(0, 15);
    const gridList = recommendedData.filter(i => i.poster_path).slice(0, 60);

    appContainer.innerHTML = `
        <div id="f-hero-mount" class="f-hero-wrapper"></div>
        
        <h2 class="f-sec-title f-sec-center"><i class="fas fa-fire"></i> Trending Now <i class="fas fa-fire"></i></h2>
        <div class="f-trend-slider">
            ${trendList.map(item => genTrendCard(item)).join('')}
        </div>

        <h2 class="f-sec-title f-sec-left"><i class="fas fa-play"></i> RECOMMENDED</h2>
        <div class="f-grid">
            ${gridList.map(item => genGridCard(item, 'movie')).join('')}
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
    }, 4000);
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
                <span>1h 55m</span>
            </div>
            <div class="f-hero-genre">horror • thriller</div>
            <button class="f-btn-play" onclick="window.location.hash='#${type}/${item.id}'">
                <i class="fas fa-play"></i> Watch Now
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

    appContainer.innerHTML = `
        <div id="f-detail-hero" class="f-hero-wrapper" style="background-image: url('${CONFIG.IMG_URL_ORIGINAL}${item.backdrop_path}'); background-size: cover; background-position: center;">
            <div class="f-hero-gradient"></div>
            <div class="f-hero-content" style="height: 100%; justify-content: flex-end;">
                <h1 class="f-hero-title">${title}</h1>
                <button class="f-btn-play" onclick="startVideo()">
                    <i class="fas fa-play"></i> Watch Now
                </button>
            </div>
        </div>

        <div id="f-player-mount" class="f-player-wrap"></div>
        <div class="f-overview"><p>${item.overview}</p></div>

        <h2 class="f-sec-title f-sec-left"><i class="fas fa-play"></i> More Like This</h2>
        <div class="f-grid">
            ${similar?.results.slice(0, 18).map(sim => genGridCard(sim, type)).join('') || '<p>No similar items.</p>'}
        </div>
    `;
}

window.startVideo = function() {
    document.getElementById('f-detail-hero').style.display = 'none';
    const player = document.getElementById('f-player-mount');
    player.style.display = 'block';
    const { id, type } = currentMediaState;
    player.innerHTML = `<iframe src="https://vidsrc.to/embed/${type}/${id}" allowfullscreen></iframe>`;
};

async function renderSearchView(query) {
    appContainer.innerHTML = '<div style="text-align:center; padding:100px 0;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color: var(--accent);"></i></div>';
    const data = await api.search(query);
    appContainer.innerHTML = `
        <h2 class="f-sec-title f-sec-left" style="margin-top:100px;">Results: "${decodeURIComponent(query)}"</h2>
        <div class="f-grid">
            ${data?.results.filter(i => i.poster_path).map(item => genGridCard(item, item.media_type)).join('')}
        </div>
    `;
}
