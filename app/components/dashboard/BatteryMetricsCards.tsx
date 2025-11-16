import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Battery } from "lucide-react";
import { BatteryData } from "@/types/battery";

interface BatteryMetricsCardsProps {
  data: BatteryData[];
}

export const BatteryMetricsCards = ({ data }: BatteryMetricsCardsProps) => {
  // Get the latest actual data (first element with non-null values)
  const latestActualData = data.find(item => item.soc !== null) || { 
    soc: null, 
    time: '' 
  };

  // Get the latest prediction data (usually the last element in the array)
  const predictions = data && data.length > 0 ? data[data.length - 1] : { 
    socPredicted: null, 
    time: '' 
  };

  // Function to format numbers to 2 decimal places
  const formatPercentage = (value: number | null) => {
    return value !== null ? value.toFixed(2) : 'N/A';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* State of Charge Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">State of Charge</CardTitle>
          <Battery className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercentage(latestActualData.soc)}%</div>
          <div className="text-sm text-muted-foreground">
            Predicted: {formatPercentage(predictions.socPredicted)}%
          </div>
        </CardContent>
      </Card>
    </div>
  );
};