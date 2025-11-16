import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

export const BMSSettingsForm = () => {
  const { toast } = useToast();
  const [toggleState, setToggleState] = useState<boolean>(false);

  const sendData = async () => {
    // Convert toggle to 0 or 1
    const value = toggleState ? 1 : 0;
    
    try {
      // Replace this URL with your actual API endpoint or
      // AWS SDK call that writes to your DynamoDB table.
      const response = await fetch("/api/send-to-dynamodb", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to send data");
      }
      
      console.log("Successfully sent value:", value);
      toast({
        title: "Data Sent",
        description: "Your toggle value has been sent to AWS DynamoDB.",
      });
    } catch (error) {
      console.error("Error sending data:", error);
      toast({
        title: "Error",
        description: "There was an error sending your data.",
      });
    }
  };

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Data Uploaded</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <span>Off</span>
          <Switch
            checked={toggleState}
            onCheckedChange={(checked) => setToggleState(checked)}
          />
          <span>On</span>
        </div>
        <Button onClick={sendData} className="w-full">
          Send
        </Button>
      </CardContent>
    </Card>
  );
};
