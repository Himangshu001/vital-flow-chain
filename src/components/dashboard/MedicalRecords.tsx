import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Calendar, ShieldCheck, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface MedicalRecordsProps {
  userId: string;
}

const MedicalRecords = ({ userId }: MedicalRecordsProps) => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, [userId]);

  const loadRecords = async () => {
    const { data, error } = await supabase
      .from("medical_records")
      .select("*")
      .eq("patient_id", userId)
      .order("created_at", { ascending: false});

    if (error) {
      console.error("Error loading records:", error);
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  };

  const openBlockchainExplorer = (txHash: string) => {
    window.open(`https://mumbai.polygonscan.com/tx/${txHash}`, '_blank');
  };

  if (loading) {
    return (
      <Card className="shadow-md">
        <CardContent className="py-10 text-center text-muted-foreground">
          Loading medical records...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <CardTitle>Medical Records</CardTitle>
        </div>
        <CardDescription>Your complete medical history and records</CardDescription>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No medical records found</p>
            <p className="text-sm mt-1">Your medical records will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <Card key={record.id} className="border-l-4 border-l-accent">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{record.diagnosis || "General Record"}</CardTitle>
                        {record.blockchain_verified && (
                          <Badge variant="outline" className="gap-1">
                            <ShieldCheck className="w-3 h-3 text-green-500" />
                            Blockchain Verified
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(record.created_at), "MMM dd, yyyy")}
                      </CardDescription>
                    </div>
                    <Badge className="bg-gradient-secondary">
                      {record.record_type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {record.blockchain_tx_hash && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">
                        TX: {record.blockchain_tx_hash.slice(0, 10)}...{record.blockchain_tx_hash.slice(-8)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openBlockchainExplorer(record.blockchain_tx_hash)}
                        className="h-6 px-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  
                  {record.record_data && (
                    <div className="text-sm space-y-2">
                      {Object.entries(record.record_data as object).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/_/g, " ")}:
                          </span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MedicalRecords;
