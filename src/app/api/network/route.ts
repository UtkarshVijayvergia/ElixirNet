import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiUrl = `https://hackutd2025.eog.systems/api/Information/network`;
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch network data: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Could not fetch network data:`, error);
    return NextResponse.json({ error: 'Failed to fetch network data' }, { status: 500 });
  }
}
