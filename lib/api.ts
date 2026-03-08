export const getApiUrl = (path: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    // If baseUrl is empty, it uses relative path (Vercel serverless)
    // If baseUrl is set (e.g. https://your-app.onrender.com), it uses that
    return `${baseUrl}${path}`;
};
