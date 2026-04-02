# Google Reviews Integration - Setup Guide

## Current Status

We have implemented the Google Reviews section on your website homepage. Currently, it's showing sample reviews for demonstration. To fetch real reviews from your Google Business Profile, you need to complete the setup below.

---

## What's Already Done ✓

- ✅ Google Reviews slider added to homepage
- ✅ Professional review display UI
- ✅ Link to your Google Business page for writing reviews
- ✅ API endpoint ready for real data

---

## What's Needed to Go Live

### Step 1: Get Google API Credentials

1. **Go to Google Cloud Console**
   - URL: https://console.cloud.google.com/
   - Create a new project or select existing

2. **Enable Required APIs**
   - Search and enable "Places API"
   - Search and enable "Business Profile API"

3. **Create API Key**
   - Go to "Credentials" section
   - Click "Create Credentials" → "API Key"
   - Copy the generated key

4. **Get Your Place ID**
   - Visit: https://developers.google.com/maps/documentation/places/web-service/place-id
   - Search for "Shanfa Global" or your business name
   - Copy the Place ID (starts with "ChI...")

### Step 2: Add to Your Environment File

Open your `.env` file and add:

```
GOOGLE_PLACES_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_PLACE_ID=ChIJK5UNamc5XzYR7eZ特殊性8jD-k
```

### Step 3: Contact Developer

Once you have the API key and Place ID, contact your developer to add them to the server. They will update the `.env` file and the real Google Reviews will appear on your website.

---

## Cost Information

- **Places API**: Free tier available (up to 100,000 requests/month)
- **Business Profile API**: Free for basic usage

For pricing details: https://cloud.google.com/maps-platform/pricing

---

## Support

If you need help obtaining the API credentials, contact:
- Google Cloud Support: https://cloud.google.com/support

---

**Note**: While waiting for API setup, the website displays professional mock reviews so your customers can see the review section is working.