import scheduleStore from "../../../../lib/schedule-store.cjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const { getScheduleStore, readJson, apiError } = scheduleStore;

export async function PATCH(request, context) {
  try {
    const { id } = await context.params;
    const body = await readJson(request);
    const entry = await getScheduleStore().update(id, body);
    return Response.json({ entry });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request, context) {
  try {
    const { id } = await context.params;
    await getScheduleStore().remove(id);
    return Response.json({ status: "ok" });
  } catch (error) {
    return apiError(error);
  }
}
