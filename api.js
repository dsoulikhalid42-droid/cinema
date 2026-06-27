// api.js
async function fetchFromTMDB(endpoint, extraParams = '') {
    try {
        const url = `${CONFIG.BASE_URL}${endpoint}?api_key=${CONFIG.TMDB_API_KEY}${extraParams}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('API connection failed');
        return await response.json();
    } catch (error) {
        console.error('Network Error:', error);
        return null;
    }
}

const api = {
    getTrending: () => fetchFromTMDB('/trending/all/day'), 
    
    getRecommended: async () => {
        const p1 = fetchFromTMDB('/trending/movie/week', '&page=1');
        const p2 = fetchFromTMDB('/trending/tv/week', '&page=1');
        const p3 = fetchFromTMDB('/discover/movie', '&sort_by=popularity.desc&page=2');
        const p4 = fetchFromTMDB('/discover/tv', '&sort_by=popularity.desc&page=2');
        const [r1, r2, r3, r4] = await Promise.all([p1, p2, p3, p4]);
        
        let mixed = [];
        if (r1?.results) mixed.push(...r1.results);
        if (r2?.results) mixed.push(...r2.results);
        if (r3?.results) mixed.push(...r3.results);
        if (r4?.results) mixed.push(...r4.results);
        
        return mixed.sort(() => 0.5 - Math.random());
    },
    
    getDetails: (id, type) => fetchFromTMDB(`/${type}/${id}`, '&append_to_response=credits'),
    getSeasonDetails: (tvId, seasonNumber) => fetchFromTMDB(`/tv/${tvId}/season/${seasonNumber}`),
    getSimilar: (id, type) => fetchFromTMDB(`/${type}/${id}/similar`),
    search: (query) => fetchFromTMDB('/search/multi', `&query=${encodeURIComponent(query)}`)
};
