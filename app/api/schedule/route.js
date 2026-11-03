import scheduleStore from "../../../lib/schedule-store.cjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const { getScheduleStore, readJson, apiError } = scheduleStore;

export async function GET() {
  try {
    const entries = await getScheduleStore().list();
    return Response.json({ status: "ok", entries });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request) {
  try {
    const body = await readJson(request);
    const entry = await getScheduleStore().create(body);
    return Response.json({ entry }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
