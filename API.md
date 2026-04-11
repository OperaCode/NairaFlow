# NairaFlow API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All protected endpoints require an `auth_token` cookie. Obtained after login.

---

## Endpoints

### Authentication

#### Register
**POST** `/auth/register`

Create a new NairaFlow account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "abc123",
    "email": "user@example.com",
    "walletAddress": "0x742d35cc6634C0532925a3b844Bc9e7595f42bE"
  }
}
```

**Error Response (400):**
```json
{
  "error": "User already exists"
}
```

---

#### Login
**POST** `/auth/login`

Authenticate with email and password. Sets `auth_token` cookie.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "abc123",
    "email": "user@example.com",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresAt": 1712000000000
}
```

**Cookies Set:**
```
auth_token=<jwt_token>; HttpOnly; Secure; Max-Age=604800
```

---

### Wallet

#### Get Wallet Info
**GET** `/wallet`

Retrieve current user's wallet information and balances.

**Headers:**
```
Cookie: auth_token=<jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "wallet": {
    "id": "abc123",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE",
    "nairaBalance": "108000.00",
    "usdBalance": "0.00",
    "savingsBalance": "10.00",
    "savingsPercentage": 10,
    "flexModeActive": false,
    "flexModeCooldownUntil": null
  }
}
```

**Error Response (401):**
```json
{
  "error": "Unauthorized"
}
```

---

#### Simulate Receive Funds
**POST** `/wallet/receive`

Simulate receiving funds. Applies smart split logic.

**Headers:**
```
Cookie: auth_token=<jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 100
}
```

**Response (200):**
```json
{
  "success": true,
  "transaction": {
    "amountReceived": 100,
    "spendableNaira": "108000.00",
    "savingsUSD": "10.00",
    "savingsPercentage": 10,
    "exchangeRate": "1200.50",
    "flexModeUsed": false
  },
  "wallet": {
    "nairaBalance": "108000.00",
    "savingsBalance": "10.00",
    "flexModeActive": false,
    "flexModeCooldownUntil": null
  }
}
```

**With Flex Mode Active:**
```json
{
  "success": true,
  "transaction": {
    "amountReceived": 100,
    "spendableNaira": "120000.00",
    "savingsUSD": "0.00",
    "savingsPercentage": 0,
    "exchangeRate": "1200.00",
    "flexModeUsed": true
  },
  "wallet": {
    "nairaBalance": "228000.00",
    "savingsBalance": "10.00",
    "flexModeActive": false,
    "flexModeCooldownUntil": 1712604800000
  }
}
```

---

### Savings

#### Get Savings Data
**GET** `/savings`

Retrieve savings information, statistics, and transaction history.

**Headers:**
```
Cookie: auth_token=<jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "savings": {
    "balance": "10.00",
    "percentage": 10
  },
  "stats": {
    "totalReceived": 100,
    "totalSaved": 10,
    "averageSavingsPercentage": 10,
    "transactionCount": 1
  },
  "transactions": [
    {
      "id": "txn123",
      "userId": "abc123",
      "type": "receive",
      "amount": 100,
      "amountNaira": 108000,
      "savingsAmount": 10,
      "savingsPercentage": 10,
      "flexModeUsed": false,
      "exchangeRate": 1200,
      "status": "completed",
      "createdAt": 1711913400000
    }
  ]
}
```

---

### Flex Mode

#### Activate Flex Mode
**POST** `/flex-mode/activate`

Activate flex mode for next transfer.

**Headers:**
```
Cookie: auth_token=<jwt_token>
```

**Request Body:**
```json
{}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Flex Mode activated. Your next transfer will skip savings.",
  "flexModeActive": true
}
```

**Error (On Cooldown):**
```json
{
  "error": "Flex mode is on cooldown"
}
```

**Error Response (401):**
```json
{
  "error": "Unauthorized"
}
```

---

### Settings

#### Update User Settings
**PATCH** `/user/settings`

Update user settings (savings percentage, etc).

**Headers:**
```
Cookie: auth_token=<jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "savingsPercentage": 20
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Savings percentage updated to 20%",
  "savingsPercentage": 20
}
```

**Validation Error (400):**
```json
{
  "error": "Percentage must be between 0 and 100"
}
```

---

## Error Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Transaction completed |
| 201 | Created | Account registered |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 404 | Not Found | User not found |
| 500 | Server Error | Internal error |

---

## Data Types

### User
```typescript
{
  id: string
  email: string
  walletAddress: string
  nairaBalance: number
  usdBalance: number
  savingsBalance: number
  savingsPercentage: number
  flexModeActive: boolean
  flexModeCooldownUntil: number | null
  createdAt: number
  updatedAt: number
}
```

### Transaction
```typescript
{
  id: string
  userId: string
  type: 'receive' | 'withdraw' | 'convert'
  amount: number // USD
  amountNaira: number
  savingsAmount: number
  savingsPercentage: number
  flexModeUsed: boolean
  exchangeRate: number
  status: 'pending' | 'completed' | 'failed'
  createdAt: number
}
```

### Wallet
```typescript
{
  id: string
  walletAddress: string
  nairaBalance: string
  usdBalance: string
  savingsBalance: string
  savingsPercentage: number
  flexModeActive: boolean
  flexModeCooldownUntil: number | null
}
```

---

## Exchange Rate

**Current Rate:** 1 USD = ₦1200 (mock)

**Real-time variation:** ±₦10 to simulate market fluctuations

To update in production, modify `lib/wallet.ts`:
```typescript
export function getExchangeRate(): number {
  // Fetch from API
  // const rate = await fetch('https://api.example.com/rates')
  return MOCK_EXCHANGE_RATE
}
```

---

## Authentication Flow

```
1. User -> POST /auth/register
2. Backend creates user + wallet
3. User -> POST /auth/login
4. Backend creates JWT token
5. Backend sets auth_token cookie
6. User can now access protected routes
7. Each request includes cookie automatically
8. Backend verifies token in middleware
```

---

## Smart Split Algorithm

```javascript
function smartSplit(userId, amountUSD) {
  const user = getUser(userId)
  let savingsPercent = user.savingsPercentage
  
  // Check flex mode
  if (user.flexModeActive && !onCooldown(user)) {
    savingsPercent = 0
    enableCooldown(user) // 7 days
  }
  
  // Minimum 10%
  if (savingsPercent < 10) savingsPercent = 10
  
  const savingsUSD = (amountUSD * savingsPercent) / 100
  const spendableUSD = amountUSD - savingsUSD
  const exchangeRate = getExchangeRate()
  const spendableNaira = spendableUSD * exchangeRate
  
  // Update balances
  user.savingsBalance += savingsUSD
  user.nairaBalance += spendableNaira
  
  return { savingsUSD, spendableNaira, exchangeRate }
}
```

---

## Rate Limiting

Currently **not implemented** for hackathon.

For production, implement rate limiting:
```javascript
// Example with redis
const rateLimit = require('express-rate-limit')

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})

app.use('/api/', limiter)
```

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Wallet
```bash
curl -X GET http://localhost:3000/api/wallet \
  -b cookies.txt
```

### Simulate Transfer
```bash
curl -X POST http://localhost:3000/api/wallet/receive \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"amount": 100}'
```

---

## Response Codes Summary

```
✅ Success: 200, 201
❌ Client Error: 400, 401, 404
⚠️ Server Error: 500
```

All error responses include `error` field with message.

---

## Future API Enhancements

- [ ] Webhook for transfer notifications
- [ ] File export (CSV, JSON)
- [ ] Batch operations
- [ ] Rate limiting
- [ ] API key authentication for third-party integrations
- [ ] GraphQL API alternative
- [ ] WebSocket for real-time updates
