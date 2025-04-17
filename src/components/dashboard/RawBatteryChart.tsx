
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RawBatteryData } from "@/utils/dynamoDBService";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

interface RawBatteryChartProps {
  data: RawBatteryData[];
}

export const RawBatteryChart = ({ data }: RawBatteryChartProps) => {
  const [visibleMetrics, setVisibleMetrics] = useState({
    packSOC: true,
    packVoltage: true,
  });

  const toggleMetric = (metric: keyof typeof visibleMetrics) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  const processedData = useMemo(() => {
    return data.map(item => {
      let displayTime;
      try {
        const itemDate = new Date(item.time);
        displayTime = format(itemDate, 'HH:mm');
      } catch (e) {
        console.error("Error formatting date:", item.time, e);
        displayTime = item.time;
      }
      
      return {
        ...item,
        displayTime,
      };
    });
  }, [data]);

  return (
    <Card className="col-span-1">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Raw Battery Metrics</CardTitle>
        </div>
        
        <div className="flex flex-wrap gap-4 mt-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="packSOC" 
              checked={visibleMetrics.packSOC}
              onCheckedChange={() => toggleMetric('packSOC')}
            />
            <label htmlFor="packSOC" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Pack State of Charge (%)
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="packVoltage" 
              checked={visibleMetrics.packVoltage}
              onCheckedChange={() => toggleMetric('packVoltage')}
            />
            <label htmlFor="packVoltage" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Pack Voltage (V)
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={processedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="displayTime" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            {visibleMetrics.packSOC && (
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="packSOC" 
                stroke="#60A5FA" 
                name="Pack SOC (%)" 
                strokeWidth={2}
                connectNulls={true}
              />
            )}
            {visibleMetrics.packVoltage && (
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="packVoltage" 
                stroke="#34D399" 
                name="Pack Voltage (V)" 
                strokeWidth={2}
                connectNulls={true}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
