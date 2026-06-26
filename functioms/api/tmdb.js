export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    
    const targetPath = url.searchParams.get('endpoint');
    if (!targetPath) {
        return new Response(JSON.stringify({ error: "Missing endpoint" }), { 
            status: 400, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }

    const tmdbUrl = new URL(`https://api.themoviedb.org/3${targetPath}`);
    
    if (!env.TMDB_API_KEY) {
        return new Response(JSON.stringify({ error: "TMDB_API_KEY environment variable is missing." }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }

    tmdbUrl.searchParams.set('api_key', env.TMDB_API_KEY);
    
    url.searchParams.forEach((value, key) => {
        if (key !== 'endpoint') {
            tmdbUrl.searchParams.append(key, value);
        }
    });

    try {
        const response = await fetch(tmdbUrl.toString());
        const data = await response.json();
        
        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' 
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to communicate with TMDB" }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }
}
