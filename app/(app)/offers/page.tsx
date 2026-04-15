import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";

// تعريف نوع البيانات القادمة من Offery
interface Offer {
  offer: {
    id: string;
    name: string;
    description: string;
    image: string;
  };
  payout: {
    reward: string;
    currency: string;
  };
  devices: string[];
  url: string;
}

export default async function OffersPage() {
  // 1. التحقق من المستخدم
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;
  const API_KEY = process.env.OFFERY_API_KEY;

  // 2. كشف نوع الجهاز من الـ Headers
  const userAgent = headers().get("user-agent") || "";
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

  let offers: Offer[] = [];
  
  try {
    // 3. جلب البيانات باستخدام المفتاح اللي أضفته في Vercel
    const res = await fetch(`https://offery.io/api/?apikey=${API_KEY}`, {
      next: { revalidate: 300 }, // تحديث كل 5 دقائق
    });
    
    const result = await res.json();
    
    if (result.status === "success" && result.data) {
      // 4. الترتيب من المكافأة الأعلى إلى الأقل (التحدي اللي طلبته)
      offers = result.data.sort((a: Offer, b: Offer) => 
        parseFloat(b.payout.reward) - parseFloat(a.payout.reward)
      );
    }
  } catch (error) {
    console.error("خطأ في جلب البيانات:", error);
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-white">
      {/* قسم الفلاتر العلوية - نفس ثيم EarnG */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-4 items-center">
             <h1 className="text-xl font-bold text-green-500">العروض المباشرة</h1>
             <div className="hidden md:flex gap-2 text-xs">
                <span className={`px-3 py-1 rounded-full border ${isAndroid ? 'border-green-500 text-green-500' : 'border-gray-700 text-gray-500'}`}>Android</span>
                <span className={`px-3 py-1 rounded-full border ${isIOS ? 'border-green-500 text-green-500' : 'border-gray-700 text-gray-500'}`}>iOS</span>
             </div>
          </div>
          <div className="text-sm text-gray-400">
             مرتبة حسب: <span className="text-green-500">الأعلى مكافأة</span>
          </div>
        </div>
      </div>

      {/* منطقة عرض العروض */}
      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        {offers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {offers.map((item) => (
              <div 
                key={item.offer.id} 
                className="group bg-[#111] border border-gray-800 rounded-2xl overflow-hidden hover:border-green-500/50 transition-all duration-300 shadow-2xl"
              >
                {/* الصورة مع أيقونة الجهاز */}
                <div className="relative h-48 w-full bg-[#1a1a1a]">
                  <img 
                    src={item.offer.image} 
                    alt={item.offer.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    {item.devices.includes("Android") && <span className="bg-black/80 p-1 rounded">🤖</span>}
                    {item.devices.includes("iOS") && <span className="bg-black/80 p-1 rounded">🍎</span>}
                  </div>
                </div>

                {/* تفاصيل العرض */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white mb-2 truncate">{item.offer.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 h-8 mb-4">
                    {item.offer.description}
                  </p>
                  
                  <div className="flex items-center justify-between border-t border-gray-800 pt-4">
                    <div className="flex flex-col">
                       <span className="text-[10px] text-gray-400 font-bold uppercase">المكافأة</span>
                       <span className="text-green-500 font-black text-lg">{item.payout.reward}</span>
                    </div>
                    
                    {/* الرابط السحري اللي يحول النقاط لليوزر */}
                    <a 
                      href={item.url.replace("USER_ID", userId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 hover:bg-green-500 text-black font-bold px-5 py-2 rounded-xl transition-all active:scale-95 text-sm"
                    >
                      ابدأ الآن
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">يتم سحب أحدث العروض من Offery...</p>
          </div>
        )}
      </main>
    </div>
  );
}
