
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { BatteryData } from "@/types/battery";
import { AWS_CONFIG } from "./awsConfig";
import { format, parseISO, subHours, addHours, parse } from "date-fns";

// Initialize the DynamoDB client
const client = new DynamoDBClient({
  region: AWS_CONFIG.region,
  credentials: AWS_CONFIG.credentials
});

const docClient = DynamoDBDocumentClient.from(client);

// Table names for different data sources
const PREDICTIONS_TABLE = "Predictions_1";
const RAW_DATA_TABLE = "Raw_Data_SeniorDesign";

// Define interfaces for the raw data structure
export interface RawBatteryData {
  time: string;
  packSOC: number | null;
  packVoltage: number | null;
  chargerSafetyActive: number | null;
  dischargeEnableActive: number | null;
  highestTemperature: number | null;
  isChargingStatus: number | null;
  isReadyStatus: number | null;
  lowestTemperature: number | null;
  packAmperage: number | null;
  displayTime?: string;
}

// Parse the custom timestamp format
function parseCustomTimestamp(timestamp: string): Date {
  try {
    if (timestamp.includes('Z')) {
      return new Date(timestamp);
    }
    
    // Parse format like "Wed Apr 16 13:34:52 EDT 2025"
    const parts = timestamp.split(' ');
    if (parts.length >= 6) {
      const day = parts[1];
      const month = parts[2];
      const date = parts[3];
      const time = parts[4];
      const tz = parts[5];
      const year = parts[6].replace('.', '');
      
      const monthMap: {[key: string]: string} = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
        'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      };
      
      // Create a date string in a format parsable by Date constructor
      const dateString = `${year}-${monthMap[month]}-${date.padStart(2, '0')}T${time}`;
      return new Date(dateString);
    }
    
    // Fallback to regular date parsing
    return new Date(timestamp);
  } catch (error) {
    console.error("Error parsing timestamp:", timestamp, error);
    return new Date();
  }
}

export async function fetchBatteryData(): Promise<BatteryData[]> {
  try {
    console.log(`Fetching battery metrics from ${PREDICTIONS_TABLE} table`);
    
    // Using Scan operation to get all items from the Predictions_1 table
    const command = new ScanCommand({
      TableName: PREDICTIONS_TABLE,
    });

    const response = await docClient.send(command);
    
    if (!response.Items || response.Items.length === 0) {
      console.warn("No data returned from DynamoDB");
      return [];
    }

    // Map DynamoDB items to BatteryData format using the correct field names
    const batteryData: BatteryData[] = response.Items.map(item => ({
      // Use key_2 or Time for the timestamp field
      time: item.key_2 || item.Time || new Date().toISOString(),
      // Use Actual SOC for soc
      soc: item["Actual SOC"] ? parseFloat(item["Actual SOC"]) : null,
      // Use Actual SOH for soh
      soh: item["Actual SOH"] ? parseFloat(item["Actual SOH"]) : null,
      // Use Predicted SOC for socPredicted
      socPredicted: item["Predicted SOC"] ? parseFloat(item["Predicted SOC"]) : null,
      // Use Predicted SOH for sohPredicted
      sohPredicted: item["Predicted SOH"] ? parseFloat(item["Predicted SOH"]) : null,
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

// Function to fetch data from the Raw_Data_SeniorDesign table
export async function fetchRawBatteryData(): Promise<RawBatteryData[]> {
  try {
    console.log(`Fetching raw battery data from ${RAW_DATA_TABLE} table`);
    
    // Using Scan operation to get all items from the Raw_Data_SeniorDesign table
    const command = new ScanCommand({
      TableName: RAW_DATA_TABLE,
    });

    const response = await docClient.send(command);
    
    if (!response.Items || response.Items.length === 0) {
      console.warn("No raw data returned from DynamoDB");
      return [];
    }

    // Map DynamoDB items to RawBatteryData format
    const rawBatteryData: RawBatteryData[] = response.Items.map(item => {
      // Parse the timestamp - use Time field if available, otherwise use key_2
      const timestamp = item.Time || item.key_2 || new Date().toISOString();
      
      return {
        time: timestamp,
        packSOC: item["Pack State of Charge (SOC)"] ? parseFloat(item["Pack State of Charge (SOC)"]) : null,
        packVoltage: item["Pack Voltage"] ? parseFloat(item["Pack Voltage"]) : null,
        chargerSafetyActive: item["Charger-Safety Output Active"] !== undefined ? 
          Number(item["Charger-Safety Output Active"]) : null,
        dischargeEnableActive: item["Discharge-Enable Output Active"] !== undefined ? 
          Number(item["Discharge-Enable Output Active"]) : null,
        highestTemperature: item["Highest battery temperature"] ? 
          parseFloat(item["Highest battery temperature"]) : null,
        isChargingStatus: item["Is-Charging Power Status"] !== undefined ? 
          Number(item["Is-Charging Power Status"]) : null,
        isReadyStatus: item["Is-Ready Power Status"] !== undefined ? 
          Number(item["Is-Ready Power Status"]) : null,
        lowestTemperature: item["Lowest battery temperature"] ? 
          parseFloat(item["Lowest battery temperature"]) : null,
        packAmperage: item["Pack Amperage (Current)"] ? 
          parseFloat(item["Pack Amperage (Current)"]) : null,
      };
    });

    // Sort by timestamp
    return rawBatteryData.sort((a, b) => {
      const dateA = parseCustomTimestamp(a.time).getTime();
      const dateB = parseCustomTimestamp(b.time).getTime();
      return dateA - dateB;
    });
  } catch (error) {
    console.error("Error fetching raw data from DynamoDB:", error);
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
    const sohValue = Math.floor(Math.random() * (100 - 80) + 80);
    
    return {
      time: pointTime,
      soc: socValue,
      soh: sohValue,
      // Add predictions for the same historical points
      socPredicted: socValue + (Math.random() * 6 - 3), // slight variation for visual difference
      sohPredicted: sohValue + (Math.random() * 4 - 2), // slight variation for visual difference
    };
  });

  // Generate future predictions (where actual values are null)
  const predictions: BatteryData[] = Array.from({ length: 12 }, (_, i) => ({
    time: format(addHours(now, i + 1), "yyyy-MM-dd'T'HH:mm:ss"),
    soc: null,
    soh: null,
    socPredicted: Math.floor(Math.random() * (100 - 50) + 50),
    sohPredicted: Math.floor(Math.random() * (100 - 75) + 75),
  }));

  return [...currentData, ...predictions];
};

// Fallback function for raw battery data
export const generateRawFallbackData = (points: number): RawBatteryData[] => {
  const now = new Date();
  
  return Array.from({ length: points }, (_, i) => {
    const pointTime = format(subHours(now, points - i - 1), "yyyy-MM-dd'T'HH:mm:ss");
    
    return {
      time: pointTime,
      packSOC: Math.floor(Math.random() * (100 - 60) + 60),
      packVoltage: Math.floor(Math.random() * (48 - 36) + 36) + Math.random(), // Fix: Return number instead of string
      chargerSafetyActive: Math.random() > 0.5 ? 1 : 0,
      dischargeEnableActive: Math.random() > 0.5 ? 1 : 0,
      highestTemperature: Math.floor(Math.random() * (35 - 25) + 25),
      isChargingStatus: Math.random() > 0.5 ? 1 : 0,
      isReadyStatus: Math.random() > 0.5 ? 1 : 0,
      lowestTemperature: Math.floor(Math.random() * (25 - 20) + 20),
      packAmperage: Math.floor(Math.random() * 5) + Math.random(),
    };
  });
};
