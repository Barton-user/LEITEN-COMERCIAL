/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Garantiza que el dataset (leído con fs en runtime) se empaquete
  // en la función serverless al desplegar en Vercel.
  experimental: {
    outputFileTracingIncludes: {
      "/api/clientes": ["./data/**"],
      "/ciclo-vida": ["./data/**"],
      "/segmentacion": ["./data/**"],
    },
  },
};

export default nextConfig;
