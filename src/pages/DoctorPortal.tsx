import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import PatientsList from "@/components/doctor/PatientsList";
import CreatePrescription from "@/components/doctor/CreatePrescription";
import CreateMedicalRecord from "@/components/doctor/CreateMedicalRecord";
import { User } from "@supabase/supabase-js";

const DoctorPortal = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyDoctorRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate("/auth");
        setIsLoading(false);
        return;
      }

      // Verify user has doctor role
      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "doctor")
        .maybeSingle();

      if (error || !roleData) {
        toast.error("Unauthorized: Doctor access required");
        navigate("/");
        setIsLoading(false);
        return;
      }

      setUser(session.user);
      setIsLoading(false);
    };

    verifyDoctorRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        navigate("/auth");
      } else {
        verifyDoctorRole();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Doctor Portal
            </h1>
            <p className="text-muted-foreground mt-2">Manage patients and prescriptions</p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>

        <Tabs defaultValue="patients" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="prescriptions">New Prescription</TabsTrigger>
            <TabsTrigger value="records">New Record</TabsTrigger>
          </TabsList>

          <TabsContent value="patients">
            <PatientsList doctorId={user?.id || ""} />
          </TabsContent>

          <TabsContent value="prescriptions">
            <CreatePrescription doctorId={user?.id || ""} />
          </TabsContent>

          <TabsContent value="records">
            <CreateMedicalRecord doctorId={user?.id || ""} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DoctorPortal;
