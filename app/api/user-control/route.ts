import { NextResponse } from "next/server";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { dbClient } from "../../../config"; // your existing server-side Dynamo client

export async function POST(req: Request) {
  try {
    const { controlValue } = await req.json();

    if (typeof controlValue !== "number") {
      return NextResponse.json(
        { error: "controlValue must be a number" },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();
    const key1 = "key1";

    const command = new PutCommand({
      TableName: "UserControl",
      Item: {
        key1,
        timestamp,
        controlValue,
      },
    });

    await dbClient.send(command);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in /api/user-control:", error);
    return NextResponse.json(
      { error: "Failed to send control signal" },
      { status: 500 }
    );
  }
}
