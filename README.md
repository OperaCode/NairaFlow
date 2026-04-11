# NairaFlow - Smart Savings & Remittance App

A modern fintech web application that helps users receive stablecoins, automatically protect their savings, and prevent inflation erosion. Built with Next.js, blockchain smart contracts, and designed for African remittance users.

## Features

- **Auto-Save by Default**: Automatically split incoming USDC/USDT into spendable Naira and protected savings
- **Inflation Protection**: Keep savings in stablecoins (USDC/USDT) to protect against Naira devaluation
- **Flex Mode**: Optional feature to skip savings on one transfer with a 7-day cooldown
- **Smart Split Engine**: Configurable savings percentage (minimum 10%)
- **Real-time Dashboard**: View Naira balance, USD savings, and transaction history
- **Insights Analytics**: Track total saved, growth charts, and savings comparisons
- **Blockchain-Backed**: Secure smart contracts on EVM-compatible blockchains (Monad)

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + Shadcn UI
- **State Management**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: Sonner

### Backend
- **Runtime**: Node.js (Next.js API Routes)
- **Storage**: MongoDB
- **Authentication**: JWT + Cookies
- **API**: RESTful endpoints

### Blockchain
- **Smart Contracts**: Solidity 0.8.19
- **Framework**: Foundry
- **Network**: Monad EVM Testnet
- **Token**: MockUSDC (ERC20)

## Project Structure

```
/vercel/share/v0-project/
├── app/
│   ├── layout.tsx                 # Root layout with metadata
│   ├── page.tsx                   # Landing page
│   ├── globals.css                # Global styles + design tokens
│   ├── (auth)/                    # Auth routes (no sidebar)
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (app)/                     # Protected routes (with sidebar)
│   │   ├── layout.tsx             # App layout with navigation
│   │   ├── dashboard/page.tsx
│   │   ├── receive/page.tsx
│   │   ├── savings/page.tsx
│   │   ├── insights/page.tsx
│   │   ├── flex-mode/page.tsx
│   │   └── settings/page.tsx
│   └── api/                       # Backend API routes
│       ├── auth/
│       │   ├── register/route.ts
│       │   └── login/route.ts
│       ├── wallet/
│       │   ├── route.ts           # GET wallet info
│       │   └── receive/route.ts   # POST simulate transfer
│       ├── flex-mode/
│       │   └── activate/route.ts
│       ├── savings/route.ts       # GET savings data
│       └── user/
│           └── settings/route.ts
├── lib/
│   ├── auth.ts                    # Auth utilities & JWT
│   ├── wallet.ts                  # Wallet logic & smart split
│   └── db/
│       └── models.ts              # Database models and MongoDB collections
├── middleware.ts                  # Route protection & redirects
├── contracts/                     # Solidity smart contracts
│   ├── src/
│   │   ├── SmartWallet.sol       # Main smart contract
│   │   └── MockUSDC.sol          # ERC20 test token
│   ├── script/
│   │   └── Deploy.s.sol          # Foundry deployment script
│   └── foundry.toml              # Foundry configuration
└── public/                        # Static assets
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm or npm
- (Optional) Foundry for smart contract deployment

### Installation

1. **Clone/Open the project**
```bash
cd /vercel/share/v0-project
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Configure environment variables**
```bash
cp .env.example .env.local
```

Set `MONGODB_URI` to your MongoDB connection string (Atlas or local MongoDB).

4. **Run the development server**
```bash
pnpm dev
```

5. **Open in browser**
```
http://localhost:3000
```

## Demo Flow

Follow these steps to test the complete NairaFlow experience:

### 1. Landing Page
- Open http://localhost:3000
- See the hero section with feature highlights
- Click "Get Started" or "Login"

### 2. Register Account
- Email: `demo@example.com`
- Password: `password123`
- Account is created with auto-generated wallet
- Redirects to login page

### 3. Login
- Enter credentials
- Redirected to dashboard
- See fresh account with ₦0 and $0

### 4. Receive Funds (Smart Split)
- Navigate to "Receive" page
- See your wallet address
- Simulate receiving $100
- Watch the split visualization:
  - ₦108,000 spendable (90%)
  - $10 protected savings (10%)
- View updated dashboard

### 5. View Savings
- Click "Savings" in sidebar
- See $10 in protected vault
- View savings goals and withdrawal options

### 6. Activate Flex Mode
- Go to "Flex Mode" page
- Read the explanation
- Click "Activate Flex Mode"
- Status changes to "Ready to Use"

### 7. Simulate Another Transfer
- Go back to "Receive"
- Simulate $100 transfer again
- See 0% savings (Flex Mode active!)
- ₦120,000 all spendable
- 7-day cooldown starts

### 8. View Insights
- Click "Insights" in sidebar
- See total received: $200
- See total saved: $10
- Growth chart shows $10 saved at day 1, flat after flex mode
- Comparison: "Without NairaFlow: $0 saved"

### 9. Settings
- Adjust savings percentage (10-100%)
- Copy wallet address
- View security info
- Change notifications

### 10. Dashboard
- See updated balances
- Recent transactions listed
- Quick action buttons

## API Routes

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login with email/password

### Wallet
- `GET /api/wallet` - Get wallet info (Naira, USD savings, flex mode status)
- `POST /api/wallet/receive` - Simulate receiving funds (applies smart split)

### Savings
- `GET /api/savings` - Get savings data, stats, and transaction history

### Flex Mode
- `POST /api/flex-mode/activate` - Activate flex mode for next transfer

### Settings
- `PATCH /api/user/settings` - Update savings percentage

## Smart Contract Deployment

### Local Testing (Anvil)
```bash
# Terminal 1: Start local Ethereum node
anvil

# Terminal 2: Deploy contracts
cd contracts
forge script script/Deploy.s.sol:DeployScript --rpc-url http://localhost:8545 --broadcast
```

### Monad Testnet Deployment

1. **Setup Foundry environment**
```bash
cd contracts
forge init --force
```

2. **Set environment variables** (create `.env`)
```
PRIVATE_KEY=your_private_key_here
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
```

3. **Deploy to Monad Testnet**
```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://testnet-rpc.monad.xyz \
  --broadcast \
  --verify
```

4. **Save deployed addresses** (update frontend config)
```
SmartWallet: 0x...
MockUSDC: 0x...
```

## Authentication

### How It Works
1. User registers with email/password
2. Password is hashed with SHA256
3. Wallet address auto-generated (40 hex chars)
4. JWT token created and stored in httpOnly cookie
5. Requests require valid token in cookies

### Protected Routes
- `/app/*` - All app pages require authentication
- Unauthenticated users redirected to `/auth/login`
- Authenticated users can't access auth pages

## Smart Split Logic

### Default Behavior
```
Incoming $100 USD
├─ 10% (default) → $10 saved in vault (USDC)
└─ 90% → ₦108,000 spendable (at 1 USD = ₦1200)
```

### With Flex Mode Active
```
Incoming $100 USD (Flex Mode active)
├─ 0% → $0 saved
└─ 100% → ₦120,000 spendable
└─ Cooldown: 7 days before Flex Mode available again
```

### Flex Mode Cooldown
- After using Flex Mode, 7-day cooldown begins
- During cooldown, normal savings rate applies
- After cooldown expires, user can activate Flex Mode again

## Exchange Rates

Currently using mock exchange rate:
- 1 USD = ₦1200 (NGN)
- In production, integrate with real API (e.g., Coingecko, Binance)

```typescript
// lib/wallet.ts
export function getExchangeRate(): number {
  // Mock: returns 1200 ± 10
  return MOCK_EXCHANGE_RATE + Math.random() * 20 - 10
}
```

## Data Storage

### Current Implementation (Hackathon)
- **In-memory storage** using JavaScript `Map`
- Data stored in `lib/db/models.ts`
- Data resets on server restart

### For Production
Replace with:
- MongoDB (as specified in tech stack)
- Supabase, Firebase, or other managed database
- Implement database migrations

## Styling & Design

### Color System
- **Primary**: Deep Blue (Indigo) - For CTA buttons and key elements
- **Secondary**: Teal/Cyan - For savings and positive actions
- **Accent**: Teal/Cyan gradient - For highlights
- **Neutral**: Grays - For backgrounds and text

### Design Tokens
Located in `app/globals.css`:
- CSS custom properties for consistent theming
- Dark mode support built-in
- Responsive spacing and sizing

## Performance Optimizations

- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic route-based code splitting
- **API Caching**: SWR for data fetching (can be added)
- **Debounced Updates**: Toast notifications use Sonner

## Security Considerations

⚠️ **For Hackathon Demo Only** - These are simplified for quick iteration:

- [x] Password hashing (SHA256 - use bcrypt in production)
- [x] JWT tokens with expiration
- [x] httpOnly cookies for token storage
- [x] Route middleware for auth protection
- [ ] Rate limiting (TODO)
- [ ] CSRF protection (TODO)
- [ ] Input validation (TODO)
- [ ] SQL injection prevention (N/A - in-memory storage)

## Future Enhancements

1. **Real Blockchain Integration**
   - Deploy on Monad mainnet
   - Use real smart contract addresses
   - Implement actual fund transfers

2. **Enhanced Authentication**
   - Web3Auth for wallet login
   - Google/GitHub OAuth (UI exists, needs implementation)
   - Two-factor authentication

3. **Database**
   - Switch to MongoDB Atlas
   - Implement RLS with Supabase
   - Database migrations and versioning

4. **Features**
   - Savings goals with milestone alerts
   - Recurring transfers
   - Multi-currency support
   - Push notifications
   - Mobile app (React Native)

5. **Analytics**
   - Heatmaps and user behavior tracking
   - Advanced savings projections
   - Financial advice recommendations

6. **Compliance**
   - KYC/AML integration
   - Regulatory compliance for remittances
   - Audit trails for all transactions

## Testing

### Manual Testing Checklist

- [ ] Register new account
- [ ] Login with credentials
- [ ] View wallet address
- [ ] Simulate $100 transfer
- [ ] Verify smart split (90% Naira, 10% savings)
- [ ] Activate Flex Mode
- [ ] Simulate transfer with Flex Mode (100% Naira, 0% savings)
- [ ] Check cooldown timer
- [ ] Update savings percentage
- [ ] View insights and charts
- [ ] Copy wallet address
- [ ] Logout and login again

### Unit Tests
```bash
# Run tests (when implemented)
pnpm test
```

### Contract Tests
```bash
# Test Solidity contracts
cd contracts
forge test
```

## Deployment

### Vercel Deployment
```bash
# Push to GitHub and connect to Vercel
# Automatic deployments on push to main

pnpm build
pnpm start
```

### Environment Variables
```
# For production, set these in Vercel:
DATABASE_URL=...
JWT_SECRET=...
NEXT_PUBLIC_API_URL=...
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
pnpm dev
```

### Clear Node Modules
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Smart Contract Deployment Issues
- Ensure private key is set in `.env`
- Check Monad testnet RPC endpoint
- Verify contract syntax: `forge build`
- Check gas prices and balance

## Support

For questions or issues:
1. Check this README first
2. Review API route implementations
3. Check frontend component code
4. Inspect browser console for errors
5. Check server logs for API errors

## License

MIT - See LICENSE file

## Contributing

This is a hackathon submission. Feel free to fork and extend!

---

**Built with ❤️ for NairaFlow**

*Making remittances smarter, savings automatic, and financial security accessible.*
