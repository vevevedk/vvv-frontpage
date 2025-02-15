import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'Analytics endpoint operational' });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ status: 'Analytics tracking not yet implemented' });
}