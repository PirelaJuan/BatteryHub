import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { BatteryData } from "@/types/battery";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ZoomIn, ZoomOut } from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const [zoomLevel, setZoomLevel] = useState(data.length); // Start by showing all the data
  const [scrollIndex, setScrollIndex] = useState(0); // Start at the beginning of the data

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

      processedData = data.filter(item => {
        try {
          const itemDate = parseISO(item.time);
          return isWithinInterval(itemDate, { start: from, end: to });
        } catch (e) {
          console.error("Invalid date format:", item.time, e);
          return false;
        }
      });
    }

    return processedData.map(item => ({
      ...item,
      displayTime: format(parseISO(item.time), "HH:mm"),
    }));
  }, [data, date]);

  // Compute min/max values for zoom effect
  const minY = Math.min(...filteredData.map(d => Math.min(d.soc, d.soh, d.socPredicted, d.sohPredicted))) - 2;
  const maxY = Math.max(...filteredData.map(d => Math.max(d.soc, d.soh, d.socPredicted, d.sohPredicted))) + 2;

  // Ensure scrollIndex doesn't exceed array length
  const maxScrollIndex = Math.max(0, filteredData.length - zoomLevel);
  const clampedScrollIndex = Math.min(scrollIndex, maxScrollIndex);

  // Slice data based on scroll position and zoom level
  const visibleData = filteredData.slice(clampedScrollIndex, clampedScrollIndex + zoomLevel);

  return (
    <Card className="col-span-1">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Battery Metrics Over Time</CardTitle>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent className="h-[400px]">
        {/* Zoom Controls */}
        <div className="flex justify-between mb-2">
          <div className="flex space-x-4">
            {Object.keys(visibleMetrics).map(metric => (
              <div key={metric} className="flex items-center space-x-2">
                <Checkbox
                  checked={visibleMetrics[metric as keyof typeof visibleMetrics]}
                  onCheckedChange={() => toggleMetric(metric as keyof typeof visibleMetrics)}
                />
                <label className="text-sm capitalize">{metric.replace("Predicted", " Predicted")}</label>
              </div>
            ))}
          </div>
          <div className="flex space-x-2">
            <Button size="sm" onClick={() => setZoomLevel(prev => Math.max(10, prev - 30))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setZoomLevel(prev => Math.min(data.length, prev + 30))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Fixed Chart */}
        <div className="w-full">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={visibleData} margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="displayTime" />
              <YAxis domain={[minY, maxY]} />
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
                  dot={{ r: 2 }} // Smaller dots (radius 2px)
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
                  dot={{ r: 2 }}
                />
              )}
              {visibleMetrics.socPredicted && (
                <Line
                  type="monotone"
                  dataKey="socPredicted"
                  stroke="#A5C8FA"
                  name="Predicted SOC (%)"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  connectNulls={true}
                  dot={{ r: 2 }}
                />
              )}
              {visibleMetrics.sohPredicted && (
                <Line
                  type="monotone"
                  dataKey="sohPredicted"
                  stroke="#8DE3B0"
                  name="Predicted SOH (%)"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  connectNulls={true}
                  dot={{ r: 2 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Scroll Bar */}
        <input
          type="range"
          min={0}
          max={maxScrollIndex}
          value={clampedScrollIndex}
          onChange={e => setScrollIndex(Number(e.target.value))}
          className="w-full mt-2"
        />
      </CardContent>
    </Card>
  );
};
