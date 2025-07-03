# Hati Real Data Implementation TODO

## Overview: Fetch Real Data from Database & Circle API

### Current State Analysis ✅

- [x] Database schema ready (MerchantProfile, MerchantSession, MerchantTransaction)
- [x] Circle wallet creation API implemented (`/api/circle/wallet`)
- [x] Circle wallet balance fetching capability exists
- [x] Hook `useCircleWallet` for React integration
- [x] Overview page partially using real data from API (`/api/hati/stats`)

### Missing Components ❌

#### 1. Enhanced Circle API Integration

- [ ] Improve Circle balance fetching to include token-specific balances
- [ ] Add support for multiple token types on Linea
- [ ] Handle Circle API rate limiting and errors gracefully
- [ ] Add real-time balance updates

#### 2. Wallet Page Real Data Implementation

- [ ] Replace mock data in `/src/app/merchant/wallet/page.tsx`
- [ ] Fetch merchant profile from database using session token
- [ ] Get real Circle wallet balance (USDC + ETH on Linea)
- [ ] Show actual transaction history from database

#### 3. Overview Page Enhancements

- [ ] Complete real transaction history display
- [ ] Implement proper error handling for API failures
- [ ] Add loading states for balance fetching

#### 4. Transaction Statistics Service

- [ ] Create service to aggregate transaction data from database
- [ ] Calculate real growth metrics (month-over-month)
- [ ] Compute actual success rates
- [ ] Track real settlement times from bridge data

## Implementation Priority

### Phase 1: Core Data Fetching (High Priority)

1. **Enhance Circle Integration**

   - File: `src/lib/services/circleWalletService.ts`
   - Improve existing balance fetching
   - Add token-specific queries

2. **Update Wallet Page**
   - File: `src/app/merchant/wallet/page.tsx`
   - Replace all mock data with real API calls
   - Add proper error handling

### Phase 2: Statistics and Analytics (Medium Priority)

3. **Transaction Stats Service**

   - File: `src/lib/services/transactionStatsService.ts`
   - Database aggregation queries
   - Real-time metrics calculation

4. **Enhanced Overview Page**
   - Complete real data integration
   - Add loading states and error handling

## Technical Notes

### API Endpoints to Create/Enhance

- [ ] `GET /api/merchant/balance` - Combined balance from all sources
- [ ] `GET /api/merchant/transactions` - Paginated transaction history
- [ ] `GET /api/merchant/stats` - Enhanced with real calculations
- [ ] `POST /api/merchant/refresh-balance` - Force balance refresh

## Success Criteria

- [ ] Overview page shows 100% real data (no mock data)
- [ ] Wallet page displays actual Circle
- [ ] Transaction history shows real database records
- [ ] Error handling for API failures
- [ ] Loading states for all async operations
- [ ] Performance optimization (caching, rate limiting)

## Notes

- Current overview page already partially implemented with real API calls
- Circle wallet integration is mostly complete
- Database schema supports all required data storage
