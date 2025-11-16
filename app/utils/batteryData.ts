
// This file now serves as a fallback for when DynamoDB data is unavailable
import { BatteryData } from "@/types/battery";
import { addHours, format, subHours } from "date-fns";

export const generateData = (points: number): BatteryData[] => {
  const now = new Date();
  const currentData: BatteryData[] = Array.from({ length: points }, (_, i) => ({
    time: format(subHours(now, points - i - 1), "yyyy-MM-dd'T'HH:mm:ss"),
    soc: Math.floor(Math.random() * (100 - 60) + 60),
    soh: Math.floor(Math.random() * (100 - 80) + 80),
    socPredicted: null,
    sohPredicted: null,
  }));

  const predictions: BatteryData[] = Array.from({ length: 12 }, (_, i) => ({
    time: format(addHours(now, i + 1), "yyyy-MM-dd'T'HH:mm:ss"),
    soc: null,
    soh: null,
    socPredicted: Math.floor(Math.random() * (100 - 50) + 50),
    sohPredicted: Math.floor(Math.random() * (100 - 75) + 75),
  }));

  return [...currentData, ...predictions];
};
