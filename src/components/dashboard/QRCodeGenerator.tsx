import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { QrCode, Download, RefreshCw } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

interface QRCodeGeneratorProps {
  userId: string;
}

const QRCodeGenerator = ({ userId }: QRCodeGeneratorProps) => {
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [accessLevel, setAccessLevel] = useState("basic");

  useEffect(() => {
    loadLatestQR();
  }, [userId]);

  const loadLatestQR = async () => {
    const { data, error } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("patient_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setQrData(data);
    }
  };

  const generateQRCode = async () => {
    setLoading(true);
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 7); // Valid for 7 days

    const { data, error } = await supabase
      .from("qr_codes")
      .insert({
        patient_id: userId,
        access_level: accessLevel,
        valid_until: validUntil.toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to generate QR code");
      console.error(error);
    } else {
      setQrData(data);
      toast.success("QR code generated successfully");
    }
    setLoading(false);
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById("qr-code-canvas") as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "health-qr-code.png";
      link.href = url;
      link.click();
    }
  };

  const qrValue = qrData ? JSON.stringify({
    qrId: qrData.id,
    patientId: qrData.patient_id,
    accessLevel: qrData.access_level,
    validUntil: qrData.valid_until,
  }) : "";

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary" />
          <CardTitle>QR Code Generator</CardTitle>
        </div>
        <CardDescription>
          Generate a secure QR code to share your health data with medical professionals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Access Level</label>
            <Select value={accessLevel} onValueChange={setAccessLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic Info (Name, DOB, Blood Type)</SelectItem>
                <SelectItem value="emergency">Emergency (All Critical Info)</SelectItem>
                <SelectItem value="full">Full Access (Complete Records)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={generateQRCode}
            disabled={loading}
            className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {loading ? "Generating..." : "Generate New QR Code"}
          </Button>
        </div>

        {qrData && (
          <div className="space-y-4">
            <div className="flex justify-center p-6 bg-white rounded-lg shadow-inner">
              <QRCodeCanvas
                id="qr-code-canvas"
                value={qrValue}
                size={256}
                level="H"
                includeMargin
              />
            </div>

            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Access Level:</span>
                <span className="font-medium capitalize">{qrData.access_level}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valid Until:</span>
                <span className="font-medium">
                  {new Date(qrData.valid_until).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Usage Count:</span>
                <span className="font-medium">{qrData.usage_count || 0}</span>
              </div>
            </div>

            <Button
              onClick={downloadQRCode}
              variant="outline"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download QR Code
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QRCodeGenerator;
