async function fetchFromProxy(endpoint, extraParams = '') {
    try {
        const url = `${CONFIG.BASE_URL}?endpoint=${encodeURIComponent(endpoint)}${extraParams}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            console.error("Proxy Error:", data.error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Network Error:', error);
        return null;
    }
}

const api = {
    getTrending: () => fetchFromProxy('/trending/all/day'), 
    
    getRecommended: async () => {
        const p1 = fetchFromProxy('/discover/movie', '&sort_by=popularity.desc&page=1');
        const p2 = fetchFromProxy('/discover/movie', '&sort_by=popularity.desc&page=2');
        const p3 = fetchFromProxy('/discover/movie', '&sort_by=popularity.desc&page=3');
        const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
        
        let integrated = [];
        if (r1?.results) integrated.push(...r1.results);
        if (r2?.results) integrated.push(...r2.results);
        if (r3?.results) integrated.push(...r3.results);
        return integrated;
    },
    
    getDetails: (id, type) => fetchFromProxy(`/${type}/${id}`, '&append_to_response=credits'),
    getSimilar: (id, type) => fetchFromProxy(`/${type}/${id}/similar`),
    search: (query) => fetchFromProxy('/search/multi', `&query=${encodeURIComponent(query)}`)
};
