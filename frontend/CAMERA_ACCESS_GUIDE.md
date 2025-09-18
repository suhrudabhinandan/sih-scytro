# Camera Access Solutions for Development

Your scanner app needs camera access, but browsers block camera access on HTTP (non-HTTPS) sites. Here are 3 solutions:

## Option 1: HTTPS Development Server (Recommended)

1. **Start the HTTPS server:**
   ```bash
   npm run dev:https
   ```

2. **Access the application:**
   - Open: https://localhost:3000
   - Browser will show "Not Secure" warning
   - Click "Advanced" → "Proceed to localhost (unsafe)"
   - Grant camera permissions when prompted

## Option 2: Chrome with Disabled Security (Quick & Easy)

1. **Close all Chrome windows first**
2. **Double-click:** `start-chrome-insecure.bat`
3. **Access:** http://localhost:3000
4. **Start regular dev server:** `npm run dev`

⚠️ **WARNING:** Only use this Chrome instance for development. Don't browse other sites with it.

## Option 3: Enable Localhost Exception in Chrome

1. **Open Chrome and go to:** chrome://flags/#unsafely-treat-insecure-origin-as-secure
2. **Add:** `http://localhost:3000`
3. **Restart Chrome**
4. **Access:** http://localhost:3000 with regular `npm run dev`

## Troubleshooting

- **Permission denied:** Make sure to allow camera access in browser
- **No camera found:** Check if camera is being used by another app
- **Still not working:** Try restarting browser or computer

## For Production

Always use proper SSL certificates from a certificate authority (Let's Encrypt, etc.) - never use self-signed certificates in production.