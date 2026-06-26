async function renderHomeView() {
    appContainer.innerHTML = '<div style="text-align:center; padding:120px 0;"><i class="fas fa-circle-notch fa-spin fa-2x teal-glow-text"></i></div>';
    
    const trendingData = await api.getTrending();
    const recommendedData = await api.getRecommended();
    
    // Updated Error Handler
    if (!trendingData || !recommendedData || recommendedData.length === 0) {
        appContainer.innerHTML = `
            <div style="text-align:center; padding:80px 5%; line-height:1.6;">
                <h3 style="color: #ff4444;">⚠️ API Connection Failed</h3>
                <p>Please double-check that your TMDB_API_KEY is pasted correctly inside config.js</p>
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
