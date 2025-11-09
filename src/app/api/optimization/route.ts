import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiUrl = `http://localhost:8000/api/optimization/run`;
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch optimization data: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Could not fetch optimization data:`, error);
    return NextResponse.json({ error: 'Failed to fetch optimization data' }, { status: 500 });
  }
}
