import workTimeStore from '../../../lib/work-time-store.cjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const {getWorkTimeStore,readJson,apiError} = workTimeStore;
const headers = {'Cache-Control':'no-store'};

export async function GET() {
  try { return Response.json(await getWorkTimeStore().get(),{headers}); }
  catch (error) { return apiError(error); }
}
export async function POST(request) {
  try { return Response.json(await getWorkTimeStore().command(await readJson(request)),{headers}); }
  catch (error) { return apiError(error); }
}
