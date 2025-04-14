import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { BatteryData } from "@/types/battery";
import { AWS_CONFIG } from "./awsConfig";
import { format, parseISO, subHours, addHours } from "date-fns";

// Initialize the DynamoDB client
const client = new DynamoDBClient({
  region: AWS_CONFIG.region,
  credentials: AWS_CONFIG.credentials,
});

const docClient = DynamoDBDocumentClient.from(client);

export async function fetchBatteryData(): Promise<BatteryData[]> {
  try {
    // Using Scan operation since we're getting all items
    // In a production app, you'd use Query for better performance
    const command = new ScanCommand({
      TableName: AWS_CONFIG.tableName,
    });

    const response = await docClient.send(command);

    if (!response.Items || response.Items.length === 0) {
      console.warn("No data returned from DynamoDB");
      return [];
    }

    // Map DynamoDB items to BatteryData format using the correct field names
    const batteryData: BatteryData[] = response.Items.map((item) => ({
      time: new Date(item.Time).toISOString(), // Convert to ISO 8601 format
      soc: item["Actual SOC"] ? parseFloat(item["Actual SOC"]) : null,
      socPredicted: item["Predicted SOC"] ? parseFloat(item["Predicted SOC"]) : null,
    }));

    // Sort by timestamp
    return batteryData.sort((a, b) => {
      const dateA = new Date(a.time).getTime();
      const dateB = new Date(b.time).getTime();
      return dateA - dateB;
    });
  } catch (error) {
    console.error("Error fetching data from DynamoDB:", error);
    throw error;
  }
}

// Fallback function that generates mock data if DynamoDB fetch fails
export const generateFallbackData = (points: number): BatteryData[] => {
  const now = new Date();
  // Generate historical data points
  const currentData: BatteryData[] = Array.from({ length: points }, (_, i) => {
    const pointTime = format(subHours(now, points - i - 1), "yyyy-MM-dd'T'HH:mm:ss");
    const socValue = Math.floor(Math.random() * (100 - 60) + 60);

    return {
      time: pointTime,
      soc: socValue,
      socPredicted: socValue + (Math.random() * 6 - 3), // slight variation for visual difference
    };
  });

  // Generate future predictions (where actual values are null)
  const predictions: BatteryData[] = Array.from({ length: 12 }, (_, i) => ({
    time: format(addHours(now, i + 1), "yyyy-MM-dd'T'HH:mm:ss"),
    soc: null,
    socPredicted: Math.floor(Math.random() * (100 - 50) + 50),
  }));

  return [...currentData, ...predictions];
};