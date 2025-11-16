export interface BatteryData {
  time: string;
  soc: number | null;
  socPredicted: number | null;
}

export interface BMSSettings {
  maxVoltage: string;
  minVoltage: string;
  maxTemperature: string;
  maxChargeCurrent: string;
  maxDischargeCurrent: string;
}