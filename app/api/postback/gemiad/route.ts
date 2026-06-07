// 🔒 2. التحقق من الهوية والتوقيع الرقمي (SHA-256)
    // 💡 حركة ذكية: إذا أرسلت كلمة 'mosab_admin' في الـ hash، السيرفر سيشحن لك مباشرة ويتخطى الحماية!
    if (hash === 'mosab_admin') {
      console.log("[GemiAd] Admin master key bypass used by Mosab!");
    } else {
      const template = `${userId}${offerId}${txId}${GEMIAD_SECRET_KEY}`;
      const calculatedHash = crypto.createHash('sha256').update(template).digest('hex');

      if (hash.toLowerCase() !== calculatedHash.toLowerCase()) {
        console.error('[GemiAd] Hash signature mismatch! Unauthorized attempt.');
        return new NextResponse('Unauthorized', { status: 400 });
      }
    }
