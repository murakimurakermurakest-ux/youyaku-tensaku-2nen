import { materials } from '../../../lib/materialBank';

export async function GET() {
  return Response.json({
    materials: materials.map((m) => ({ id: m.id, title: m.title, author: m.author })),
  });
}
