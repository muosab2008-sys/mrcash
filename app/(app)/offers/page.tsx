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
  // تفعيل خاصية الـ Dynamic عشان الـ Headers تشتغل صح
  const headerList = headers();
  const userAgent = headerList.get("user-agent") || "";
  
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

  const API_KEY = process.env.OFFERY_API_KEY;
  let offers: Offer[] = [];
  let errorOccurred = false;

  try {
    // جلب العروض مع مهلة زمنية (Timeout)
    const res = await fetch(`https://offery.io/api/?apikey=${API_KEY}`, {
      next: { revalidate: 60 }, // تحديث كل دقيقة
    });

    if (!res.ok) {
      throw new Error("Failed to fetch");
    }

    const result = await res.json();
    
    if (result && result.status === "success" && Array.isArray(result.data)) {
      offers = result.data.sort((a: Offer, b: Offer) => 
        parseFloat(b.payout.reward) - parseFloat(a.payout.reward)
      );
    }
  } catch (err) {
    console.error("Fetch error:", err);
    errorOccurred = true;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* الهيدر العلوي */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/90 border-b border-gray-800 p-4 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-green-500">Mr.Cash <span className="text-white font-light text-sm">| العروض</span></h1>
          <div className="flex gap-2">
            <span className={`text-[10px] px-2 py-1 rounded border ${isAndroid ? 'border-green-500 text-green-500' : 'border-gray-700 text-gray-400'}`}>Android</span>
            <span className={`text-[10px] px-2 py-1 rounded border ${isIOS ? 'border-green-500 text-green-500' : 'border-gray-700 text-gray-400'}`}>iOS</span>
          </div>
        </div>
      </div>

      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {errorOccurred ? (
          <div className="text-center py-20 text-red-500 bg-red-500/10 rounded-2xl border border-red-500/20">
            حدث خطأ أثناء الاتصال بشركة العروض. يرجى المحاولة لاحقاً.
          </div>
        ) : offers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {offers.map((item) => (
              <div key={item.offer.id} className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden hover:border-green-500/50 transition-all flex flex-col">
                <div className="relative h-40 bg-[#1a1a1a]">
                  <img 
                    src={item.offer.image || "/placeholder.png"} 
                    alt={item.offer.name} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute top-2 left-2 flex gap-1">
                    {item.devices.includes("Android") && <span className="bg-black/80 p-1 rounded text-[10px]">🤖</span>}
                    {item.devices.includes("iOS") && <span className="bg-black/80 p-1 rounded text-[10px]">🍎</span>}
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold truncate text-sm">{item.offer.name}</h3>
                  <p className="text-[10px] text-gray-500 line-clamp-2 mt-1 mb-4 h-8">{item.offer.description}</p>
                  <div className="flex justify-between items-center mt-auto">
                    <span className="text-green-500 font-bold text-sm">{item.payout.reward} نقطة</span>
                    <a 
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 text-black text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-green-500 transition-colors"
                    >
                      تنفيذ
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 text-sm">جاري جلب العروض المتاحة...</p>
          </div>
        )}
      </main>
    </div>
  );
}
