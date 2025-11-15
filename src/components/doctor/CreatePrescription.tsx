import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Patient {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

const CreatePrescription = ({ doctorId }: { doctorId: string }) => {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [formData, setFormData] = useState({
    patientId: "",
    diagnosis: "",
    instructions: "",
    validUntil: "",
    medications: "",
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
      const medicationsArray = formData.medications.split("\n").map((med) => {
        const parts = med.trim().split(",");
        return {
          name: parts[0]?.trim() || "",
          dosage: parts[1]?.trim() || "",
          frequency: parts[2]?.trim() || "",
        };
      });

      const { error } = await supabase.from("prescriptions").insert({
        patient_id: formData.patientId,
        doctor_id: doctorId,
        diagnosis: formData.diagnosis,
        instructions: formData.instructions,
        valid_until: formData.validUntil,
        medications: medicationsArray,
      });

      if (error) throw error;

      toast.success("Prescription created successfully");
      setFormData({
        patientId: "",
        diagnosis: "",
        instructions: "",
        validUntil: "",
        medications: "",
      });
    } catch (error: any) {
      toast.error("Failed to create prescription");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-elegant border-border/50">
      <CardHeader>
        <CardTitle>Create New Prescription</CardTitle>
        <CardDescription>Enter prescription details for a patient</CardDescription>
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
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Input
              id="diagnosis"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="medications">
              Medications (one per line: name, dosage, frequency)
            </Label>
            <Textarea
              id="medications"
              value={formData.medications}
              onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
              placeholder="Amoxicillin, 500mg, 3 times daily"
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="validUntil">Valid Until</Label>
            <Input
              id="validUntil"
              type="date"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating..." : "Create Prescription"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreatePrescription;
