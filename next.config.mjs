/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // ضروري جداً للنشر على GitHub Pages
  basePath: '/mrcash', // يجب أن يطابق اسم المستودع تماماً
  images: { unoptimized: true },
};

export default nextConfig;
