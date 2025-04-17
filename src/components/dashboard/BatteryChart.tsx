import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BatteryData } from "@/types/battery";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, differenceInDays, isWithinInterval, startOfDay, endOfDay, parseISO, isValid } from "date-fns";
import { DateRange } from "react-day-picker";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface BatteryChartProps {
  data: BatteryData[];
}

export const BatteryChart = ({ data }: BatteryChartProps) => {
  const [visibleMetrics, setVisibleMetrics] = useState({
    soc: true,
    soh: true,
    socPredicted: true,
    sohPredicted: true,
  });

  const [date, setDate] = useState<DateRange | undefined>();
  const [swapAxes, setSwapAxes] = useState(false);
  const [scrollIndex, setScrollIndex] = useState(0);
  const [maxScrollIndex, setMaxScrollIndex] = useState(0);
  const [clampedScrollIndex, setClampedScrollIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(50); // Default zoom level (50 data points visible)
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  const toggleMetric = (metric: keyof typeof visibleMetrics) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  const filteredData = useMemo(() => {
    if (!data.length) return [];
    
    let processedData = [...data];
    
    if (date?.from) {
      const from = startOfDay(date.from);
      const to = date.to ? endOfDay(date.to) : endOfDay(date.from);
      const daysDifference = differenceInDays(to, from);

      processedData = data.filter(item => {
        try {
          const itemDate = new Date(item.time); // Use new Date() for parsing
          return isValid(itemDate) && isWithinInterval(itemDate, { start: from, end: to });
        } catch (e) {
          console.error("Invalid date format:", item.time, e);
          return false;
        }
      });

      processedData = processedData.map(item => {
        try {
          const itemDate = new Date(item.time); // Use new Date() for parsing
          if (!isValid(itemDate)) throw new Error("Invalid date");

          let formattedTime;
          if (daysDifference === 0) {
            formattedTime = format(itemDate, 'HH:mm');
          } else if (daysDifference <= 7) {
            formattedTime = format(itemDate, 'HH:mm');
          } else if (daysDifference <= 31) {
            formattedTime = format(itemDate, 'dd');
          } else {
            formattedTime = format(itemDate, 'MMM');
          }

          return {
            ...item,
            displayTime: formattedTime,
          };
        } catch (e) {
          console.error("Error formatting date:", item.time, e);
          return {
            ...item,
            displayTime: item.time,
          };
        }
      });
    } else {
      processedData = processedData.map(item => {
        try {
          const itemDate = new Date(item.time); // Use new Date() for parsing
          if (!isValid(itemDate)) throw new Error("Invalid date");

          return {
            ...item,
            displayTime: item.time.includes('T') 
              ? format(itemDate, 'HH:mm') 
              : item.time,
          };
        } catch (e) {
          console.error("Error parsing date:", item.time, e);
          return {
            ...item,
            displayTime: item.time,
          };
        }
      });
    }

    return processedData;
  }, [data, date]);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const handleWheelEvent = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.deltaY < 0) {
        setZoomLevel((prev) => Math.max(10, prev - 10)); // Zoom in
      } else if (event.deltaY > 0) {
        setZoomLevel((prev) => Math.min(data.length, prev + 10)); // Zoom out
      }
    };

    container.addEventListener("wheel", handleWheelEvent, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheelEvent);
    };
  }, [data.length]);

  useEffect(() => {
    const maxIndex = Math.max(0, filteredData.length - zoomLevel);
    setMaxScrollIndex(maxIndex);
    setClampedScrollIndex(Math.min(scrollIndex, maxIndex));
  }, [filteredData, scrollIndex, zoomLevel]);

  const paginatedData = useMemo(() => {
    return filteredData.slice(clampedScrollIndex, clampedScrollIndex + zoomLevel);
  }, [filteredData, clampedScrollIndex, zoomLevel]);

  return (
    <Card className="col-span-1">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Battery Metrics Over Time</CardTitle>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setZoomLevel((prev) => Math.max(10, prev - 10))}
              className="px-2 py-1 bg-blue-500 text-white rounded"
              aria-label="Zoom In"
            >
              +
            </button>
            <button
              onClick={() => setZoomLevel((prev) => Math.min(data.length, prev + 10))}
              className="px-2 py-1 bg-blue-500 text-white rounded"
              aria-label="Zoom Out"
            >
              -
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="soc" 
              checked={visibleMetrics.soc}
              onCheckedChange={() => toggleMetric('soc')}
            />
            <label htmlFor="soc" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Actual SOC (%)
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="soh" 
              checked={visibleMetrics.soh}
              onCheckedChange={() => toggleMetric('soh')}
            />
            <label htmlFor="soh" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Actual SOH (%)
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="socPredicted" 
              checked={visibleMetrics.socPredicted}
              onCheckedChange={() => toggleMetric('socPredicted')}
            />
            <label htmlFor="socPredicted" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Predicted SOC (%)
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="sohPredicted" 
              checked={visibleMetrics.sohPredicted}
              onCheckedChange={() => toggleMetric('sohPredicted')}
            />
            <label htmlFor="sohPredicted" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Predicted SOH (%)
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[300px]" ref={chartContainerRef}>
        <ResponsiveContainer width="100%" height="100%">
          {swapAxes ? (
            <LineChart 
              data={paginatedData}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="displayTime" type="category" />
              <Tooltip />
              <Legend />
              {visibleMetrics.soc && (
                <Line 
                  type="monotone" 
                  dataKey="soc" 
                  stroke="#60A5FA" 
                  name="SOC (%)" 
                  strokeWidth={2}
                />
              )}
              {visibleMetrics.soh && (
                <Line 
                  type="monotone" 
                  dataKey="soh" 
                  stroke="#34D399" 
                  name="SOH (%)" 
                  strokeWidth={2}
                />
              )}
              {visibleMetrics.socPredicted && (
                <Line 
                  type="monotone" 
                  dataKey="socPredicted" 
                  stroke="#FFDEE2" 
                  name="Predicted SOC (%)" 
                  strokeWidth={2}
                />
              )}
              {visibleMetrics.sohPredicted && (
                <Line 
                  type="monotone" 
                  dataKey="sohPredicted" 
                  stroke="#DC2626" 
                  name="Predicted SOH (%)" 
                  strokeWidth={2}
                />
              )}
            </LineChart>
          ) : (
            <LineChart data={paginatedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="displayTime" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              {visibleMetrics.soc && (
                <Line 
                  type="monotone" 
                  dataKey="soc" 
                  stroke="#60A5FA" 
                  name="Actual SOC (%)" 
                  strokeWidth={2}
                  connectNulls={true}
                />
              )}
              {visibleMetrics.soh && (
                <Line 
                  type="monotone" 
                  dataKey="soh" 
                  stroke="#34D399" 
                  name="Actual SOH (%)" 
                  strokeWidth={2}
                  connectNulls={true}
                />
              )}
              {visibleMetrics.socPredicted && (
                <Line 
                  type="monotone" 
                  dataKey="socPredicted" 
                  stroke="#FFDEE2" 
                  name="Predicted SOC (%)" 
                  strokeWidth={2}
                  connectNulls={true}
                />
              )}
              {visibleMetrics.sohPredicted && (
                <Line 
                  type="monotone" 
                  dataKey="sohPredicted" 
                  stroke="#DC2626" 
                  name="Predicted SOH (%)" 
                  strokeWidth={2}
                  connectNulls={true}
                />
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
        {maxScrollIndex > 0 && (
          <input
            type="range"
            min={0}
            max={maxScrollIndex}
            value={clampedScrollIndex}
            onChange={(e) => setScrollIndex(Number(e.target.value))}
            className="w-full mt-2"
          />
        )}
      </CardContent>
    </Card>
  );
};