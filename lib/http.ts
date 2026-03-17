import { NextResponse } from "next/server";

type ErrorBody = {
  error: string;
  details?: unknown;
};

export function ok<T>(data: T, init?: ResponseInit): NextResponse<T> {
  return NextResponse.json(data, init);
}

export function fail(status: number, error: string, details?: unknown): NextResponse<ErrorBody> {
  return NextResponse.json({ error, details }, { status });
}
