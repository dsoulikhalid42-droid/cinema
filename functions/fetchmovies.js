export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const endpoint = searchParams.get('endpoint');

  // التحقق من وجود الـ endpoint في رابط الطلب
  if (!endpoint) {
    return new Response(JSON.stringify({ error: "Missing endpoint" }), { status: 400 });
  }

  // جلب مفتاح الـ API من الـ Environment Variables في Cloudflare
  const TMDB_API_KEY = context.env.TMDB_API_KEY;

  if (!TMDB_API_KEY) {
    return new Response(JSON.stringify({ error: "API Key not configured in Cloudflare settings" }), { status: 500 });
  }

  // بناء الرابط الموجه لـ TMDB
  const url = new URL(`https://api.themoviedb.org/3/${endpoint}`);
  url.searchParams.set('api_key', TMDB_API_KEY);

  // تمرير أي بارامترات إضافية تلقائياً (مثل اللغة العربية، رقم الصفحة، إلخ)
  for (const [key, value] of searchParams.entries()) {
    if (key !== 'endpoint') {
      url.searchParams.set(key, value);
    }
  }

  try {
    const response = await fetch(url.toString());
    const data = await response.json();

    // إرجاع البيانات للموقع مع تفعيل الـ CORS
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch data from TMDB" }), { status: 500 });
  }
}
