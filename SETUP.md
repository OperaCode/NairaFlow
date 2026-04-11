# NairaFlow - Quick Start Guide

## 1. Installation (2 minutes)

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit **http://localhost:3000** in your browser.

---

## 2. First-Time Demo (5 minutes)

### Register
1. Click **"Get Started"** on landing page
2. Enter any email: `demo@example.com`
3. Password: `password123`
4. Confirm password
5. Click **"Create Account"**
6. Redirected to login page

### Login
1. Enter your email and password
2. Click **"Sign In"**
3. Redirected to **Dashboard**

---

## 3. Quick Demo Flow (10 minutes)

### Step 1: View Dashboard
- See your empty wallet
- Naira Balance: ₦0
- USD Savings: $0
- Savings Rate: 10%

### Step 2: Receive Funds (Simulate Transfer)
1. Click **"Receive"** in sidebar
2. See your wallet address
3. Click **"Simulate Transfer"** button
4. Watch smart split happen:
   - $100 received
   - $90 → ₦108,000 spendable
   - $10 → protected in vault

### Step 3: View Savings
1. Click **"Savings"** in sidebar
2. See $10 in protected vault
3. View goals and withdrawal options

### Step 4: Activate Flex Mode
1. Click **"Flex Mode"** in sidebar
2. Read the explanation
3. Click **"Activate Flex Mode"**
4. Status shows "Ready to Use"

### Step 5: Simulate Another Transfer (Flex Mode Active)
1. Go to **"Receive"** page
2. Simulate $100 transfer
3. This time:
   - $100 → ₦120,000 spendable
   - $0 → savings skipped (Flex Mode!)
   - 7-day cooldown starts

### Step 6: View Dashboard Updates
1. Go to **"Dashboard"**
2. See updated balances
3. Naira increased to ₦228,000 (108k + 120k)
4. Savings still $10
5. Flex Mode cooldown showing

### Step 7: Check Insights
1. Click **"Insights"**
2. See:
   - Total Received: $200
   - Total Saved: $10
   - Comparison chart
   - Growth analysis

### Step 8: Adjust Settings
1. Click **"Settings"**
2. Change savings rate to 20%
3. Save changes
4. Copy wallet address

---

## 4. Key Pages Explained

### Landing Page (`/`)
- Marketing page with features
- Call-to-action buttons
- Responsive design

### Authentication (`/auth/login`, `/auth/register`)
- Email/password signup
- Login with credentials
- Google OAuth button (UI only)

### Dashboard (`/app/dashboard`)
- Main overview page
- Shows Naira & USD balances
- Quick action buttons
- Recent transactions

### Receive (`/app/receive`)
- Wallet address display
- QR code placeholder
- **Simulate transfer button** ← Key feature for demo
- Split visualization

### Savings (`/app/savings`)
- Protected vault display
- Savings goals tracker
- Withdrawal options
- Transaction history

### Flex Mode (`/app/flex-mode`)
- Explanation of flex mode
- Activation button
- Cooldown timer
- Rules and scenarios

### Insights (`/app/insights`)
- Charts showing savings growth
- Comparison: with vs without NairaFlow
- Key metrics and statistics

### Settings (`/app/settings`)
- **Savings percentage slider** ← Adjust here
- Wallet address management
- Notification preferences
- Account management

---

## 5. Smart Split in Action

### Understanding the Math

**When you receive $100:**

```
Default (10% savings):
- Spendable: $100 × 90% = $90 → ₦108,000
- Savings: $100 × 10% = $10 (USDC vault)

With Flex Mode Active:
- Spendable: $100 × 100% = $100 → ₦120,000
- Savings: $0 (skipped!)
- Cooldown: 7 days
```

**Exchange Rate:** 1 USD = ₦1200 (mock rate)

---

## 6. Testing Scenarios

### Scenario 1: Building Savings
1. Simulate 5 transfers of $100
2. Watch savings grow to $50
3. See dashboard update
4. Check insights for growth chart

### Scenario 2: Using Flex Mode
1. Activate Flex Mode
2. Receive funds - see 0% savings
3. Try activating again - error (on cooldown)
4. Wait for cooldown timer

### Scenario 3: Changing Settings
1. Go to Settings
2. Change savings to 50%
3. Simulate transfer
4. See split changes

---

## 7. File Structure Quick Reference

**Key Frontend Files:**
- `app/page.tsx` - Landing page
- `app/auth/login/page.tsx` - Login form
- `app/auth/register/page.tsx` - Sign up form
- `app/app/dashboard/page.tsx` - Main dashboard
- `app/app/receive/page.tsx` - **Simulator location**
- `app/app/settings/page.tsx` - Settings and controls

**Backend Files:**
- `lib/auth.ts` - Authentication logic
- `lib/wallet.ts` - **Smart split logic lives here**
- `lib/db/models.ts` - Data models and storage
- `app/api/wallet/receive/route.ts` - **API that handles simulation**

---

## 8. Common Actions

### Copy Wallet Address
- Click the "Copy" button on Dashboard
- Or go to Settings and copy there

### Change Savings Rate
- Settings → Auto-Save Rate slider
- Adjust to 10%, 20%, 50%, or 100%
- Click "Save Changes"

### Simulate Different Amounts
- Receive page → Change the amount
- Or click preset buttons ($100, $500)
- Click "Simulate Transfer"

### Logout
- Click your profile icon (top right)
- Or Settings → Logout button
- Redirected to login page

---

## 9. Testing Checklist

- [ ] Can register new account
- [ ] Can login with credentials
- [ ] Can simulate $100 transfer
- [ ] Sees smart split: ₦108,000 spendable + $10 savings
- [ ] Can activate Flex Mode
- [ ] Second transfer shows 0% savings
- [ ] Can see 7-day cooldown timer
- [ ] Can change savings percentage
- [ ] Can view Insights page
- [ ] Can copy wallet address
- [ ] Can logout and login again

---

## 10. Troubleshooting

**Q: Can't login after registering?**
- Go to `/auth/login`
- Refresh page
- Try email and password again

**Q: Balances not updating?**
- Refresh the page (Cmd+R or Ctrl+R)
- Check browser console (F12) for errors

**Q: Flex Mode button not working?**
- May be on cooldown - check timer
- Refresh page to see updated status

**Q: Want to reset?**
- Clear cookies/logout
- Register new account with different email

---

## 11. Architecture Overview

```
User Flow:
Landing Page → Register → Dashboard → Receive (Simulate) → Settings

Data Flow:
1. User clicks "Simulate Transfer"
2. Frontend calls /api/wallet/receive
3. Backend (lib/wallet.ts) runs smartSplit()
4. Balances update in memory
5. Response returned with split breakdown
6. Frontend shows split animation
7. Dashboard reflects new balances
```

---

## 12. Next Steps After Demo

1. **Explore the code**: Check `app/api/wallet/receive/route.ts` to see the API
2. **Review smart contract**: Look at `contracts/src/SmartWallet.sol`
3. **Deploy to Vercel**: Push to GitHub and connect to Vercel
4. **Deploy smart contracts**: Follow `contracts/Deploy.s.sol` guide
5. **Add database**: Replace in-memory storage with MongoDB Atlas
6. **Implement OAuth**: Wire up Google login (button already exists)

---

## 13. Video Demo Flow

If presenting, follow this 2-minute script:

1. **"This is NairaFlow"** - Show landing page
2. **"Sign up is instant"** - Register account, show wallet auto-generated
3. **"Receive funds"** - Navigate to Receive page
4. **"Smart split happens"** - Simulate $100 transfer, show split breakdown
5. **"Flexible savings"** - Activate Flex Mode, show next transfer gets 0% savings
6. **"See your insights"** - Go to Insights, show chart and comparison
7. **"Control everything"** - Go to Settings, adjust savings rate
8. **"All blockchain-backed"** - Mention smart contracts on Monad

**Total time: ~2 minutes**

---

**Ready to go! Start with `pnpm dev` and visit http://localhost:3000** 🚀
