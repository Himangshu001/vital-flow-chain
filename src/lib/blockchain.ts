import { ethers } from 'ethers';

// Simple smart contract ABI for storing medical record hashes
const MEDICAL_RECORD_ABI = [
  "event RecordStored(bytes32 indexed recordHash, address indexed patient, uint256 timestamp)",
  "function storeRecordHash(bytes32 recordHash) public returns (bool)",
  "function verifyRecordHash(bytes32 recordHash) public view returns (bool, uint256, address)"
];

// Contract address on Polygon Mumbai testnet (you can deploy your own)
const CONTRACT_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"; // Placeholder

export class BlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  async connectWallet(): Promise<string> {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed. Please install MetaMask to use blockchain features.');
    }

    this.provider = new ethers.BrowserProvider(window.ethereum);
    
    // Request account access
    await this.provider.send("eth_requestAccounts", []);
    this.signer = await this.provider.getSigner();
    
    const address = await this.signer.getAddress();
    
    // Switch to Polygon Mumbai testnet
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x13881' }], // Polygon Mumbai
      });
    } catch (switchError: any) {
      // Chain not added, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x13881',
            chainName: 'Polygon Mumbai',
            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
            rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
            blockExplorerUrls: ['https://mumbai.polygonscan.com/']
          }]
        });
      }
    }
    
    return address;
  }

  async getConnectedAddress(): Promise<string | null> {
    if (!this.provider) {
      if (typeof window.ethereum === 'undefined') return null;
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }

    try {
      const accounts = await this.provider.listAccounts();
      return accounts.length > 0 ? accounts[0].address : null;
    } catch {
      return null;
    }
  }

  // Create hash of medical record for blockchain storage
  createRecordHash(recordData: {
    diagnosis: string;
    record_type: string;
    patient_id: string;
    timestamp: string;
  }): string {
    const dataString = JSON.stringify(recordData);
    return ethers.keccak256(ethers.toUtf8Bytes(dataString));
  }

  // Store record hash on blockchain
  async storeRecordHash(recordHash: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      MEDICAL_RECORD_ABI,
      this.signer
    );

    const tx = await contract.storeRecordHash(recordHash);
    const receipt = await tx.wait();
    
    return receipt.hash;
  }

  // Verify record hash exists on blockchain
  async verifyRecordHash(recordHash: string): Promise<{
    verified: boolean;
    timestamp: number;
    patient: string;
  }> {
    if (!this.provider) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }

    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      MEDICAL_RECORD_ABI,
      this.provider
    );

    const [verified, timestamp, patient] = await contract.verifyRecordHash(recordHash);
    
    return {
      verified,
      timestamp: Number(timestamp),
      patient
    };
  }

  // Sign message with wallet for identity verification
  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }
    
    return await this.signer.signMessage(message);
  }

  // Verify signed message
  verifySignature(message: string, signature: string): string {
    return ethers.verifyMessage(message, signature);
  }
}

export const blockchainService = new BlockchainService();

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
