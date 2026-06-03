import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// تشغيل مكتبة Resend تلقائياً من المتغير الذي أصلحناه في فيرسيل
const resend = new Resend(process.env.RESEND_API_KEY);

// 1. دالة GET: وظيفتها توجيه المستخدم بعد الضغط على الرابط في الإيميل (كودك الحالي)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");

  const baseUrl = request.nextUrl.origin;
  let redirectPath = "/login";

  if (!oobCode || !mode) {
    return NextResponse.redirect(new URL(redirectPath, baseUrl));
  }

  switch (mode) {
    case "resetPassword":
      redirectPath = `/reset-password?oobCode=${oobCode}&mode=${mode}`;
      break;
    case "verifyEmail":
      redirectPath = `/verify-email?oobCode=${oobCode}&mode=${mode}`;
      break;
    case "recoverEmail":
      redirectPath = `/recover-email?oobCode=${oobCode}&mode=${mode}`;
      break;
    default:
      redirectPath = "/login";
  }

  const response = NextResponse.redirect(new URL(redirectPath, baseUrl));
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  return response;
}

// 2. دالة POST: وظيفتها توليد الرابط وإرسال الإيميل بالقالب المخصص عندما يطلب المستخدم ذلك
export async function POST(request: NextRequest) {
  try {
    const { email, mode, oobCode, username } = await request.json();
    const baseUrl = request.nextUrl.origin;

    // توليد الرابط الفريد الخاص بموقعك والذي سيوجه لدالة GET أعلاه
    const actionLink = `${baseUrl}/api/auth/action?oobCode=${oobCode}&mode=${mode}`;

    let subject = "تنبيه من Mr. Cash";
    let title = "إشعار مخصص";
    let buttonText = "اضغط هنا";
    let description = "يرجى الضغط على الزر أدناه للمتابعة:";

    // تخصيص النصوص بناءً على نوع الطلب (إعادة تعيين أو تفعيل)
    if (mode === "resetPassword") {
      subject = "🔒 إعادة تعيين كلمة المرور - Mr. Cash";
      title = "إعادة تعيين كلمة المرور";
      buttonText = "تعيين كلمة مرور جديدة 🔑";
      description = "لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في منصة Mr. Cash. يمكنك القيام بذلك عبر الضغط على الزر أدناه:";
    } else if (mode === "verifyEmail") {
      subject = "🚀 تفعيل حسابك في منصة Mr. Cash";
      title = "تأكيد البريد الإلكتروني";
      buttonText = "تفعيل الحساب الآن ✨";
      description = "يسعدنا انضمامك إلينا! لتفعيل حسابك والبدء في استخدام كافة ميزات المنصة، يرجى تأكيد بريدك بالضغط أدناه:";
    }

    // 🎨 تخصيص قالب الـ HTML الكامل بألوان وهواية موقعك المتميز
    const emailTemplate = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Mr. Cash</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.8;">بوابتك لإدارة المعاملات بأمان</p>
        </div>
        
        <div style="padding: 30px; background-color: #ffffff; color: #333333; line-height: 1.8; text-align: right;">
          <h2 style="color: #1e3c72; margin-top: 0;">مرحباً ${username || 'بك'}، 👋</h2>
          <p style="font-size: 16px;">${description}</p>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${actionLink}" style="background-color: #2a5298; color: #ffffff; padding: 14px 35px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(42, 82, 152, 0.3); display: inline-block;">${buttonText}</a>
          </div>
          
          <p style="font-size: 13px; color: #666666; background-color: #f9f9f9; padding: 12px; border-radius: 6px; border-right: 4px solid #2a5298; word-break: break-all;">
            إذا لم يعمل الزر، يمكنك نسخ هذا الرابط مباشرة للمتصفح:<br>
            <a href="${actionLink}" style="color: #2a5298;">${actionLink}</a>
          </p>
        </div>
        
        <div style="background-color: #f4f6f9; padding: 15px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #eef2f5;">
          هذه الرسالة أرسلت تلقائياً من موقع mrcash.app. إذا لم تكن أنت من طلب هذا الإجراء، يمكنك تجاهل هذا البريد بأمان.
        </div>
      </div>
    `;

    // إرسال الإيميل الفعلي للمستخدم عبر الدومين الرسمي الموثق في Resend
    await resend.emails.send({
      from: "Mr. Cash <no-reply@mrcash.app>",
      to: [email],
      subject: subject,
      html: emailTemplate,
    });

    return NextResponse.json({ success: true, message: "Email sent successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
