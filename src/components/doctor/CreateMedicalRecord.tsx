import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { blockchainService } from "@/lib/blockchain";
import { ShieldCheck } from "lucide-react";

interface Patient {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

const CreateMedicalRecord = ({ doctorId }: { doctorId: string }) => {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [storeOnBlockchain, setStoreOnBlockchain] = useState(true);
  const [formData, setFormData] = useState({
    patientId: "",
    recordType: "",
    diagnosis: "",
    recordData: "",
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load patients");
      return;
    }

    setPatients(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let parsedData = {};
      
      if (formData.recordData.trim()) {
        try {
          parsedData = JSON.parse(formData.recordData);
        } catch (jsonError) {
          toast.error("Invalid JSON format. Please enter valid JSON or leave empty.");
          setLoading(false);
          return;
        }
      }

      let recordHash = null;
      let blockchainTxHash = null;
      let blockchainVerified = false;

      // Store on blockchain if enabled
      if (storeOnBlockchain) {
        try {
          const recordToHash = {
            diagnosis: formData.diagnosis,
            record_type: formData.recordType,
            patient_id: formData.patientId,
            timestamp: new Date().toISOString(),
          };
          
          recordHash = blockchainService.createRecordHash(recordToHash);
          blockchainTxHash = await blockchainService.storeRecordHash(recordHash);
          blockchainVerified = true;

          toast.success("Record hash stored on blockchain");
        } catch (blockchainError: any) {
          toast.error("Blockchain storage failed: " + blockchainError.message);
        }
      }

      const { error } = await supabase.from("medical_records").insert({
        patient_id: formData.patientId,
        doctor_id: doctorId,
        record_type: formData.recordType,
        diagnosis: formData.diagnosis,
        record_data: parsedData,
        record_hash: recordHash,
        blockchain_tx_hash: blockchainTxHash,
        blockchain_verified: blockchainVerified,
        blockchain_timestamp: blockchainVerified ? new Date().toISOString() : null,
      });

      if (error) throw error;

      toast.success("Medical record created successfully");
      setFormData({
        patientId: "",
        recordType: "",
        diagnosis: "",
        recordData: "",
      });
    } catch (error: any) {
      toast.error("Failed to create medical record");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-elegant border-border/50">
      <CardHeader>
        <CardTitle>Create Medical Record</CardTitle>
        <CardDescription>Add a new medical record for a patient</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="patientId">Patient</Label>
            <Select
              value={formData.patientId}
              onValueChange={(value) => setFormData({ ...formData, patientId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="recordType">Record Type</Label>
            <Select
              value={formData.recordType}
              onValueChange={(value) => setFormData({ ...formData, recordType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consultation">Consultation</SelectItem>
                <SelectItem value="lab_result">Lab Result</SelectItem>
                <SelectItem value="imaging">Imaging</SelectItem>
                <SelectItem value="surgery">Surgery</SelectItem>
                <SelectItem value="vaccination">Vaccination</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Input
              id="diagnosis"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="recordData">Record Data (JSON) - Optional</Label>
            <Textarea
              id="recordData"
              value={formData.recordData}
              onChange={(e) => setFormData({ ...formData, recordData: e.target.value })}
              placeholder='{"notes": "Patient doing well", "vitals": {"bp": "120/80", "temperature": "98.6"}}'
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">Leave empty or enter valid JSON only</p>
          </div>

          <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
            <Checkbox
              id="blockchain"
              checked={storeOnBlockchain}
              onCheckedChange={(checked) => setStoreOnBlockchain(checked as boolean)}
            />
            <div className="flex items-center gap-2">
              <Label htmlFor="blockchain" className="cursor-pointer">
                Store hash on blockchain for immutability
              </Label>
              <ShieldCheck className="w-4 h-4 text-green-500" />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating..." : "Create Record"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateMedicalRecord;
