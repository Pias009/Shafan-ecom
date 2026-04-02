# Admin Panel Configuration Guide

## Overview
Below are the settings you need to configure from your admin panel to customize your website.

---

## 1. Contact Information
**Page:** `/ueadmin/settings/contact`

Configure the contact details displayed on your website's contact page:

| Field | Description | Example |
|-------|-------------|---------|
| Phone Number | Your business phone | +971 4 123 4567 |
| Email Address | Customer support email | info@shafa.com |
| Address | Business location | Dubai, United Arab Emirates |
| WhatsApp | WhatsApp contact number | +971501234567 |
| Working Hours | Operating hours | Sun-Thu: 9AM - 6PM |

**Website Page:** `/contact`

---

## 2. Footer - Partnership & Supplier Option
**Location:** Footer → About Section

Add a "Partnership & Supplier" link to the footer About section:

- Title: "Partnership & Supplier" (or "Partnership" / "Become a Supplier")
- Link: Create a page or use `/contact?subject=partnership`

This will appear in the footer under the "About" section alongside:
- About Us
- Bloggers

---

## 3. Hero Banner
**Note:** Hero banner requires developer assistance to update as it's part of the theme design. Contact your developer to modify hero content.

---

## 4. Google Reviews Integration
**Status:** Setup guide available

To fetch real Google Reviews on your website:
- See attached guide: `google-reviews-setup-client.md`
- Requires Google Cloud API credentials

**Current Status:** Working with placeholder reviews

---

## 5. Country Delivery Settings
**Status:** Already configured ✅

| Country | Min Order | Delivery Fee | Free Delivery Above |
|---------|-----------|--------------|---------------------|
| UAE | 80 AED | 15 AED | 150 AED |
| Kuwait | 12 KWD | 1.5 KWD | 18 KWD |
| Saudi Arabia | 159 SAR | 19 SAR | 359 SAR |
| Bahrain | 13 BHD | 1.99 BHD | 18 BHD |
| Oman | 16 OMR | 1.9 OMR | 22 OMR |
| Qatar | 129 QAR | 19 QAR | 299 QAR |

---

## 6. Payment Methods
**Status:** Already enabled ✅

Available on checkout:
- Credit Card (Visa, Mastercard, Link Pay)
- Cash on Delivery

---

## Next Steps

1. ✅ Configure Contact Information
2. ⬜ Add Partnership & Supplier to footer (need your link/page)
3. ⬜ Consider Google Reviews API setup
4. ⬜ Hero banner update (developer needed)

---

**Need Help?**
Contact your developer for any questions.