import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Heart, QrCode, Pill, Shield, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-gradient-hero rounded-full shadow-glow animate-pulse">
              <Heart className="w-16 h-16 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            HealthConnect
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Smart Patient Data Management with AI Integration, QR Code Technology, and Blockchain Security
          </p>

          <div className="flex gap-4 justify-center pt-6">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-md"
            >
              Get Started
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="p-6 bg-card rounded-lg shadow-md border border-border/50">
            <QrCode className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">QR Code Access</h3>
            <p className="text-muted-foreground">
              Instant data sharing with hospitals through secure QR codes
            </p>
          </div>

          <div className="p-6 bg-card rounded-lg shadow-md border border-border/50">
            <Pill className="w-12 h-12 text-secondary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Medication Tracking</h3>
            <p className="text-muted-foreground">
              Smart reminders for medication expiry and refills
            </p>
          </div>

          <div className="p-6 bg-card rounded-lg shadow-md border border-border/50">
            <Shield className="w-12 h-12 text-accent mb-4" />
            <h3 className="text-xl font-semibold mb-2">Blockchain Secured</h3>
            <p className="text-muted-foreground">
              Your data protected with advanced encryption
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
