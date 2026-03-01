/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // ضروري لإنشاء ملفات HTML ثابتة
  basePath: '/mrcash', // يجب أن يطابق اسم المستودع
  images: { unoptimized: true }, // GitHub Pages لا يدعم تحسين الصور تلقائياً
};

export default nextConfig;
