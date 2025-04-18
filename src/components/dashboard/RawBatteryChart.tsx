import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { RawBatteryData } from "@/utils/dynamoDBService";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay, setHours, setMinutes } from "date-fns";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Helper function to parse custom timestamp format
function parseCustomTimestamp(timestamp: string): Date {
  try {
    const parts = timestamp.split(" ");
    if (parts.length === 6) {
      const monthMap: { [key: string]: string } = {
        Jan: "01",
        Feb: "02",
        Mar: "03",
        Apr: "04",
        May: "05",
        Jun: "06",
        Jul: "07",
        Aug: "08",
        Sep: "09",
        Oct: "10",
        Nov: "11",
        Dec: "12",
      };
      const month = monthMap[parts[1]];
      const day = parts[2].padStart(2, "0");
      const time = parts[3];
      const year = parts[5];
      return new Date(`${year}-${month}-${day}T${time}`);
    }
    throw new Error("Invalid timestamp format");
  } catch (error) {
    console.error("Error parsing timestamp:", timestamp, error);
    return new Date(); // Fallback to current date
  }
}

interface RawBatteryChartProps {
  data: RawBatteryData[];
}

export const RawBatteryChart = ({ data }: RawBatteryChartProps) => {
  const [visibleMetrics, setVisibleMetrics] = useState({
    packSOC: true,
    packVoltage: true,
  });

  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [timeRange, setTimeRange] = useState({ start: "00:00", end: "23:59" });

  const toggleMetric = (metric: keyof typeof visibleMetrics) => {
    setVisibleMetrics((prev) => ({
      ...prev,
      [metric]: !prev[metric],
    }));
  };

  const filteredData = useMemo(() => {
    if (!data.length) return [];

    let processedData = [...data];
    if (dateRange?.from) {
      const from = startOfDay(dateRange.from);
      const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);

      processedData = data.filter((item) => {
        try {
          const itemDate = parseCustomTimestamp(item.time);
          return isWithinInterval(itemDate, { start: from, end: to });
        } catch (e) {
          console.error("Invalid date format:", item.time, e);
          return false;
        }
      });
    }

    if (timeRange.start && timeRange.end) {
      const [startHours, startMinutes] = timeRange.start.split(":").map(Number);
      const [endHours, endMinutes] = timeRange.end.split(":").map(Number);

      processedData = processedData.filter((item) => {
        try {
          const itemDate = parseCustomTimestamp(item.time);
          const itemTime = setHours(setMinutes(new Date(itemDate), 0), 0);
          const startTime = setHours(setMinutes(new Date(itemDate), startMinutes), startHours);
          const endTime = setHours(setMinutes(new Date(itemDate), endMinutes), endHours);

          return isWithinInterval(itemTime, { start: startTime, end: endTime });
        } catch (e) {
          console.error("Invalid time format:", item.time, e);
          return false;
        }
      });
    }

    return processedData.map((item) => {
      let displayTime;
      try {
        const itemDate = parseCustomTimestamp(item.time);
        displayTime = format(itemDate, "HH:mm");
      } catch (e) {
        console.error("Error formatting date:", item.time, e);
        displayTime = item.time;
      }

      return {
        ...item,
        displayTime,
      };
    });
  }, [data, dateRange, timeRange]);

  return (
    <Card className="col-span-1">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Raw Battery Metrics</CardTitle>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-wrap gap-4 mt-2">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Start Time:</label>
            <input
              type="time"
              value={timeRange.start}
              onChange={(e) => setTimeRange((prev) => ({ ...prev, start: e.target.value }))}
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">End Time:</label>
            <input
              type="time"
              value={timeRange.end}
              onChange={(e) => setTimeRange((prev) => ({ ...prev, end: e.target.value }))}
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="packSOC"
              checked={visibleMetrics.packSOC}
              onCheckedChange={() => toggleMetric("packSOC")}
            />
            <label
              htmlFor="packSOC"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Pack State of Charge (%)
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="packVoltage"
              checked={visibleMetrics.packVoltage}
              onCheckedChange={() => toggleMetric("packVoltage")}
            />
            <label
              htmlFor="packVoltage"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Pack Voltage (V)
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData}>
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
                stroke="#dc3f3f"
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