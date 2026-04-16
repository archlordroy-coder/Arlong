# 💬 WhatsApp Integration Guide

## Approaches
Mboa Drive supports two ways of using WhatsApp:

1. **Individual (wwebjs-electron):**
   - Connect via QR Code.
   - Uses WhatsApp Web internally.
   - **Risk:** Potential ban if used for excessive spam. Use with caution.

2. **Professional (Meta Cloud API):**
   - Requires a Meta Business Account.
   - Uses official APIs.
   - **Requirement:** `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_ID` env variables.

## Bulk Sending Policy
To avoid bans:
- Minimum delay of 3 seconds between messages.
- Maximum 100 messages per day for individual accounts.
