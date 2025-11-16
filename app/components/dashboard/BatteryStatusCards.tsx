
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Battery, Thermometer, Gauge, Power } from "lucide-react";
import { RawBatteryData } from "@/utils/dynamoDBService";
import { Badge } from "@/components/ui/badge";

interface BatteryStatusCardsProps {
  data: RawBatteryData[];
}

export const BatteryStatusCards = ({ data }: BatteryStatusCardsProps) => {
  // Get the latest data point (last element in the array)
  const latestData = data && data.length > 0 ? data[data.length - 1] : null;
  
  const getStatusBadge = (status: number | null, label: string) => {
    if (status === null) return <Badge variant="outline">Unknown</Badge>;
    return status === 1 ? 
      <Badge className="bg-green-500">ON</Badge> : 
      <Badge className="bg-red-500">OFF</Badge>;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Charger Safety</CardTitle>
          <Power className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-medium">
            {latestData ? getStatusBadge(latestData.chargerSafetyActive, 'Charger Safety') : 'N/A'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Discharge Enable</CardTitle>
          <Battery className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-medium">
            {latestData ? getStatusBadge(latestData.dischargeEnableActive, 'Discharge Enable') : 'N/A'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Charging Status</CardTitle>
          <Battery className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-medium">
            {latestData ? getStatusBadge(latestData.isChargingStatus, 'Charging') : 'N/A'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ready Status</CardTitle>
          <Power className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-medium">
            {latestData ? getStatusBadge(latestData.isReadyStatus, 'Ready') : 'N/A'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Highest Temperature</CardTitle>
          <Thermometer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-medium">
            {latestData && latestData.highestTemperature !== null ? `${latestData.highestTemperature}°C` : 'N/A'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lowest Temperature</CardTitle>
          <Thermometer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-medium">
            {latestData && latestData.lowestTemperature !== null ? `${latestData.lowestTemperature}°C` : 'N/A'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pack Current</CardTitle>
          <Gauge className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-medium">
            {latestData && latestData.packAmperage !== null ? `${latestData.packAmperage} A` : 'N/A'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
