import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  CONTENT_FILE_BUCKET,
  parseContentStorageReference,
} from "@/utils/content-file-storage";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type DownloadRouteContext = {
  params: Promise<{ contentId: string }>;
};

function notFound() {
  return new Response("Document introuvable.", { status: 404 });
}

export async function GET(request: Request, { params }: DownloadRouteContext) {
  const { contentId } = await params;

  if (!uuidPattern.test(contentId)) {
    return notFound();
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: content, error } = await supabase
    .from("contents")
    .select("file_url")
    .eq("id", contentId)
    .maybeSingle();

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  if (!content?.file_url) {
    return notFound();
  }

  const storageReference = parseContentStorageReference(content.file_url);

  if (!storageReference) {
    return notFound();
  }

  if (storageReference.bucket !== CONTENT_FILE_BUCKET) {
    return notFound();
  }

  const adminSupabase = createServiceSupabaseClient();
  const { data, error: signedUrlError } = await adminSupabase.storage
    .from(storageReference.bucket)
    .createSignedUrl(storageReference.path, 300, {
      download: true,
    });

  if (signedUrlError || !data?.signedUrl) {
    return new Response(
      signedUrlError?.message ?? "Impossible d'ouvrir le document.",
      { status: 500 },
    );
  }

  return NextResponse.redirect(data.signedUrl);
}
