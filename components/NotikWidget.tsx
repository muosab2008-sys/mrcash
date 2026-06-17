'use client';

import { useEffect } from 'react';

interface NotikWidgetProps {
  userId: string; // 🔥 نمرر الـ UID الحقيقي للمستخدم هنا ديناميكياً
}

export default function NotikWidget({ userId }: NotikWidgetProps) {
  useEffect(() => {
    // 1. تحميل السكريبت الخاص بـ Notik تلقائياً عند فتح الصفحة
    const script = document.createElement('script');
    script.src = 'https://notik.me/js/widget.js'; // رابط السكريبت الرسمي من Notik
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // تنظيف السكريبت عند إغلاق الصفحة
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="w-full my-6 p-4 bg-gray-900 rounded-xl shadow-lg text-white">
      <h2 className="text-xl font-bold mb-4 text-center">🔥 Trending Offers (Notik)</h2>
      
      {/* 2. 🔥 الـ Div السحري اللي Notik بتقرأ منه البيانات وتطبع جواته العروض */}
      <div 
        className="notik-live-widget"
        data-api-key="NofGnODVnHB3werypR5PRKx5ew8fTbB4" // الـ API Key حقك المكتوب بالتوثيق
        data-pub-id="Yog41D"                             // الـ Publisher ID حقك
        data-app-id="psPQDvAS3y"                         // الـ App ID حق Mr.Cash
        data-user-id={userId}                            // 🚀 هنا يمر الـ UID حق أي مستخدم يدخل الموقع تلقائياً!
        data-layout="grid"                               // شكل العرض (grid, vertical, horizontal)
        data-title="Earn MC Points Now"
      >
        {/* رسالة مؤقتة تظهر حتى يتم تحميل العروض */}
        <p className="text-center text-gray-400 animate-pulse">Loading amazing offers...</p>
      </div>
    </div>
  );
}
