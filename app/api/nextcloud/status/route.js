export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanUrl(url) {
  return url.replace(/\/+$/, "");
}

export async function GET() {
  const nextcloudUrl =
    process.env.NEXTCLOUD_URL || process.env.NEXT_PUBLIC_NEXTCLOUD_URL;

  if (!nextcloudUrl) {
    return Response.json({
      online: false,
      error: "NEXTCLOUD_URL is not set",
    });
  }

  try {
    const res = await fetch(`${cleanUrl(nextcloudUrl)}/status.php`, {
      cache: "no-store",
    });

    const text = await res.text();

    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = {};
    }

    return Response.json({
      online: res.ok,
      httpStatus: res.status,
      installed: data.installed ?? null,
      maintenance: data.maintenance ?? null,
      needsDbUpgrade: data.needsDbUpgrade ?? null,
      version: data.versionstring || data.version || null,
      productName: data.productname || "Nextcloud",
    });
  } catch (error) {
    return Response.json({
      online: false,
      error: error.message,
    });
  }
}