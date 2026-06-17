'use client';

import { useEffect } from 'react';

interface NotikWidgetProps {
  userId: string; // الـ UID الحقيقي للمستخدم ممرر ديناميكياً من الصفحة الأساسية
}

export default function NotikWidget({ userId }: NotikWidgetProps) {
  useEffect(() => {
    // 1. تحميل السكربت الرسمي والحديث لـ Notik المذكور في التوثيق الجديد
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://notik.me/widgets/v1/notik-live-feed.js?v=1.5';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // تنظيف المتصفح عند الخروج من الصفحة
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="w-full my-6 p-4 backdrop-blur-xl bg-background/40 border border-white/10 rounded-2xl shadow-lg text-white">
      
      {/* 2. 🔥 استدعاء الـ Web Component الرسمي الجديد المتوافق مع توثيق Notik لعام 2026 */}
      <notik-live-feed
        api-key="NofGnODVnHB3werypR5PRKx5ew8fTbB4"
        pub-id="Yog41D"
        app-id="psPQDvAS3y"
        user-id={userId}
        layout="grid"
        duration="30d"
        theme="dark"                // تفعيل الوضع الداكن ليتناسب مع موقعك
        primary-color="#117572"     // لون الأزرار والنقاط ليتماشى مع الهوية
        card-bg="#121212"           // خلفية الكروت غامقة
        border-color="#262626"      // حدود الكروت
      >
        <p className="text-center text-gray-400 animate-pulse">Loading amazing offers...</p>
      </notik-live-feed>

    </div>
  );
}

// إعلان التايب لـ TypeScript لتجنب الأخطاء أثناء بناء المشروع (Build)
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'notik-live-feed': any;
    }
  }
}
