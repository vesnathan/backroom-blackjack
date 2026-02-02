# Backroom Blackjack - Launch Test Plan

## 1. Core Game Mechanics

- [ ] Card dealing (all 52 cards per deck, no duplicates within shoe)
- [ ] Hand value calculations (hard/soft totals)
- [ ] Blackjack detection (A + 10-value card)
- [ ] Bust detection (over 21)
- [ ] Split hands (pair splitting, resplits if enabled)
- [ ] Double down functionality
- [ ] Insurance betting (when dealer shows Ace)
- [ ] Surrender option (if enabled)
- [ ] Correct chip payout/deduction for wins/losses

## 2. AI Player Behavior

- [ ] AI follows basic strategy (with skill level variation)
- [ ] AI blackjack skips turn entirely (no stand action shown)
- [ ] AI blackjack shows correct dialogue ("BLACKJACK!" not "21!")
- [ ] AI split hands work properly
- [ ] AI dialogue triggers appropriately (hand totals, reactions)
- [ ] AI decision timing varies by playSpeed

## 3. Dealer Behavior

- [ ] Dealer hits on soft 17 (if setting enabled)
- [ ] Dealer stands on hard 17+
- [ ] Dealer blackjack check works (with hole card peek)
- [ ] Dealer speech bubbles display correctly
- [ ] Dealer payouts correct for blackjack (3:2 or 6:5)

## 4. Betting System

- [ ] Min/max bets enforced
- [ ] Cannot bet more chips than available
- [ ] Correct payouts (3:2 or 6:5 for blackjack)
- [ ] Double down doubles bet correctly
- [ ] Split creates second bet correctly
- [ ] Insurance costs half the bet
- [ ] Chip persistence for authenticated users

## 5. Card Counting Features

- [ ] Running count accuracy (Hi-Lo system)
- [ ] True count calculation (running count / decks remaining)
- [ ] "Show Count" button works (displays count to player)
- [ ] Score multiplier resets when using Show Count
- [ ] Suspicion meter increases with bet variance
- [ ] Betting hints display (for subscribers)

## 6. UI/UX

- [ ] Split hands display correctly (Hand 1 on right, Hand 2 on left)
- [ ] Split hands modal "Expand" button works
- [ ] Speech bubbles white for non-conversational messages
- [ ] Speech bubbles tinted for active conversations
- [ ] Menu click-away closes the menu
- [ ] Guest menu items limited (Leaderboard, Supporters, Learn Counting, Login)
- [ ] Authenticated menu shows all items
- [ ] Win/loss bubbles display with correct amounts
- [ ] Card animations smooth

## 7. Authentication

- [ ] Login flow works (email/password)
- [ ] Register flow works (with email verification)
- [ ] Password reset flow works
- [ ] Session persistence (stays logged in)
- [ ] Profile creation on first login
- [ ] Username selection

## 8. Subscription Features

- [ ] Tier features locked appropriately (Free vs Gold vs Platinum)
- [ ] Checkout flow works (Stripe)
- [ ] Feature access updates after subscription
- [ ] Betting hints require appropriate tier
- [ ] Advanced analytics require Gold+
- [ ] Chip stipend for Platinum subscribers

## 9. Leaderboard

- [ ] Leaderboard displays top players
- [ ] Score calculation correct
- [ ] Streak tracking accurate
- [ ] Current player highlighted on leaderboard
- [ ] Profile links work from leaderboard

## 10. Mobile/Responsive

- [ ] Game playable on mobile viewport
- [ ] Touch targets large enough for mobile
- [ ] Modals fit on screen
- [ ] Menu accessible on mobile

## 11. Sound/Audio

- [ ] Background music plays (if enabled)
- [ ] Volume controls work
- [ ] Mute toggle works

## 12. Edge Cases

- [ ] Shoe runs out mid-hand (reshuffle)
- [ ] Multiple blackjacks in same round
- [ ] Player and dealer both blackjack (push)
- [ ] Multiple splits in same hand (if resplit enabled)
- [ ] Insurance win/loss when dealer has/doesn't have blackjack
- [ ] Network disconnect recovery

---

## Test Environment

- **Browser:** Chrome, Firefox, Safari, Edge
- **Devices:** Desktop (1920x1080+), Tablet (iPad), Mobile (iPhone, Android)
- **User States:** Guest, Authenticated Free, Gold Subscriber, Platinum Subscriber, Admin

## Pre-Launch Checklist

- [ ] All critical tests passing
- [ ] No console errors in production build
- [ ] Performance acceptable (< 3s load time)
- [ ] SSL certificate valid
- [ ] Analytics tracking working
- [ ] Error logging working
