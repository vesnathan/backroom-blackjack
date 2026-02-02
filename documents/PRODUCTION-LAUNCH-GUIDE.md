# Backroom Blackjack - Production Launch Guide

This guide walks you through everything needed to launch the site in production.

---

## Prerequisites

Before deploying, you'll need accounts and credentials from:
- **Stripe** (payments)
- **Google reCAPTCHA** (spam protection)
- **AWS** (already configured)

---

## Step 1: Stripe Setup

### 1.1 Create Stripe Account
If you don't have one: https://dashboard.stripe.com/register

### 1.2 Create Subscription Products

In Stripe Dashboard > Products, create 4 subscription products:

| Product Name | Price | Billing |
|--------------|-------|---------|
| Bronze | $3.00 | Monthly |
| Silver | $5.00 | Monthly |
| Gold | $10.00 | Monthly |
| Platinum | $20.00 | Monthly |

### 1.3 Get Price IDs

After creating each product, click on it and copy the **Price ID** (format: `price_1Abc123...`).

You'll need all 4 Price IDs:
- [ ] Bronze Price ID: `price_1StNf2DPwxruY7KoW3pH2rj7`
- [ ] Silver Price ID: `price_1StNgfDPwxruY7KodJ1L5CC0`
- [ ] Gold Price ID: `price_1StNi1DPwxruY7KoWwglObOZ`
- [ ] Platinum Price ID: `price_1StNjADPwxruY7Koa3ibE37F`

### 1.4 Get API Keys

Go to Developers > API Keys:
- [ ] Secret Key: `sk_live_________________` (or `sk_test_` for testing)
- [ ] Publishable Key: `pk_live_________________` (or `pk_test_` for testing)

### 1.5 Create Webhook Endpoint

Go to Developers > Webhooks > Add endpoint:

- **Endpoint URL**: You'll get this after deployment (Step 3)
  - Format: `https://{api-id}.execute-api.ap-southeast-2.amazonaws.com/prod/webhooks/stripe`
  - The exact URL will be shown in CloudFormation outputs as `StripeWebhookUrl`

- **Events to listen for**:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`

After creating, copy the **Signing Secret**:
- [ ] Webhook Secret: `whsec_________________`

> **Note**: You can create the webhook endpoint now with a placeholder URL, then update it after deployment. Or wait until after Step 3 to create it.

---

## Step 2: Google reCAPTCHA Setup

### 2.1 Create reCAPTCHA Site

Go to: https://www.google.com/recaptcha/admin/create

- **Label**: Backroom Blackjack
- **reCAPTCHA type**: reCAPTCHA v3
- **Domains**:
  - `backroom-blackjack.com`
  - `www.backroom-blackjack.com`
  - `localhost` (for local testing)

### 2.2 Get Keys

After creating:
- [ ] Site Key: `6LcEt1UsAAAAAKCAhykMNujLOE4JJFp9-H8FUmsE`
- [ ] Secret Key: `6LcEt1UsAAAAAOhlHXGR8h-BEidLozvj1lQy6XMS`

---

## Step 3: Deploy Backend Infrastructure

### 3.1 Run Deployment

```bash
cd /home/liqk1ugzoezh5okwywlr_/dev/card-counting-trainer
yarn deploy --stage prod
```

This will:
- Deploy all CloudFormation stacks
- Create Cognito, DynamoDB, AppSync, Lambda, S3, CloudFront
- Create Secrets Manager secrets (with placeholder values)
- Build and upload frontend
- Invalidate CloudFront cache

**Wait for deployment to complete** (10-20 minutes)

### 3.2 Note the Outputs

The deployment will show:
- CloudFront URL
- API URL
- User Pool ID
- **Stripe Webhook URL** (important!)

To get the Stripe Webhook URL after deployment:
```bash
source /home/liqk1ugzoezh5okwywlr_/dev/card-counting-trainer/scripts/claude-aws-env.sh

aws cloudformation describe-stacks \
  --stack-name backroom-blackjack-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`StripeWebhookUrl`].OutputValue' \
  --output text \
  --region ap-southeast-2
```

**Copy this URL and update your Stripe webhook endpoint** (Step 1.5)

---

## Step 4: Configure Secrets Manager

After deployment, update the secrets with real values.

### 4.1 Update Stripe Secrets

```bash
# Source AWS credentials
source /home/liqk1ugzoezh5okwywlr_/dev/card-counting-trainer/scripts/claude-aws-env.sh

# Update Stripe secrets
aws secretsmanager put-secret-value \
  --secret-id backroom-blackjack-stripe-secrets-prod \
  --secret-string '{
    "secretKey": "sk_live_YOUR_SECRET_KEY",
    "webhookSecret": "whsec_YOUR_WEBHOOK_SECRET",
    "priceIdBronze": "price_YOUR_BRONZE_PRICE_ID",
    "priceIdSilver": "price_YOUR_SILVER_PRICE_ID",
    "priceIdGold": "price_YOUR_GOLD_PRICE_ID",
    "priceIdPlatinum": "price_YOUR_PLATINUM_PRICE_ID"
  }' \
  --region ap-southeast-2
```

### 4.2 Update reCAPTCHA Secret

```bash
aws secretsmanager put-secret-value \
  --secret-id backroom-blackjack-recaptcha-secrets-prod \
  --secret-string '{
    "secretKey": "YOUR_RECAPTCHA_SECRET_KEY"
  }' \
  --region ap-southeast-2
```

---

## Step 5: Frontend Environment (Automatic)

The deploy script now **automatically handles** all frontend configuration:

- ✅ Generates `.env.local` with all required keys (Cognito, GraphQL, Stripe, reCAPTCHA)
- ✅ Rebuilds frontend with latest code
- ✅ Uploads to S3
- ✅ Invalidates CloudFront cache

**No manual steps required** - just run `yarn deploy --stage prod` and the frontend is fully deployed.

### Generated Environment Variables

The deploy script creates `frontend/.env.local` with:
```bash
NEXT_PUBLIC_USER_POOL_ID=ap-southeast-2_xxxxx
NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxx
NEXT_PUBLIC_GRAPHQL_URL=https://xxxxx.appsync-api.ap-southeast-2.amazonaws.com/graphql
NEXT_PUBLIC_ENVIRONMENT=prod
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx  # Auto-set for prod
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lc_xxxxx          # Auto-set for prod
NEXT_PUBLIC_APP_URL=https://backroom-blackjack.com
```

---

## Step 6: Update Stripe Webhook URL (if needed)

If your webhook needs to go through API Gateway instead of CloudFront:

1. Get the API Gateway URL from CloudFormation outputs
2. Go to Stripe Dashboard > Webhooks
3. Update the endpoint URL

---

## Step 7: Verification Checklist

### 7.1 Basic Site Access
- [ ] Site loads at https://backroom-blackjack.com
- [ ] Site loads at https://www.backroom-blackjack.com (redirects)

### 7.2 Authentication
- [ ] Can register new account
- [ ] Can log in
- [ ] Can log out
- [ ] Password reset works

### 7.3 Game Functionality
- [ ] Game loads and plays
- [ ] Cards deal correctly
- [ ] Betting works
- [ ] Split/double down work

### 7.4 Subscriptions (Stripe)
- [ ] Subscribe page loads
- [ ] Can click "Subscribe" on a tier
- [ ] Redirects to Stripe Checkout
- [ ] After payment, user tier updates in app
- [ ] Webhook logs appear in DynamoDB (WEBHOOK_LOG)

### 7.5 Invite Feature
- [ ] "Invite a Friend" button appears (logged in users)
- [ ] Can enter friend's name and email
- [ ] reCAPTCHA doesn't block submission
- [ ] Email is received by friend
- [ ] Social share buttons work

### 7.6 Leaderboard
- [ ] Leaderboard loads
- [ ] Shows correct data

---

## Troubleshooting

### Stripe webhook not working
1. Check webhook signing secret is correct
2. Verify webhook URL is accessible
3. Check CloudWatch logs for `backroom-blackjack-stripewebhook-prod`

### reCAPTCHA failing
1. Verify domain is added in reCAPTCHA console
2. Check site key matches in `.env.local`
3. Check secret key in Secrets Manager

### Emails not sending
1. Verify SES domain is verified (already done)
2. Check CloudWatch logs for `backroom-blackjack-sendinvite-prod`
3. Verify FROM email matches SES verified identity

### Frontend not updating
1. Clear CloudFront cache: `aws cloudfront create-invalidation ...`
2. Clear browser cache
3. Check S3 bucket has latest files

---

## Quick Reference: All Secrets

| Secret | Location | Format |
|--------|----------|--------|
| Stripe Secret Key | Secrets Manager | `sk_live_xxx` |
| Stripe Webhook Secret | Secrets Manager | `whsec_xxx` |
| Stripe Price IDs (4) | Secrets Manager | `price_xxx` |
| reCAPTCHA Secret | Secrets Manager | `6Lc_xxx` |
| reCAPTCHA Site Key | `.env.local` | `6Lc_xxx` |
| Stripe Publishable Key | `.env.local` | `pk_live_xxx` |

---

## Support

If you encounter issues:
1. Check CloudWatch Logs in AWS Console
2. Check browser developer console for errors
3. Verify all secrets are correctly configured
