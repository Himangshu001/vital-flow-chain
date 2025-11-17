import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet, CheckCircle2, AlertCircle } from "lucide-react";
import { blockchainService } from "@/lib/blockchain";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WalletConnectProps {
  userId: string;
}

export function WalletConnect({ userId }: WalletConnectProps) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadWalletInfo();
  }, [userId]);

  const loadWalletInfo = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('wallet_address, wallet_verified')
      .eq('id', userId)
      .single();

    if (data?.wallet_address) {
      setWalletAddress(data.wallet_address);
      setIsVerified(data.wallet_verified || false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const address = await blockchainService.connectWallet();
      
      // Sign a message to verify ownership
      const message = `Verify wallet ownership for patient ID: ${userId}`;
      const signature = await blockchainService.signMessage(message);
      
      // Verify the signature
      const recoveredAddress = blockchainService.verifySignature(message, signature);
      
      if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
        // Update profile with wallet address
        await supabase
          .from('profiles')
          .update({
            wallet_address: address,
            wallet_verified: true
          })
          .eq('id', userId);

        setWalletAddress(address);
        setIsVerified(true);

        toast({
          title: "Wallet Connected",
          description: "Your decentralized identity has been verified!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Wallet className="w-6 h-6 text-primary" />
        <h3 className="text-lg font-semibold">Decentralized Identity</h3>
      </div>

      {walletAddress ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Wallet Address</p>
              <p className="font-mono font-medium">{formatAddress(walletAddress)}</p>
            </div>
            {isVerified ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            {isVerified ? (
              <p className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                Identity verified on blockchain
              </p>
            ) : (
              <p className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="w-4 h-4" />
                Wallet connected but not verified
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your Web3 wallet to establish a decentralized identity for your medical records.
            This ensures you have full control over your health data.
          </p>
          <Button 
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full"
          >
            <Wallet className="w-4 h-4 mr-2" />
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Requires MetaMask or compatible Web3 wallet
          </p>
        </div>
      )}
    </Card>
  );
}
