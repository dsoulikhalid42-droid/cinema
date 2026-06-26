// functions/api/tmdb.js
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    
    // Extract target TMDB path
    const targetPath = url.searchParams.get('endpoint');
    if (!targetPath) {
        return new Response(JSON.stringify({ error: "Missing endpoint parameter" }), { 
            status: 400, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }

    // Securely construct the external TMDB URL using the environment variable
    const tmdbUrl = new URL(`https://api.themoviedb.org/3${targetPath}`);
    tmdbUrl.searchParams.set('api_key', env.TMDB_API_KEY);
    
    // Forward any additional parameters (e.g., query, append_to_response)
    url.searchParams.forEach((value, key) => {
        if (key !== 'endpoint') {
            tmdbUrl.searchParams.append(key, value);
        }
    });

    try {
        const response = await fetch(tmdbUrl.toString());
        const data = await response.json();
        
        return new Response(JSON.stringify(data), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' 
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to fetch from upstream API" }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }
}
