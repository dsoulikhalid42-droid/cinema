async function fetchFromTMDB(endpoint, extraParams = '') {
    try {
        const url = `${CONFIG.BASE_URL}${endpoint}?api_key=${CONFIG.TMDB_API_KEY}${extraParams}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('TMDB communications failure');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

const api = {
    getTrending: () => fetchFromTMDB('/trending/all/day'), 
    
    getRecommended: async () => {
        const p1 = fetchFromTMDB('/discover/movie', '&sort_by=popularity.desc&page=1');
        const p2 = fetchFromTMDB('/discover/movie', '&sort_by=popularity.desc&page=2');
        const p3 = fetchFromTMDB('/discover/movie', '&sort_by=popularity.desc&page=3');
        const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
        
        let integrated = [];
        if (r1?.results) integrated.push(...r1.results);
        if (r2?.results) integrated.push(...r2.results);
        if (r3?.results) integrated.push(...r3.results);
        return integrated;
    },
    
    getDetails: (id, type) => fetchFromTMDB(`/${type}/${id}`, '&append_to_response=credits'),
    getSimilar: (id, type) => fetchFromTMDB(`/${type}/${id}/similar`),
    search: (query) => fetchFromTMDB('/search/multi', `&query=${encodeURIComponent(query)}`)
};
