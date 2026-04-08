'use server';

import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { buildDeepcrawlHeaders } from '@/lib/auth-mode';

const DEEPCRAWL_BASE_URL =
  process.env.DEEPCRAWL_API_URL ||
  process.env.NEXT_PUBLIC_DEEPCRAWL_API_URL ||
  'https://deepcrawl-worker-v0-production.shinzero.workers.dev';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  try {
    const { path } = await params;
    const searchParams = request.nextUrl.searchParams.toString();
    const pathPart = path ? path.join('/') : '';
    const fullPath = `/scheduler/${pathPart}${searchParams ? `?${searchParams}` : ''}`;

    const apiKey = process.env.DEEPCRAWL_API_KEY;
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['x-api-key'] = apiKey;
    }

    const response = await fetch(`${DEEPCRAWL_BASE_URL}${fullPath}`, {
      method: 'GET',
      headers,
    });

    const text = await response.text();
    const data = JSON.parse(text);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[scheduler] GET error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await params;
  const body = await request.json();
  const pathPart = path ? path.join('/') : '';
  const fullPath = `/scheduler/${pathPart}`;

  const requestHeaders = await headers();
  const authHeaders = buildDeepcrawlHeaders(requestHeaders);

  const response = await fetch(`${DEEPCRAWL_BASE_URL}${fullPath}`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await params;
  const body = await request.json();
  const pathPart = path ? path.join('/') : '';
  const fullPath = `/scheduler/${pathPart}`;

  const requestHeaders = await headers();
  const authHeaders = buildDeepcrawlHeaders(requestHeaders);

  const response = await fetch(`${DEEPCRAWL_BASE_URL}${fullPath}`, {
    method: 'PATCH',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await params;
  const pathPart = path ? path.join('/') : '';
  const fullPath = `/scheduler/${pathPart}`;

  const requestHeaders = await headers();
  const authHeaders = buildDeepcrawlHeaders(requestHeaders);

  const response = await fetch(`${DEEPCRAWL_BASE_URL}${fullPath}`, {
    method: 'DELETE',
    headers: authHeaders,
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
