-- Add blockchain verification columns to medical_records
ALTER TABLE medical_records
ADD COLUMN record_hash TEXT,
ADD COLUMN blockchain_tx_hash TEXT,
ADD COLUMN blockchain_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN blockchain_timestamp TIMESTAMP WITH TIME ZONE;

-- Add wallet address to profiles for decentralized identity
ALTER TABLE profiles
ADD COLUMN wallet_address TEXT UNIQUE,
ADD COLUMN wallet_verified BOOLEAN DEFAULT FALSE;

-- Create index for faster blockchain lookups
CREATE INDEX idx_medical_records_blockchain_tx ON medical_records(blockchain_tx_hash);
CREATE INDEX idx_profiles_wallet ON profiles(wallet_address);