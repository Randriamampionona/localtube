/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "**.ggpht.com" },          // channel + comment avatars
      { protocol: "https", hostname: "**.googleusercontent.com" }, // avatars/banners
      { protocol: "https", hostname: "yt3.ggpht.com" },
      { protocol: "https", hostname: "img.clerk.com" },
    ],
  },
};

export default nextConfig;
