/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
   serverExternalPackages:['@better-auth/kysely-adapter','kysely'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allows all HTTPS domains
      },
      {
        protocol: 'http',
        hostname: '**', // Allows all HTTP domains
      },
    ],
  },
  reactCompiler: true,
};

export default nextConfig;