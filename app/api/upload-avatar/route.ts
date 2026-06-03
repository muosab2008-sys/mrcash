import { type NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/lib/firebase-admin";

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

    // Validate file type - only allow images
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please use PNG or JPEG only." },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size is too large. Maximum limit is 2MB." },
        { status: 400 }
      );
    }

    // Get Firebase instances at runtime
    const adminDb = getAdminDb();
    const storage = getAdminStorage();
    const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET || "mrcash-com.firebasestorage.app");

    // Generate unique filename
    const extension = file.type === "image/png" ? "png" : "jpg";
    const filename = `avatars/${userId}-${Date.now()}.${extension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Firebase Storage
    const fileRef = bucket.file(filename);
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        cacheControl: "public, max-age=31536000",
      },
    });

    // Make the file publicly accessible safely
    try {
      await fileRef.makePublic();
    } catch (e) {
      console.log("Storage ACL error fallback triggered");
    }

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    // Update user document in Firestore
    await adminDb.collection("users").doc(userId).update({
      photoURL: publicUrl,
    });

    return NextResponse.json({ url: publicUrl });
  } catch (error: unknown) {
    console.error("Avatar upload error details:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload image. Please try again.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
