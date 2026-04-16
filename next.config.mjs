/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ['sharp'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        // Supabase Storage — covers all projects
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/**",
      },
      {
        // Local dev uploads served from public/uploads/
        protocol: "http",
        hostname: "localhost",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        pathname: "/uploads/**",
      },
      {
        // WordPress migrated images from AnalytixLabs
        protocol: "https",
        hostname: "www.analytixlabs.co.in",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
