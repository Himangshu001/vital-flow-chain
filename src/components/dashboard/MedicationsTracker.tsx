import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Pill, AlertTriangle, Calendar, CheckCircle2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface MedicationsTrackerProps {
  userId: string;
}

const MedicationsTracker = ({ userId }: MedicationsTrackerProps) => {
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedications();
  }, [userId]);

  const loadMedications = async () => {
    const { data, error } = await supabase
      .from("medications")
      .select("*")
      .eq("patient_id", userId)
      .order("expiry_date", { ascending: true });

    if (error) {
      console.error("Error loading medications:", error);
    } else {
      setMedications(data || []);
    }
    setLoading(false);
  };

  const getExpiryStatus = (expiryDate: string) => {
    const daysUntilExpiry = differenceInDays(new Date(expiryDate), new Date());
    
    if (daysUntilExpiry < 0) {
      return { status: "expired", color: "destructive", icon: AlertTriangle, label: "Expired" };
    } else if (daysUntilExpiry <= 7) {
      return { status: "critical", color: "destructive", icon: AlertTriangle, label: `${daysUntilExpiry} days left` };
    } else if (daysUntilExpiry <= 21) {
      return { status: "warning", color: "default", icon: Calendar, label: `${daysUntilExpiry} days left` };
    } else {
      return { status: "good", color: "secondary", icon: CheckCircle2, label: "Good" };
    }
  };

  if (loading) {
    return (
      <Card className="shadow-md">
        <CardContent className="py-10 text-center text-muted-foreground">
          Loading medications...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Pill className="w-5 h-5 text-primary" />
          <CardTitle>Medication Tracker</CardTitle>
        </div>
        <CardDescription>
          Track your medications and receive expiry alerts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {medications.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <Pill className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No medications tracked yet</p>
            <p className="text-sm mt-1">Medications from your prescriptions will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {medications.map((medication) => {
              const expiryInfo = getExpiryStatus(medication.expiry_date);
              const ExpiryIcon = expiryInfo.icon;

              return (
                <Card key={medication.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base">{medication.medicine_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {medication.dosage} - {medication.frequency}
                        </p>
                      </div>
                      <Badge variant={expiryInfo.color as any} className="flex items-center gap-1">
                        <ExpiryIcon className="w-3 h-3" />
                        {expiryInfo.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Quantity:</span>
                        <p className="font-medium">{medication.quantity} units</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Batch:</span>
                        <p className="font-medium">{medication.batch_number || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Dispensed:</span>
                        <p className="font-medium">
                          {medication.dispensed_date
                            ? format(new Date(medication.dispensed_date), "MMM dd, yyyy")
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expires:</span>
                        <p className="font-medium">
                          {format(new Date(medication.expiry_date), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>

                    {expiryInfo.status === "critical" && (
                      <Alert variant="destructive" className="mt-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          This medication is expiring soon. Please renew your prescription.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MedicationsTracker;
