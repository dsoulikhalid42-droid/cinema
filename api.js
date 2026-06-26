// api.js
async function fetchFromTMDB(endpoint, extraParams = '') {
    try {
        const url = `${CONFIG.BASE_URL}?endpoint=${encodeURIComponent(endpoint)}${extraParams}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Proxy communication structural fault');
        return await response.json();
    } catch (error) {
        console.error('API Context Error:', error);
        return null;
    }
}

const api = {
    getTrending: () => fetchFromTMDB('/trending/all/week'),
    getPopularMovies: () => fetchFromTMDB('/movie/popular'),
    getPopularTV: () => fetchFromTMDB('/tv/popular'),
    getDetails: (id, type) => fetchFromTMDB(`/${type}/${id}`, '&append_to_response=credits,videos'),
    search: (query) => fetchFromTMDB('/search/multi', `&query=${encodeURIComponent(query)}`)
};
