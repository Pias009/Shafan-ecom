# API & Service Credentials Required

## 1. Google Login / OAuth

To enable "Login with Google" feature on the website.

**Required Credentials:**
| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Google Cloud Console |

**Setup Steps:**
1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Set Authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (for production: `https://yourdomain.com/api/auth/callback/google`)
4. Copy credentials to `.env` file

---

## 2. Google Reviews API (Optional)

To fetch real Google Reviews instead of mock data.

**Required Credentials:**
| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `GOOGLE_PLACES_API_KEY` | Google Places API Key | Google Cloud Console |
| `GOOGLE_PLACE_ID` | Your Business Profile ID | Google Business Profile |

**Setup Steps:**
1. Enable "Places API" in Google Cloud Console
2. Create API Key credential
3. Find your Place ID: https://developers.google.com/maps/documentation/places/web-service/place-id

---

## 3. Email Service (Optional)

For sending order confirmations, password reset emails, etc.

**Optional Variables:**
| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL_ENABLED` | Enable email (true/false) | true |
| `RESEND_API_KEY` | Resend API Key | re_xxxxx |
| `RESEND_FROM_EMAIL` | Sender email address | noreply@shafa.com |

---

## Quick Setup - Add to .env

```
# Google Login (Required for Google OAuth)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# Google Reviews (Optional)
GOOGLE_PLACES_API_KEY=your_places_api_key
GOOGLE_PLACE_ID=ChIJK5UNamc5XzYR7eZ特殊性8jD-k

# Email Service (Optional)
EMAIL_ENABLED=true
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@shafa.com
```

---

## Status

| Feature | Status | Action Needed |
|---------|--------|----------------|
| Email/Password Login | ✅ Working | None |
| Google Login | ⚠️ Button shows | Add GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET |
| Google Reviews | ⚠️ Mock data | Add GOOGLE_PLACES_API_KEY |
| Email Notifications | ⚠️ Disabled | Add Resend API key |

---

**Contact your developer to add these credentials to the server.**