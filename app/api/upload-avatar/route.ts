import { type NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID || "mrcash-com",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const bucket = getStorage().bucket(process.env.FIREBASE_STORAGE_BUCKET || "mrcash-com.firebasestorage.app");
const adminDb = getFirestore();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "No user ID provided" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type. Please use PNG or JPEG only." }, { status: 400 });
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size is too large. Maximum limit is 2MB." }, { status: 400 });
    }

    const extension = file.type === "image/png" ? "png" : "jpg";
    const filename = `avatars/${userId}-${Date.now()}.${extension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileRef = bucket.file(filename);
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        cacheControl: "public, max-age=31536000",
      },
    });

    try {
      await fileRef.makePublic();
    } catch (e) {
      console.log("Storage ACL error fallback triggered");
    }

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    // تحديث البيانات مع تحديد نوع الأفتار أنه "custom" لكي لا نخلطه مع الأرقام الـ 80 الافتراضية
    await adminDb.collection("users").doc(userId).update({
      photoURL: publicUrl,
      avatarType: "custom"
    });

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error("Avatar upload error details:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload image. Please try again." },
      { status: 500 }
    );
  }
}
