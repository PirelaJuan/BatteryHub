import { NextResponse } from "next/server";
import { fetchBatteryData as fetchFromAWS } from "@/utils/dynamoDBService";
import type { BatteryData } from "@/types/battery";

export async function GET() {
  try {
    const body = await fetchFromAWS();

    //console.log("API /api/battery: fetched battery data", body); 

    //console.log("API /api/battery: fetched battery data NextResponse", NextResponse.json(body)); 

    //console.log("API /api/battery: fetched battery data as BatteryData", body as BatteryData[]);

    if (!body || body.length === 0) {
      return NextResponse.json({ error: "No battery data found" }, { status: 404 });
    }

    return NextResponse.json(body);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch battery data" }, { status: 500 });
  }
}