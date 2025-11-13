import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, User } from "lucide-react";
import { format } from "date-fns";

interface PrescriptionsViewProps {
  userId: string;
}

const PrescriptionsView = ({ userId }: PrescriptionsViewProps) => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrescriptions();
  }, [userId]);

  const loadPrescriptions = async () => {
    const { data, error } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("patient_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading prescriptions:", error);
    } else {
      setPrescriptions(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="shadow-md">
        <CardContent className="py-10 text-center text-muted-foreground">
          Loading prescriptions...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <CardTitle>Virtual Prescriptions</CardTitle>
        </div>
        <CardDescription>View and manage your digital prescriptions</CardDescription>
      </CardHeader>
      <CardContent>
        {prescriptions.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No prescriptions found</p>
            <p className="text-sm mt-1">Your prescriptions will appear here when a doctor issues them</p>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <Card key={prescription.id} className="border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{prescription.diagnosis}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(prescription.prescription_date), "MMM dd, yyyy")}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={prescription.status === "active" ? "default" : "secondary"}
                      className={prescription.status === "active" ? "bg-gradient-secondary" : ""}
                    >
                      {prescription.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Medications:</h4>
                      <div className="space-y-2">
                        {Array.isArray(prescription.medications) &&
                          prescription.medications.map((med: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 text-sm bg-muted p-2 rounded">
                              <div className="flex-1">
                                <p className="font-medium">{med.name}</p>
                                <p className="text-muted-foreground text-xs">
                                  {med.dosage} - {med.frequency}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                    {prescription.instructions && (
                      <div className="text-sm">
                        <span className="font-medium">Instructions: </span>
                        <span className="text-muted-foreground">{prescription.instructions}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PrescriptionsView;
