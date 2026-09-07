# AI Artisan Copilot — Setup Notes

## 1. Existing project setup remains unchanged

Use the original project commands:

```bash
cd backend
npm install
npm run dev
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

MongoDB Atlas/local MongoDB configuration remains the same.

## 2. Optional OpenRouter AI

The feature is intentionally runnable without an AI key.

For actual photo understanding + LLM catalog generation:

```env
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=google/gemini-2.5-flash
```

Put these in `backend/.env`.

Never commit the real API key to GitHub.

## 3. Demo mode

If `OPENROUTER_API_KEY` is empty, the page still demonstrates:
- photo upload and preview
- multilingual browser voice input
- structured catalog generation from artisan text
- pricing calculation
- market segment recommendations
- buyer compatibility scoring
- persistent catalog/profile storage in MongoDB

The UI clearly tells the presenter when it is using demo intelligence.

## 4. SIH demo sequence

1. Register/login.
2. Open **AI Artisan Copilot**.
3. Save an artisan profile:
   - Craft: Pottery
   - Location: Uttar Pradesh
   - Capacity: 500/month
4. Upload a pottery/diya image.
5. Speak: "Yeh haath se bani mitti ki diya hai, ise banane mein do din lage."
6. Generate the catalog.
7. Open Smart Pricing and enter material + labour cost.
8. Open Market Linkage and analyze target segments.
9. Open Buyer Match and test:
   - Quantity: 300
   - Budget: ₹500
   - Delivery: 30 days
10. Explain that the matching score is decision support and can later be trained on real buyer/order outcomes.

## 5. Architecture

```text
React / Vite
   |
   | JWT
   v
Express / Node
   |
   +--> Existing modules
   |    Billing / Inventory / Khata / Expenses / Reports
   |
   +--> AI Artisan Copilot
        |
        +--> Catalog generation
        |      +--> OpenRouter Vision + LLM (optional)
        |      +--> Demo fallback
        |
        +--> Pricing engine
        +--> Market linkage engine
        +--> Buyer matching engine
        |
        v
      MongoDB
        +--> ArtisanCatalog
        +--> ArtisanProfile
```

## 6. Important limitation

The market and pricing features do not pretend to have live marketplace data. For the production version, connect verified marketplace feeds, buyer enquiry history, festival calendars, logistics costs and actual conversion data. The matching engine can then be trained/evaluated using real outcomes.
