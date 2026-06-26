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

document.getElementById('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const query = document.getElementById('search-input').value.trim();
    if (query) window.location.hash = `#search/${query}`;
});

function generateCardHTML(item, forcedType, isSlider = false) {
    const type = forcedType || item.media_type || 'movie';
    const title = item.title || item.name || 'Untitled';
    const year = (item.release_date || item.first_air_date || '----').substring(0, 4);
    
    return `
        <a href="#${type}/${item.id}" class="movie-card ${isSlider ? 'slider-card' : ''}">
            <div class="img-wrapper">
                <span class="card-hd-badge">HD</span>
                <img src="${item.poster_path ? CONFIG.IMG_URL + item.poster_path : 'https://via.placeholder.com/500x750?text=U4films'}" class="card-img" loading="lazy">
            </div>
            <div class="card-info">
                <div class="card-meta">
                    <span>${year}</span>
                    <span class="type-badge">${type === 'movie' ? 'Movie' : 'TV Show'}</span>
                </div>
                <div class="card-title">${title}</div>
            </div>
        </a>
    `;
}

async function renderHomeView() {
    appContainer.innerHTML = '<div style="text-align:center; padding:120px 0;"><i class="fas fa-circle-notch fa-spin fa-2x teal-glow-text"></i></div>';
    
    const trendingData = await api.getTrending();
    const recommendedData = await api.getRecommended();
    
    if (!trendingData || !recommendedData || recommendedData.length === 0) {
        appContainer.innerHTML = `
            <div style="text-align:center; padding:80px 5%; line-height:1.6;">
                <h3>⚠️ Missing Environment Variable</h3>
                <p>Please add TMDB_API_KEY to your Cloudflare Pages settings and re-deploy.</p>
            </div>`;
        return;
    }

    rotationalItems = trendingData.results.slice(0, 8);
    const trendingSliderItems = trendingData.results.slice(0, 20);

    appContainer.innerHTML = `
        <div id="dynamic-hero-mount"></div>
        
        <h2 class="section-title"><i class="fas fa-fire"></i> Trending Now <i class="fas fa-fire"></i></h2>
        <div class="scroll-container animate-fade">
            ${trendingSliderItems.map(item => generateCardHTML(item, item.media_type, true)).join('')}
        </div>

        <h2 class="section-title"><i class="fas fa-play-circle"></i> RECOMMENDED</h2>
        <div class="grid-container animate-fade">
            ${recommendedData.slice(0, 60).map(item => generateCardHTML(item, 'movie')).join('')}
        </div>
    `;

    paintHeroFrame(rotationalItems[0]);
    heroLoopInterval = setInterval(() => {
        selectedHeroIndex = (selectedHeroIndex + 1) % rotationalItems.length;
        paintHeroFrame(rotationalItems[selectedHeroIndex]);
    }, 4000);
}

function paintHeroFrame(item) {
    const target = document.getElementById('dynamic-hero-mount');
    if (!target) return;

    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date || '').substring(0, 4);
    const vote = item.vote_average ? item.vote_average.toFixed(1) : '8.9';
    const type = item.media_type || 'movie';

    target.innerHTML = `
        <div class="hero animate-fade" style="background-image: url('${CONFIG.IMG_URL_ORIGINAL}${item.backdrop_path}')">
            <div class="hero-overlay"></div>
            <div class="hero-content">
                <h1 class="hero-title">${title}</h1>
                <div class="meta-tags">
                    <span class="badge">4K</span>
                    <span class="badge-outline">TV-MA</span>
                    <span><i class="fas fa-star" style="color:gold;"></i> ${vote}</span>
                    <span>${year}</span>
                </div>
                <div class="genre-text">Action • Drama • Thriller</div>
                <a href="#${type}/${item.id}" class="btn-play">
                    <i class="fas fa-play"></i> Watch Now
                </a>
            </div>
        </div>
    `;
}

async function renderDetailsView(id, type) {
    appContainer.innerHTML = '<div style="text-align:center; padding:100px 0;"><i class="fas fa-circle-notch fa-spin fa-2x"></i></div>';
    
    const item = await api.getDetails(id, type);
    const similar = await api.getSimilar(id, type);
    if (!item) return;

    currentMediaState = { id, type, season: '1', episode: '1' };
    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date || '----').substring(0, 4);
    const vote = item.vote_average ? item.vote_average.toFixed(1) : '0.0';

    appContainer.innerHTML = `
        <div id="interactive-details-panel" class="hero animate-fade" style="background-image: url('${CONFIG.IMG_URL_ORIGINAL}${item.backdrop_path}'); height: 70vh;">
            <div class="hero-overlay"></div>
            <div class="hero-content">
                <h1 class="hero-title">${title}</h1>
                <div class="meta-tags">
                    <span class="badge">4K</span>
                    <span class="badge-outline">HD</span>
                    <span><i class="fas fa-star" style="color:gold;"></i> ${vote}</span>
                    <span>${year}</span>
                </div>
                <div class="genre-text">${item.genres?.map(g => g.name).join(' • ') || 'Entertainment'}</div>
                <button class="btn-play" onclick="mountStreamingFrame()">
                    <i class="fas fa-play"></i> Watch Now
                </button>
            </div>
        </div>

        <div id="video-frame-mount" class="player-container"></div>
        
        <div class="detail-overview">
            <p>${item.overview}</p>
        </div>

        <h2 class="section-title section-title-left"><i class="fas fa-layer-group"></i> More Like This</h2>
        <div class="grid-container">
            ${similar?.results.slice(0, 12).map(sim => generateCardHTML(sim, type)).join('') || '<p style="padding: 0 5%;">No similar items loaded.</p>'}
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
    const data = await api.search(query);
    appContainer.innerHTML = `
        <h2 class="section-title section-title-left" style="margin-top:100px;"><i class="fas fa-search"></i> Results: "${decodeURIComponent(query)}"</h2>
        <div class="grid-container">
            ${data?.results.filter(i => i.poster_path).map(item => generateCardHTML(item, item.media_type)).join('') || '<p>No items found.</p>'}
        </div>
    `;
}
