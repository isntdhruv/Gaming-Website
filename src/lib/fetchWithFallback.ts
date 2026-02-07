export async function fetchWithFallback(endpoint: string, fallback: any[] = []) {
  let data: any[] = fallback;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error('backend missing');
    data = await res.json();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log('Using local fallback data');
  }

  return data;
}
