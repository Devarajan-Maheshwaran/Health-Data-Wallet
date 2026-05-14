# MedVault — Self-Sovereign Health & Document Vault

> **Your data. Your wallet. Your control.**

MedVault is a self-sovereign health data platform where a person's entire medical history, insurance documents, family health records, prescriptions, lab reports, and emergency information live **encrypted in decentralised storage** and are governed by their **blockchain wallet** — not by any hospital, government, or app company.

The AI layer runs **entirely in-browser** using WebAssembly — no paid APIs, no data leaving the user's device.

> **Future vision:** MedVault is domain-agnostic. The same architecture supports any high-security document vault — legal contracts linked to attorneys, financial records shared with accountants, identity documents for government services. The current sprint focuses on the medical use case.

---

## Tech Stack (Summary)

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| Web3 | wagmi v2 + viem + RainbowKit, SIWE auth |
| Smart Contracts | Solidity 0.8.24, Hardhat, BSC Testnet → opBNB |
| Storage | BNB Greenfield (encrypted files), IPFS (public metadata fallback) |
| Encryption | AES-256-GCM, key derived from wallet signature (EIP-712 → HKDF) |
| AI | Transformers.js (browser WebAssembly) — zero paid APIs |
| Backend | Node.js + Hono, Supabase Postgres, Upstash Redis |

---

## Smart Contract Architecture

Three contracts, one responsibility each:

```
contracts/
├── PatientRegistry.sol      # Identity, registration, emergency/public card, trusted parties
├── HealthRecordStore.sol    # Versioned document CIDs + metadata hashes
└── AccessController.sol     # Time-limited, tier-based, per-record access grants + audit log
```

### DocumentType enum (domain-agnostic)

| Value | Use Case |
|---|---|
| LAB_REPORT, PRESCRIPTION, IMAGING, DISCHARGE_SUMMARY, VACCINATION | Medical |
| INSURANCE_POLICY, LEGAL_CONTRACT, IDENTITY_DOCUMENT | Legal / Identity |
| FINANCIAL_RECORD, PROPERTY_DOCUMENT, ACADEMIC_CREDENTIAL | Financial / General |
| OTHER | Catch-all |

---

## AI Layer (Zero Paid APIs)

Every model runs in the **browser via Transformers.js (WebAssembly)**:

| Feature | Model | Where It Runs |
|---|---|---|
| Medical NER (extract diseases, drugs, lab values) | `d4data/biomedical-ner-all` | Browser WASM |
| Document type classification | `Xenova/bart-large-mnli` (zero-shot) | Browser WASM |
| Health Q&A over records | `Xenova/LaMini-Flan-T5-783M` | Browser WASM |
| Embeddings for vector search | `Xenova/all-MiniLM-L6-v2` | Browser WASM |
| Drug interaction check | Fine-tuned BiomedBERT → ONNX | Browser ONNX Runtime |
| PDF text extraction | PDF.js | Browser |
| Scanned PDF OCR | Tesseract.js | Browser WASM |

Patient documents **never leave the device** for any AI operation.

---

## Encryption Architecture

1. User signs a deterministic EIP-191 message with their wallet
2. Signature → `keccak256` → HKDF → **AES-256-GCM key**
3. Files are encrypted client-side before any upload
4. Only the encrypted blob touches BNB Greenfield — storage layer never sees plaintext
5. For provider access: AES key is re-encrypted with the provider's public key (ECIES / x25519-xsalsa20-poly1305)

---

## Build Phases

| Phase | Status | Description |
|---|---|---|
| **Phase 1** | ✅ Complete | Fix contracts, remove broken HealthRecord.sol monolith, clean repo structure |
| **Phase 2** | 🔲 Next | Scaffold Next.js 14 frontend — wagmi + RainbowKit + Tailwind + shadcn + SIWE auth |
| **Phase 3** | 🔲 Pending | Wallet-based AES key derivation + BNB Greenfield SDK + encrypted file upload |
| **Phase 4** | 🔲 Pending | Transformers.js AI pipeline — NER on upload, document classifier, PDF.js + Tesseract |
| **Phase 5** | 🔲 Pending | In-browser RAG (IndexedDB vector store + LaMini-T5 Q&A) + drug interaction ONNX model |
| **Phase 6** | 🔲 Pending | All 7 UI pages + Supabase DB schema + API routes + Vercel production deploy |

---

## UI Pages

1. **Landing** — hero, problem cards, how-it-works flow, trust indicators
2. **Dashboard** — health score, record counts by type, recent activity, pending requests
3. **Records Vault** — upload, AI classify, encrypt, store; version history timeline per record
4. **Access Manager** — active grants table, revoke, approve/reject requests, full on-chain audit log
5. **AI Assistant** — in-browser chat over personal records, drug interaction checker
6. **Emergency Profile** — QR card designer, download/print, emergency contact manager
7. **Provider Portal** — separate view for registered doctors/attorneys: request access, add notes

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in values
cp .env.example .env

# 3. Compile contracts
npx hardhat compile

# 4. Run tests
npx hardhat test

# 5. Deploy locally
npx hardhat node
npx hardhat deploy --network localhost

# 6. Deploy to BSC Testnet
npx hardhat deploy --network bscTestnet
```

---

## Deployment Targets

| Service | What Runs There |
|---|---|
| Vercel | Next.js frontend + lightweight API routes |
| BSC Testnet → opBNB | Smart contracts |
| BNB Greenfield Testnet | Encrypted health/document files |
| Supabase | Postgres (provider registry, access requests, metadata cache) |
| Upstash Redis | Rate limiting + notification queue |
| Browser Cache (OPFS) | Transformers.js model weights |
| IndexedDB | Patient's local vector store |

---

## License

MIT
