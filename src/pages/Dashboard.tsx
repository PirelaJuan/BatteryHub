
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BatteryMetricsCards } from '@/components/dashboard/BatteryMetricsCards';
import { BatteryChart } from '@/components/dashboard/BatteryChart';
import { ControlToggleCard } from '@/components/dashboard/ControlToggleCard';
import { fetchBatteryData, generateFallbackData } from '@/utils/dynamoDBService';
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['batteryData'],
    queryFn: fetchBatteryData,
    // Fallback to mock data if the query fails
    placeholderData: generateFallbackData(24),
    meta: {
      onError: (error: Error) => {
        console.error("Failed to fetch data:", error);
        toast({
          title: "Data Fetch Error",
          description: "Could not load data from DynamoDB. Using fallback data.",
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

        {isLoading && (
          <div className="text-center py-4">
            <p>Loading battery data...</p>
          </div>
        )}

        {isError && (
          <div className="text-center py-4 text-red-500">
            <p>Error loading data. Using fallback data.</p>
          </div>
        )}

        <BatteryMetricsCards data={data || []} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BatteryChart data={data || []} />
          <ControlToggleCard />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
