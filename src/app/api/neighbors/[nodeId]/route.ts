import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { nodeId: string } }
) {
  const nodeId = params.nodeId;
  if (!nodeId) {
    return NextResponse.json({ error: 'nodeId is required' }, { status: 400 });
  }

  try {
    const apiUrl = `https://hackutd2025.eog.systems/api/Information/graph/neighbors/directed/${nodeId}`;
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch neighbor data: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Could not fetch neighbor data for ${nodeId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch neighbor data' }, { status: 500 });
  }
}
