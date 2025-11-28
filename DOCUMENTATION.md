# HealthConnect - Healthcare Blockchain Application

## Project Overview
A decentralized healthcare management system that combines traditional healthcare data management with blockchain technology for immutable record verification and decentralized patient identity.

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | ^18.3.1 | UI Framework |
| TypeScript | - | Type Safety |
| Vite | - | Build Tool & Dev Server |
| Tailwind CSS | - | Utility-first CSS |
| shadcn/ui | - | UI Component Library |
| React Router DOM | ^6.30.1 | Client-side Routing |
| TanStack React Query | ^5.83.0 | Server State Management |
| Lucide React | ^0.462.0 | Icon Library |

### Backend (Lovable Cloud/Supabase)
| Technology | Purpose |
|------------|---------|
| Supabase PostgreSQL | Database |
| Supabase Auth | Authentication |
| Supabase Edge Functions | Serverless Backend Logic |
| Row Level Security (RLS) | Data Access Control |

### Blockchain
| Technology | Version | Purpose |
|------------|---------|---------|
| ethers.js | ^6.15.0 | Ethereum/Polygon Interaction |
| MetaMask | - | Wallet Provider |
| Polygon Mumbai | Testnet | Blockchain Network |

### Additional Libraries
| Library | Purpose |
|---------|---------|
| qrcode.react | QR Code Generation |
| html5-qrcode | QR Code Scanning |
| date-fns | Date Manipulation |
| zod | Schema Validation |
| react-hook-form | Form Management |
| sonner | Toast Notifications |
| recharts | Data Visualization |

---

## Features Implemented

### 1. User Authentication & Authorization
- **Email/Password Authentication** via Supabase Auth
- **Role-Based Access Control (RBAC)**
  - Roles: `patient`, `doctor`, `admin`, `pharmacist`
  - Stored in separate `user_roles` table (security best practice)
  - `has_role()` database function for secure role checking

### 2. Patient Dashboard
- **Profile Management**: Personal info, emergency contacts, blood type
- **QR Code Generation**: Share medical data with healthcare providers
- **Medical Records View**: Access diagnosis history with blockchain verification status
- **Prescriptions View**: Current and past prescriptions
- **Medications Tracker**: Track active medications, dosages, expiry dates
- **AI Health Assistant**: AI-powered health queries (via Lovable AI)

### 3. Doctor Portal
- **Patient List**: View and manage assigned patients
- **Create Medical Records**: Add diagnoses with optional blockchain verification
- **Create Prescriptions**: Issue digital prescriptions

### 4. Admin Portal
- **User Role Management**: Assign/modify user roles

### 5. QR Code Scanner
- **Scan Patient QR Codes**: Access patient data for authorized users
- **Access Level Controls**: Basic, full, or emergency access

### 6. Blockchain Integration
- **Wallet Connection**: MetaMask integration for Polygon Mumbai
- **Decentralized Identity**: Verify patient identity via wallet signature
- **Immutable Records**: Store medical record hashes on blockchain
- **Verification**: Verify record integrity against blockchain

---

## Database Schema

### Tables

#### `profiles`
```sql
- id (uuid, PK) - References auth.users
- first_name, last_name (text)
- date_of_birth (date)
- gender, blood_type, phone (text)
- address, emergency_contact (jsonb)
- wallet_address (text) - Ethereum wallet
- wallet_verified (boolean)
- created_at, updated_at (timestamp)
```

#### `user_roles`
```sql
- id (uuid, PK)
- user_id (uuid) - References auth.users
- role (app_role enum: patient|doctor|admin|pharmacist)
- created_at (timestamp)
```

#### `medical_records`
```sql
- id (uuid, PK)
- patient_id, doctor_id (uuid)
- record_type, diagnosis (text)
- record_data (jsonb)
- record_hash (text) - Keccak256 hash
- blockchain_tx_hash (text) - Transaction hash
- blockchain_verified (boolean)
- blockchain_timestamp (timestamp)
- created_at (timestamp)
```

#### `prescriptions`
```sql
- id (uuid, PK)
- patient_id, doctor_id (uuid)
- diagnosis, instructions (text)
- medications (jsonb)
- status (text: active|completed|cancelled)
- prescription_date, valid_until (timestamp/date)
- created_at (timestamp)
```

#### `medications`
```sql
- id (uuid, PK)
- patient_id (uuid)
- prescription_id (uuid, FK)
- medicine_name, dosage, frequency (text)
- quantity (integer)
- expiry_date, manufacturing_date, dispensed_date (date)
- batch_number (text)
- reminder_sent (boolean)
- created_at (timestamp)
```

#### `qr_codes`
```sql
- id (uuid, PK)
- patient_id (uuid)
- access_level (text: basic|full|emergency)
- is_active (boolean)
- valid_from, valid_until (timestamp)
- max_usage, usage_count (integer)
- created_at (timestamp)
```

---

## API Endpoints

### Supabase Edge Functions

#### `health-assistant`
- **Purpose**: AI-powered health queries
- **Method**: POST
- **Auth**: Required (Bearer token)
- **Request Body**:
  ```json
  { "message": "user health question" }
  ```
- **Response**: AI-generated health advice based on user's medical context

---

## Blockchain Architecture

### Smart Contract Interface (ABI)
```javascript
[
  "event RecordStored(bytes32 indexed recordHash, address indexed patient, uint256 timestamp)",
  "function storeRecordHash(bytes32 recordHash) public returns (bool)",
  "function verifyRecordHash(bytes32 recordHash) public view returns (bool, uint256, address)"
]
```

### Blockchain Service (`src/lib/blockchain.ts`)

| Method | Description |
|--------|-------------|
| `connectWallet()` | Connect MetaMask, switch to Polygon Mumbai |
| `getConnectedAddress()` | Get current wallet address |
| `createRecordHash(data)` | Generate Keccak256 hash of medical record |
| `storeRecordHash(hash)` | Store hash on blockchain |
| `verifyRecordHash(hash)` | Verify hash exists on blockchain |
| `signMessage(message)` | Sign message for identity verification |
| `verifySignature(message, signature)` | Verify signed message |

### Network Configuration
- **Network**: Polygon Mumbai Testnet
- **Chain ID**: 0x13881 (80001)
- **RPC**: https://rpc-mumbai.maticvigil.com/
- **Explorer**: https://mumbai.polygonscan.com/

---

## Security Implementation

### Row Level Security (RLS) Policies

| Table | Policy | Access |
|-------|--------|--------|
| `profiles` | Users can CRUD own profile | Own data only |
| `profiles` | Doctors/Admins can view | Read access |
| `medical_records` | Patients view own | Own records |
| `medical_records` | Doctors can create | Insert only |
| `prescriptions` | Patients view own | Own prescriptions |
| `prescriptions` | Doctors/Pharmacists view | Read access |
| `medications` | Patients view own | Own medications |
| `medications` | Pharmacists/Doctors create | Insert only |
| `qr_codes` | Patients manage own | Full CRUD |
| `user_roles` | Users view own roles | Own roles |
| `user_roles` | Admins manage all | Full CRUD |

### Security Functions
```sql
has_role(_user_id uuid, _role app_role) RETURNS boolean
-- Securely checks user role without recursive RLS issues
```

---

## Application Routes

| Route | Component | Access |
|-------|-----------|--------|
| `/` | Index (Landing) | Public |
| `/auth` | Auth | Public |
| `/dashboard` | Dashboard | Patients |
| `/doctor` | DoctorPortal | Doctors |
| `/admin` | AdminPortal | Admins |
| `/scanner` | QRScanner | Authorized users |

---

## Environment Variables

```env
VITE_SUPABASE_URL        # Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY  # Supabase anon key
VITE_SUPABASE_PROJECT_ID # Project identifier
```

---

## Future Enhancements (Suggested)
1. Deploy custom smart contract for production
2. Add NFT-based prescription verification
3. Implement blockchain audit trail
4. Add IPFS for decentralized document storage
5. Multi-signature wallet for sensitive operations
6. Cross-chain compatibility

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

**Note**: MetaMask browser extension required for blockchain features.
