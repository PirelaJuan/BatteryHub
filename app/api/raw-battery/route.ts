import { NextResponse } from "next/server";
import { fetchRawBatteryData } from "@/utils/dynamoDBService"; // same file as before

export async function GET() {
  try {
    console.log("API /api/raw-battery: fetching raw battery data");

    const data = await fetchRawBatteryData();

    return NextResponse.json(data, { status: 200 });
    
  } catch (error) {
    console.error("Error in /api/raw-battery:", error);
    return NextResponse.json(
      { error: "Failed to fetch raw battery data" },
      { status: 500 }
    );
  }
}