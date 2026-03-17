export const getApiUrl = (path: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    // If baseUrl is empty, it uses relative path (only works locally or with local API routes)
    // If baseUrl is set (e.g. https://your-backend.onrender.com), it uses that (required for Vercel)
    return `${baseUrl}${path}`;
};
