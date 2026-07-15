'use client';

import React, { useState, useEffect } from 'react';

export default function ProxyGenerator() {
    const [liveProxyData, setLiveProxyData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);

    // خيارات الإعدادات الخاصة بالبروكسي
    const [country, setCountry] = useState('US');
    const [region, setRegion] = useState('all');
    const [isp, setIsp] = useState('all');
    const [protocol, setProtocol] = useState('http');
    const [authType, setAuthType] = useState('userpass');
    const [sessionTime, setSessionTime] = useState('rotating');
    const [generatedProxy, setGeneratedProxy] = useState('جاري توليد البروكسي...');

    // دالة جلب بيانات البروكسي تلقائياً عند تحميل الصفحة
    useEffect(() => {
        const fetchProxyFromApi = async () => {
            try {
                const res = await fetch('/api/proxy');
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'فشل جلب البيانات من السيرفر');
                }

                if (data && data.length > 0) {
                    const activeProxy = data.find(p => p.status === 'ACTIVE') || data[0];
                    setLiveProxyData(activeProxy);
                } else {
                    throw new Error('لم يتم العثور على أي بروكسيات نشطة لهذا الطلب.');
                }
            } catch (err) {
                setErrorMsg(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProxyFromApi();
    }, []);

    // توليد سطر البروكسي ديناميكياً عند تغير الإعدادات
    useEffect(() => {
        if (!liveProxyData) return;

        const connectIp = liveProxyData.connection.connectIp;
        const httpPort = liveProxyData.connection.httpPort;
        const socksPort = liveProxyData.connection.socks5Port;
        const originalUser = liveProxyData.authentication.username;
        const originalPass = liveProxyData.authentication.password;

        const selectedPort = (protocol === 'socks5') ? socksPort : httpPort;
        let finalUsername = originalUser;

        finalUsername += `_country-${country}`;
        if (country === 'US' && region !== 'all') {
            finalUsername += `_region-${region}`;
        }
        if (isp !== 'all') {
            finalUsername += `_asn-${isp}`;
        }

        if (sessionTime !== 'rotating') {
            const randomSessionId = Math.random().toString(36).substring(2, 10);
            finalUsername += `_session-${randomSessionId}_lifetime-${sessionTime}`;
        }

        let finalLine = "";
        if (authType === 'userpass') {
            finalLine = `${finalUsername}:${originalPass}@${connectIp}:${selectedPort}`;
        } else {
            finalLine = `${connectIp}:${selectedPort}`;
        }

        setGeneratedProxy(finalLine);

    }, [liveProxyData, country, region, isp, protocol, authType, sessionTime]);

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedProxy).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    return (
        <div className="min-h-screen bg-[#090D16] text-slate-200 flex items-center justify-center p-4" style={{ direction: 'rtl' }}>
            <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-3xl w-full max-w-3xl shadow-2xl backdrop-blur-md">
                
                {/* الرأس وحالة الاتصال */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-cyan-400">لوحة تحكم البروكسيات</h1>
                        <p className="text-slate-400 text-xs mt-1">مرتبطة تلقائياً بمفاتيحك واشتراكك الحالي</p>
                    </div>
                    <div className={`text-xs px-3 py-1.5 rounded-full border flex items-center gap-1.5 font-semibold ${
                        isLoading ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        errorMsg ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                        <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : errorMsg ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                        {isLoading ? 'جاري الاتصال بالـ API...' : errorMsg ? 'خطأ في الاتصال' : 'الاشتراك متصل وفعّال'}
                    </div>
                </div>

                {errorMsg && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm mb-6 text-center">
                        ⚠️ {errorMsg}
                    </div>
                )}

                {/* واجهة التحكم */}
                {!isLoading && liveProxyData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="mb-4">
                                <label className="block text-xs font-semibold mb-2 text-slate-400">الدولة:</label>
                                <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-cyan-500">
                                    <option value="US">الولايات المتحدة (US)</option>
                                    <option value="GB">بريطانيا (GB)</option>
                                    <option value="DE">ألمانيا (DE)</option>
                                    <option value="CA">كندا (CA)</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-xs font-semibold mb-2 text-slate-400">الولاية:</label>
                                <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white">
                                    <option value="all">كل الولايات (عشوائي)</option>
                                    <option value="newyork">نيويورك (New York)</option>
                                    <option value="california">كاليفورنيا (California)</option>
                                    <option value="texas">تكساس (Texas)</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-xs font-semibold mb-2 text-slate-400">مزود الشبكة (ISP):</label>
                                <select value={isp} onChange={(e) => setIsp(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white">
                                    <option value="all">أي مزود (عشوائي)</option>
                                    <option value="7018">AT&T (ASN: 7018)</option>
                                    <option value="7922">Comcast (ASN: 7922)</option>
                                    <option value="20115">Charter (ASN: 20115)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <div className="mb-4">
                                <label className="block text-xs font-semibold mb-2 text-slate-400">البروتوكول:</label>
                                <select value={protocol} onChange={(e) => setProtocol(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white">
                                    <option value="http">HTTP / HTTPS</option>
                                    <option value="socks5">SOCKS5</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-xs font-semibold mb-2 text-slate-400">طريقة المصادقة:</label>
                                <select value={authType} onChange={(e) => setAuthType(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white">
                                    <option value="userpass">اسم مستخدم وكلمة مرور</option>
                                    <option value="ipwhitelist">IP Whitelist (بدون كلمة مرور)</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-xs font-semibold mb-2 text-slate-400">زمن استقرار الـ IP:</label>
                                <select value={sessionTime} onChange={(e) => setSessionTime(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white">
                                    <option value="rotating">دوار (تغيير مع كل طلب)</option>
                                    <option value="10m">مثبت 10 دقائق (Sticky 10m)</option>
                                    <option value="30m">مثبت 30 دقيقة (Sticky 30m)</option>
                                    <option value="60m">مثبت ساعة كاملة (Sticky 60m)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* صندوق العرض */}
                <div className="mt-8 bg-slate-950 p-5 rounded-2xl border border-slate-800 relative">
                    <span className="absolute top-2 left-3 text-[10px] text-slate-600 font-mono tracking-wider">GENERATED PROXY</span>
                    <div className="font-mono text-sm text-cyan-400 break-all pt-3 select-all text-left">
                        {isLoading ? 'جاري جلب بيانات اشتراكك من السيرفر...' : generatedProxy}
                    </div>
                </div>

                {/* زر النسخ */}
                <button 
                    onClick={handleCopy}
                    disabled={isLoading || !liveProxyData}
                    className={`w-full mt-6 font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-md transition-all active:scale-[0.98] ${
                        isLoading || !liveProxyData 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                        : copySuccess 
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                        : 'bg-cyan-500 hover:bg-cyan-600 text-slate-950'
                    }`}
                >
                    <span>{copySuccess ? 'تم نسخ السطر بنجاح! ✔️' : 'نسخ إعدادات البروكسي المولد'}</span>
                </button>

            </div>
        </div>
    );
}
