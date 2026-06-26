// app.js
const appContainer = document.getElementById('app');

// State Engine Variables
let currentVideoMetadata = { id: '', type: '', season: '1', episode: '1' };

// Router Controller
function handleRouting() {
    const hash = window.location.hash || '#home';
    window.scrollTo(0, 0);
    
    if (hash === '#home') {
        renderHomeView();
    } else if (hash === '#movies') {
        renderExploreView('movie');
    } else if (hash === '#tv') {
        renderExploreView('tv');
    } else if (hash.startsWith('#movie/') || hash.startsWith('#tv/')) {
        const components = hash.substring(1).split('/');
        const type = components[0];
        const id = components[1];
        renderDetailsView(id, type);
    } else if (hash.startsWith('#search/')) {
        const query = hash.substring(8);
        renderSearchView(query);
    } else if (hash === '#search') {
        appContainer.innerHTML = `<div style="padding:40px 5%; margin-top:40px; text-align:center;">Use the search bar above to query media items.</div>`;
    }
}

window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', handleRouting);

// Global UI Setup Hooks
document.getElementById('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const query = document.getElementById('search-input').value.trim();
    if (query) window.location.hash = `#search/${query}`;
});

// Navigation Drawer Interactivity
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const closeMenuBtn = document.getElementById('close-menu-btn');
const mobileDrawer = document.getElementById('mobile-drawer');
const drawerOverlay = document.getElementById('drawer-overlay');

function toggleMenu() {
    mobileDrawer.classList.toggle('active');
    drawerOverlay.classList.toggle('active');
}
mobileMenuBtn.addEventListener('click', toggleMenu);
closeMenuBtn.addEventListener('click', toggleMenu);
drawerOverlay.addEventListener('click', toggleMenu);
document.querySelectorAll('.drawer-link').forEach(link => link.addEventListener('click', toggleMenu));

// HTML Card Matrix Builder
function createCardElement(item, explicitType) {
    const type = explicitType || item.media_type || 'movie';
    const title = item.title || item.name || 'Untitled';
    const year = (item.release_date || item.first_air_date || '----').substring(0, 4);
    const badgeType = type === 'movie' ? 'Movie' : 'TV';
    
    return `
        <a href="#${type}/${item.id}" class="movie-card">
            <div class="img-wrapper">
                <span class="card-badge">HD</span>
                <img src="${item.poster_path ? CONFIG.IMG_URL + item.poster_path : 'https://via.placeholder.com/500x750?text=No+Poster'}" alt="${title}" class="card-img" loading="lazy">
            </div>
            <div class="card-info">
                <div class="card-meta">
                    <span>${year}</span>
                    <span>${badgeType}</span>
                </div>
                <h3 class="card-title">${title}</h3>
            </div>
        </a>
    `;
}

// UI Views Generators
async function renderHomeView() {
    appContainer.innerHTML = '<div style="text-align:center; padding:100px 0;"><i class="fas fa-spinner fa-spin fa-2x teal-text"></i></div>';
    const trending = await api.getTrending();
    const recommended = await api.getPopularMovies();

    if (!trending || !recommended) {
        appContainer.innerHTML = '<p style="text-align:center; padding:50px;">API communication issue. Please deploy changes and re-verify variables.</p>';
        return;
    }

    const banner = trending.results[0];

    appContainer.innerHTML = `
        <div class="hero animate-fade" style="background-image: url('${CONFIG.IMG_URL_ORIGINAL}${banner.backdrop_path}')">
            <div class="hero-overlay"></div>
            <div class="hero-content">
                <h1 class="hero-title">${banner.title || banner.name}</h1>
                <div class="meta-tags">
                    <span class="badge">HD</span>
                    <span class="badge-outline">${(banner.release_date || banner.first_air_date || '').substring(0, 4)}</span>
                    <span><i class="fas fa-star" style="color:gold;"></i> ${banner.vote_average ? banner.vote_average.toFixed(1) : 'N/A'}</span>
                </div>
                <a href="#${banner.media_type || 'movie'}/${banner.id}" class="btn-play">
                    <i class="fas fa-play"></i> Watch Now
                </a>
            </div>
        </div>

        <h2 class="section-title"><i class="fas fa-bolt"></i> Trending Now</h2>
        <div class="scroll-container animate-fade">
            ${trending.results.slice(1, 12).map(item => createCardElement(item)).join('')}
        </div>

        <h2 class="section-title"><i class="fas fa-heart"></i> Recommended For You</h2>
        <div class="grid-container animate-fade">
            ${recommended.results.slice(0, 12).map(item => createCardElement(item, 'movie')).join('')}
        </div>
    `;
}

async function renderExploreView(type) {
    appContainer.innerHTML = '<div style="text-align:center; padding:100px 0;"><i class="fas fa-spinner fa-spin fa-2x teal-text"></i></div>';
    const data = type === 'movie' ? await api.getPopularMovies() : await api.getPopularTV();
    
    appContainer.innerHTML = `
        <h2 class="section-title" style="margin-top:100px; text-transform: capitalize;"><i class="fas fa-compass"></i> Popular ${type === 'movie' ? 'Movies' : 'TV Shows'}</h2>
        <div class="grid-container animate-fade">
            ${data.results.map(item => createCardElement(item, type)).join('')}
        </div>
    `;
}

async function renderSearchView(query) {
    appContainer.innerHTML = '<div style="text-align:center; padding:100px 0;"><i class="fas fa-spinner fa-spin fa-2x teal-text"></i></div>';
    const data = await api.search(query);
    
    appContainer.innerHTML = `
        <h2 class="section-title" style="margin-top:100px;"><i class="fas fa-search"></i> Search Results: "${decodeURIComponent(query)}"</h2>
        <div class="grid-container animate-fade">
            ${data && data.results.length ? data.results.filter(i => i.poster_path).map(item => createCardElement(item)).join('') : '<p style="padding:0 5%;">No matching items discovered.</p>'}
        </div>
    `;
}

async function renderDetailsView(id, type) {
    appContainer.innerHTML = '<div style="text-align:center; padding:100px 0;"><i class="fas fa-spinner fa-spin fa-2x teal-text"></i></div>';
    const item = await api.getDetails(id, type);
    if (!item) return;

    currentVideoMetadata = { id, type, season: '1', episode: '1' };

    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date || '----').substring(0, 4);
    const overview = item.overview || 'No presentation copy provided.';
    const director = item.credits?.crew?.find(c => c.job === 'Director')?.name || 'N/A';
    const cast = item.credits?.cast?.slice(0, 4).map(c => c.name).join(', ') || 'N/A';

    let mediaSelectorHTML = '';
    if (type === 'tv') {
        mediaSelectorHTML = `
            <div class="selectors-wrapper">
                <div class="selector-group">
                    <label>Season:</label>
                    <select class="custom-select" id="season-select" onchange="updateEpisodeBounds(this.value)">
                        ${Array.from({ length: item.number_of_seasons || 1 }, (_, i) => `<option value="${i + 1}">Season ${i + 1}</option>`).join('')}
                    </select>
                </div>
                <div class="selector-group">
                    <label>Episode:</label>
                    <select class="custom-select" id="episode-select" onchange="switchEpisode(this.value)">
                        ${Array.from({ length: 24 }, (_, i) => `<option value="${i + 1}">Episode ${i + 1}</option>`).join('')}
                    </select>
                </div>
            </div>
        `;
    }

    appContainer.innerHTML = `
        <div class="detail-view animate-fade">
            <div class="player-container">
                <iframe id="video-engine-frame" src="" allowfullscreen></iframe>
            </div>

            <div class="controls-panel">
                ${mediaSelectorHTML}
                <div class="server-switchers">
                    <span class="server-label"><i class="fas fa-server"></i> Servers:</span>
                    <button class="server-btn active" onclick="loadServerEndpoint(1, this)">Server 1 (VidSrc)</button>
                    <button class="server-btn" onclick="loadServerEndpoint(2, this)">Server 2 (VidFast)</button>
                    <button class="server-btn" onclick="loadServerEndpoint(3, this)">Server 3 (VidSrc.me)</button>
                    <button class="server-btn" onclick="loadServerEndpoint(4, this)">Server 4 (2Embed)</button>
                </div>
            </div>

            <div class="movie-details-info">
                <h1>${title}</h1>
                <div class="meta-tags">
                    <span class="badge">4K</span>
                    <span class="badge-outline">${year}</span>
                    <span style="color:gold;"><i class="fas fa-star"></i> ${item.vote_average ? item.vote_average.toFixed(1) : '0.0'}</span>
                </div>
                <p class="detail-desc">${overview}</p>
                <div class="info-matrix">
                    <div class="matrix-label">Director</div><div>${director}</div>
                    <div class="matrix-label">Starring</div><div>${cast}</div>
                    <div class="matrix-label">Category</div><div style="text-transform:uppercase;">${type}</div>
                </div>
            </div>
        </div>
    `;

    // Fire initialization frame deployment
    executeFrameSourceUpdate(1);
}

// Global scope bindings for inline DOM elements inside dynamic templates
window.loadServerEndpoint = function(serverId, element) {
    document.querySelectorAll('.server-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    executeFrameSourceUpdate(serverId);
};

window.updateEpisodeBounds = function(seasonNum) {
    currentVideoMetadata.season = seasonNum;
    currentVideoMetadata.episode = '1';
    const epSelect = document.getElementById('episode-select');
    if (epSelect) epSelect.value = '1';
    
    const activeServerBtn = document.querySelector('.server-btn.active');
    const currentServerId = activeServerBtn ? Array.from(activeServerBtn.parentNode.children).indexOf(activeServerBtn) : 1;
    executeFrameSourceUpdate(currentServerId);
};

window.switchEpisode = function(epNum) {
    currentVideoMetadata.episode = epNum;
    const activeServerBtn = document.querySelector('.server-btn.active');
    const currentServerId = activeServerBtn ? Array.from(activeServerBtn.parentNode.children).indexOf(activeServerBtn) : 1;
    executeFrameSourceUpdate(currentServerId);
};

function executeFrameSourceUpdate(serverId) {
    const frame = document.getElementById('video-engine-frame');
    if (!frame) return;

    const { id, type, season, episode } = currentVideoMetadata;
    let targetUrl = '';

    if (type === 'movie') {
        switch(serverId) {
            case 1: targetUrl = `https://vidsrc.to/embed/movie/${id}`; break;
            case 2: targetUrl = `https://vidfast.pro/movie/${id}`; break;
            case 3: targetUrl = `https://vidsrc.me/embed/movie?tmdb=${id}`; break;
            case 4: targetUrl = `https://www.2embed.cc/embed/${id}`; break;
        }
    } else {
        switch(serverId) {
            case 1: targetUrl = `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`; break;
            case 2: targetUrl = `https://vidfast.pro/tv/${id}/${season}/${episode}`; break;
            case 3: targetUrl = `https://vidsrc.me/embed/tv?tmdb=${id}&sea=${season}&epi=${episode}`; break;
            case 4: targetUrl = `https://www.2embed.cc/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`; break;
        }
    }

    frame.src = targetUrl;
}
