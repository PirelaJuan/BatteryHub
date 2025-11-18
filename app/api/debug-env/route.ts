import { NextResponse } from "next/server";


export async function GET() {
  // DO NOT return secrets in production. This is only for local debugging.
  return NextResponse.json({
    
    aws_region: process.env.AWS_REGION ?? null,
    has_credentials: Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
  });
}