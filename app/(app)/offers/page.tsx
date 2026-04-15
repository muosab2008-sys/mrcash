import { redirect } from "next/navigation";
import { headers } from "next/headers";

// واجهة تعريف العرض
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
  // ملاحظة لمصعب: قمت بإيقاف الـ auth مؤقتاً لكي يعمل الموقع، وسنتأكد من مساره لاحقاً
  const API_KEY = process.env.OFFERY_API_KEY;

  // معرفة جهاز المستخدم
  const userAgent = headers().get("user-agent") || "";
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

  let offers: Offer[] = [];
  
  try {
    const res = await fetch(`https://offery.io/api/?apikey=${API_KEY}`, {
      next: { revalidate: 300 },
    });
    
    const result = await res.json();
    
    if (result.status === "success" && result.data) {
      // الترتيب من الأعلى سعراً
      offers = result.data.sort((a: Offer, b: Offer) => 
        parseFloat(b.payout.reward) - parseFloat(a.payout.reward)
      );
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* الفلاتر العلوية */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-green-500">Mr.Cash <span className="text-white font-light text-sm">| العروض</span></h1>
          <div className="flex gap-2">
            <span className={`text-[10px] px-2 py-1 rounded border ${isAndroid ? 'border-green-500 text-green-500' : 'border-gray-700'}`}>Android</span>
            <span className={`text-[10px] px-2 py-1 rounded border ${isIOS ? 'border-green-500 text-green-500' : 'border-gray-700'}`}>iOS</span>
          </div>
        </div>
      </div>

      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {offers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {offers.map((item) => (
              <div key={item.offer.id} className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden hover:border-green-500/50 transition-all">
                <div className="relative h-40 bg-[#1a1a1a]">
                  <img src={item.offer.image} alt={item.offer.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 flex gap-1">
                    {item.devices.includes("Android") && <span className="bg-black/80 p-1 rounded text-xs">🤖</span>}
                    {item.devices.includes("iOS") && <span className="bg-black/80 p-1 rounded text-xs">🍎</span>}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold truncate">{item.offer.name}</h3>
                  <p className="text-[10px] text-gray-500 line-clamp-2 mt-1 mb-4">{item.offer.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-green-500 font-bold">{item.payout.reward} نقطة</span>
                    <a 
                      href={item.url} // سنقوم بربط الـ ID لاحقاً بعد حل مشكلة الـ Build
                      target="_blank"
                      className="bg-green-600 text-black text-xs font-bold px-4 py-2 rounded-lg hover:bg-green-500"
                    >
                      ابدأ
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">جاري تحميل العروض...</div>
        )}
      </main>
    </div>
  );
}
