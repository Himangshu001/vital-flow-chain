import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import QRCodeScanner from "@/components/scanner/QRCodeScanner";
import PatientDataDisplay from "@/components/scanner/PatientDataDisplay";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const QRScanner = () => {
  const navigate = useNavigate();
  const [scannedData, setScannedData] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuthentication = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate("/auth");
        return;
      }

      // Verify user has appropriate role (doctor, admin, or pharmacist)
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .in("role", ["doctor", "admin", "pharmacist"])
        .maybeSingle();

      if (!roleData) {
        navigate("/");
        return;
      }

      setUser(session.user);
      setIsLoading(false);
    };

    verifyAuthentication();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleScanSuccess = (data: any) => {
    setScannedData(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              QR Code Scanner
            </h1>
            <p className="text-muted-foreground mt-2">Scan patient QR codes to access health data</p>
          </div>
          <Button onClick={() => navigate("/")} variant="outline">
            Back to Home
          </Button>
        </div>

        <div className="grid gap-6">
          {!scannedData ? (
            <Card className="shadow-elegant border-border/50">
              <CardHeader>
                <CardTitle>Scan Patient QR Code</CardTitle>
                <CardDescription>
                  Position the QR code within the camera frame
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QRCodeScanner onScanSuccess={handleScanSuccess} />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Button onClick={() => setScannedData(null)} variant="outline">
                Scan Another Code
              </Button>
              <PatientDataDisplay patientId={scannedData.patientId} accessLevel={scannedData.accessLevel} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
