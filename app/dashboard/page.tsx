'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BatteryMetricsCards } from '@/components/dashboard/BatteryMetricsCards';
import { BatteryChart } from '@/components/dashboard/BatteryChart';
import { RawBatteryChart } from '@/components/dashboard/RawBatteryChart';
import { BatteryStatusCards } from '@/components/dashboard/BatteryStatusCards';
//import { ControlToggleCard } from '@/components/dashboard/ControlToggleCard';
import { useToast } from "@/hooks/use-toast";
import type { BatteryData } from '@/types/battery';
import type { RawBatteryData } from '@/utils/dynamoDBService';

const fetchBatteryDataClient = async (): Promise<BatteryData[]> => {
  const res = await fetch("/api/battery");
  
  if (!res.ok) {
    throw new Error("Failed to fetch battery data");
  }
  const body = await res.json();
  return body as BatteryData[];
};

const fetchRawBatteryDataClient = async (): Promise<RawBatteryData[]> => {
  const res = await fetch("/api/raw-battery");
  if (!res.ok) {
    throw new Error("Failed to fetch raw battery data");
  }
  const body = await res.json();
  return body as RawBatteryData[];
};


const Dashboard = () => {
  const { logout } = useAuth();
  const { toast } = useToast();
  const dataRaw = fetchBatteryDataClient();
  console.log("dataRaw Hola", dataRaw);
  // Query for primary battery data from Predictions_1 table
  const { data: batteryMetrics, isLoading: isLoadingMetrics, isError: isErrorMetrics } = useQuery({
   
    queryKey: ['batteryData'],
    queryFn: fetchBatteryDataClient,
    placeholderData: [],
    meta: {
      onError: (error: Error) => {
        console.error("Failed to fetch battery metrics data:", error);
        toast({
          title: "Battery Metrics Data Fetch Error",
          description: "Could not load metrics data from Predictions_1. Using fallback data.",
          variant: "destructive",
        });
      }
    },
  });

  // Query for raw battery data from Raw_Data_SeniorDesign table
  const { 
    data: rawBatteryData, 
    isLoading: isLoadingRawData, 
    isError: isErrorRawData 
  } = useQuery({
    queryKey: ['rawBatteryData'],
    queryFn: fetchRawBatteryDataClient,
    placeholderData: [],
    meta: {
      onError: (error: Error) => {
        console.error("Failed to fetch raw battery data:", error);
        toast({
          title: "Raw Data Fetch Error",
          description: "Could not load raw data from Raw_Data_SeniorDesign. Using fallback data.",
          variant: "destructive",
        });
      }
    },
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Battery Management System</h1>
          <Button variant="secondary" onClick={logout}>
            Logout
          </Button>
        </div>

        {(isLoadingMetrics || isLoadingRawData) && (
          <div className="text-center py-4">
            <p>Loading battery data...</p>
          </div>
        )}

        {(isErrorMetrics && isErrorRawData) && (
          <div className="text-center py-4 text-red-500">
            <p>Error loading data. Using fallback data.</p>
          </div>
        )}

        <BatteryStatusCards data={rawBatteryData || []} />

        <BatteryMetricsCards data={batteryMetrics || []} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BatteryChart data={batteryMetrics || []} />
          <RawBatteryChart data={rawBatteryData || []} />
        </div>

         {/* <div className="grid grid-cols-1 gap-6">
            <ControlToggleCard />
          </div>*/}
      </div>
    </div>
  );
};

export default Dashboard;
