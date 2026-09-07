// Lightweight voice-to-invoice parser.
// Takes a raw speech transcript + the shop's product list, and extracts:
//   - a customer name (if mentioned)
//   - a list of { product, name, quantity, price } items matched against real inventory
//
// Designed for Hinglish-friendly natural phrasing, e.g.:
//   "bill for Ramesh, two packets of Parle-G, one liter milk, three soap"
//   "customer Suresh three sugar one rice five biscuit"

const WORD_TO_NUM = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20,
  a: 1, an: 1, single: 1, couple: 2, dozen: 12,
};

// Words that commonly appear around quantities/units but aren't part of a product name
const NOISE_WORDS = [
  "of", "packet", "packets", "pack", "packs", "piece", "pieces", "pcs",
  "bottle", "bottles", "liter", "liters", "litre", "litres", "kg", "kgs",
  "gram", "grams", "box", "boxes", "and", "plus", "also", "please",
  "add", "the", "a", "an",
];

const numberFromWord = (word) => {
  const clean = word.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (/^\d+$/.test(clean)) return parseInt(clean, 10);
  if (WORD_TO_NUM[clean] !== undefined) return WORD_TO_NUM[clean];
  return null;
};

// Extracts "for <name>" / "customer <name>" / "bill of <name>" style mentions
const extractCustomerName = (transcript) => {
  const patterns = [
    /(?:bill|invoice)\s+for\s+([a-zA-Z\s]+?)(?:,|\.|$| \d| one| two| three| four| five)/i,
    /customer\s+(?:name\s+)?(?:is\s+)?([a-zA-Z\s]+?)(?:,|\.|$| \d| one| two| three| four| five)/i,
    /\bfor\s+([a-zA-Z]+(?:\s[a-zA-Z]+)?)\s*,/i,
  ];
  for (const pattern of patterns) {
    const match = transcript.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      if (name.length > 1 && name.split(" ").length <= 3) {
        return name.replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }
  }
  return null;
};

// Fuzzy-match a chunk of words against the product catalogue.
// Returns the best-matching product, or null if nothing scores well.
const matchProduct = (words, products) => {
  const chunkText = words.join(" ").toLowerCase();
  let best = null;
  let bestScore = 0;

  for (const product of products) {
    const productWords = product.name.toLowerCase().split(/\s+/);
    let score = 0;

    // Direct substring match is a strong signal
    if (chunkText.includes(product.name.toLowerCase())) {
      score += 5;
    }

    // Count overlapping significant words
    productWords.forEach((pw) => {
      if (pw.length > 2 && chunkText.includes(pw)) score += 1;
    });

    if (score > bestScore) {
      bestScore = score;
      best = product;
    }
  }

  return bestScore > 0 ? best : null;
};

/**
 * Main entry point.
 * @param {string} transcript - raw text from speech recognition
 * @param {Array} products - the shop's product list (from /api/products)
 * @returns {{ customerName: string|null, items: Array, unmatched: Array }}
 */
export const parseVoiceInvoice = (transcript, products) => {
  if (!transcript || !products?.length) {
    return { customerName: null, items: [], unmatched: [] };
  }

  const customerName = extractCustomerName(transcript);

  // Strip the customer-name portion out so it doesn't get parsed as a product
  let cleanedTranscript = transcript;
  if (customerName) {
    cleanedTranscript = cleanedTranscript.replace(
      new RegExp(`(bill|invoice)?\\s*for\\s+${customerName}|customer\\s+(name\\s+)?(is\\s+)?${customerName}`, "i"),
      ""
    );
  }

  // Split into rough segments by commas / "and"
  const segments = cleanedTranscript
    .split(/,|\band\b/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const items = [];
  const unmatched = [];

  segments.forEach((segment) => {
    const words = segment.split(/\s+/).filter(Boolean);
    if (words.length === 0) return;

    // Find a quantity anywhere in the segment (default to 1 if none found)
    let quantity = 1;
    let quantityFound = false;
    const remainingWords = [];

    words.forEach((word) => {
      const num = numberFromWord(word);
      if (num !== null && !quantityFound) {
        quantity = num;
        quantityFound = true;
      } else if (!NOISE_WORDS.includes(word.toLowerCase())) {
        remainingWords.push(word);
      }
    });

    if (remainingWords.length === 0) return;

    const product = matchProduct(remainingWords, products);
    if (product) {
      items.push({
        product: product._id,
        name: product.name,
        price: product.sellingPrice,
        quantity,
        maxStock: product.stockQuantity,
        unit: product.unit,
      });
    } else {
      unmatched.push(segment);
    }
  });

  return { customerName, items, unmatched };
};

export const isSpeechRecognitionSupported = () => {
  return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
};
