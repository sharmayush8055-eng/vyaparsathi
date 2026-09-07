import ArtisanCatalog from "../models/ArtisanCatalog.js";
import ArtisanProfile from "../models/ArtisanProfile.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const getAIConfig = () => ({
  key: process.env.OPENROUTER_API_KEY,
  model: process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash",
});

const extractJSON = (content) => {
  if (!content) throw new Error("AI returned an empty response");
  const text = typeof content === "string"
    ? content
    : content.map((part) => part?.text || "").join("");

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : text.trim();
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("AI response was not valid JSON");
  return JSON.parse(candidate.slice(first, last + 1));
};

const callOpenRouter = async ({ system, user, imageData }) => {
  const { key, model } = getAIConfig();
  if (!key) return null;

  const content = [];
  if (imageData) {
    if (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(imageData)) {
      throw new Error("Unsupported image format. Use JPG, PNG or WEBP.");
    }
    if (imageData.length > 6 * 1024 * 1024) {
      throw new Error("Image is too large. Please use an image below about 4.5 MB.");
    }
    content.push({
      type: "image_url",
      image_url: { url: imageData },
    });
  }
  content.push({ type: "text", text: user });

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:5173",
      "X-Title": "VyaparSathi AI Artisan Copilot",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content },
      ],
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`AI provider error (${response.status}): ${message.slice(0, 300)}`);
  }

  const data = await response.json();
  return extractJSON(data?.choices?.[0]?.message?.content);
};

const demoCatalog = ({ voiceText = "", language = "English" }) => {
  const text = voiceText.trim();
  const lower = text.toLowerCase();

  const rules = [
    { words: ["madhubani", "painting"], productName: "Handmade Madhubani Painting", category: "Traditional Art", material: "Natural colours and handmade paper", craft: "Madhubani Painting" },
    { words: ["banarasi", "silk", "dupatta"], productName: "Handwoven Banarasi Silk Dupatta", category: "Traditional Textile", material: "Silk", craft: "Handloom Weaving" },
    { words: ["pottery", "clay", "matka", "diya"], productName: "Handmade Terracotta Pottery", category: "Pottery & Home Decor", material: "Natural clay", craft: "Pottery" },
    { words: ["basket", "bamboo"], productName: "Handwoven Bamboo Basket", category: "Bamboo Craft", material: "Bamboo", craft: "Bamboo Weaving" },
    { words: ["wood", "wooden", "carving"], productName: "Handcrafted Wooden Decor", category: "Wood Craft", material: "Wood", craft: "Wood Carving" },
  ];

  const match = rules.find((r) => r.words.some((w) => lower.includes(w))) || {
    productName: "Handcrafted Artisan Product",
    category: "Handmade Craft",
    material: "Natural / artisan-sourced materials",
    craft: "Traditional Handicraft",
  };

  const name = match.productName || "Handcrafted Artisan Product";
  const story = language.toLowerCase().startsWith("hindi")
    ? "यह हस्तनिर्मित वस्तु स्थानीय कारीगर की पारंपरिक कला और कौशल को दर्शाती है। हर टुकड़ा हाथ से तैयार किया गया है, इसलिए इसमें व्यक्तिगत और सांस्कृतिक पहचान है।"
    : "This handmade piece reflects the artisan's traditional skill and local craft heritage. Each piece is finished by hand, giving it an individual character and cultural identity.";

  return {
    productName: name,
    category: match.category,
    material: match.material,
    craft: match.craft,
    productionTime: "Custom / artisan supplied",
    description: text
      ? `A handcrafted ${match.category.toLowerCase()} made by an artisan. ${text}`
      : `A handcrafted ${match.category.toLowerCase()} made using traditional artisan techniques.`,
    culturalStory: story,
    tags: ["Handmade", "IndianCraft", "ArtisanMade", "TraditionalCraft", match.craft.replace(/\s+/g, "")],
    language,
    imageAnalyzed: false,
    aiMode: "demo",
  };
};

export const generateCatalog = async (req, res) => {
  try {
    const { voiceText = "", language = "English", imageData = "" } = req.body;

    if (!voiceText.trim() && !imageData) {
      return res.status(400).json({ message: "Add a product photo or describe the product by voice/text." });
    }

    let result = null;
    let aiMode = "demo";

    if (getAIConfig().key) {
      try {
        result = await callOpenRouter({
          system: `You are an AI cataloging assistant for marginalized Indian artisans. Analyze the product photo and/or artisan description. Return ONLY valid JSON. Never invent exact material, dimensions, certification, origin, or price when not provided. Use cautious wording. The JSON keys must be: productName, category, material, craft, productionTime, description, culturalStory, tags, language, imageAnalyzed. tags must be an array of 4-8 short strings.`,
          user: `Create a professional marketplace-ready product catalog in ${language}. Artisan description: ${voiceText || "Not provided"}. If a photo is supplied, use visible evidence from it. Keep culturalStory respectful and avoid claiming a specific community or heritage unless the description supports it.`,
          imageData,
        });
        aiMode = "openrouter";
      } catch (aiError) {
        console.warn("OpenRouter catalog generation failed; using safe demo fallback:", aiError.message);
      }
    }

    if (!result) result = demoCatalog({ voiceText, language });

    result.language = language;
    result.imageAnalyzed = Boolean(imageData);
    result.aiMode = aiMode;

    const catalog = await ArtisanCatalog.create({
      ...result,
      owner: req.user._id,
      sourceText: voiceText,
    });

    res.status(201).json({
      catalog,
      mode: aiMode,
      message: aiMode === "openrouter"
        ? "AI catalog generated successfully."
        : "Catalog generated in demo intelligence mode. Add OPENROUTER_API_KEY for vision + LLM analysis.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCatalogs = async (req, res) => {
  try {
    const catalogs = await ArtisanCatalog.find({ owner: req.user._id }).sort({ createdAt: -1 }).limit(30);
    res.json(catalogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCatalog = async (req, res) => {
  try {
    const catalog = await ArtisanCatalog.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!catalog) return res.status(404).json({ message: "Catalog not found" });
    res.json({ message: "Catalog removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const profile = await ArtisanProfile.findOne({ owner: req.user._id });
    res.json(profile || { craft: "", location: "", productionCapacity: 0, priceMin: 0, priceMax: 0, languages: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const saveProfile = async (req, res) => {
  try {
    const { craft = "", location = "", productionCapacity = 0, priceMin = 0, priceMax = 0, languages = [] } = req.body;
    const profile = await ArtisanProfile.findOneAndUpdate(
      { owner: req.user._id },
      {
        owner: req.user._id,
        craft: String(craft),
        location: String(location),
        productionCapacity: Number(productionCapacity) || 0,
        priceMin: Number(priceMin) || 0,
        priceMax: Number(priceMax) || 0,
        languages: Array.isArray(languages) ? languages : [],
      },
      { upsert: true, new: true, runValidators: true }
    );
    res.json(profile);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getPricing = async (req, res) => {
  try {
    const {
      materialCost = 0,
      laborCost = 0,
      productionHours = 0,
      observedMin = 0,
      observedMax = 0,
      demand = "medium",
    } = req.body;

    const material = Math.max(0, Number(materialCost) || 0);
    const labor = Math.max(0, Number(laborCost) || 0);
    const hours = Math.max(0, Number(productionHours) || 0);
    const baseCost = material + labor;
    const demandMultiplier = { low: 1.15, medium: 1.3, high: 1.5 }[demand] || 1.3;

    let recommended = baseCost > 0 ? baseCost * demandMultiplier : 0;
    const marketMin = Number(observedMin) || 0;
    const marketMax = Number(observedMax) || 0;

    if (marketMin > 0 && marketMax >= marketMin) {
      recommended = Math.min(Math.max(recommended, marketMin), marketMax);
    }

    recommended = Math.round(recommended / 10) * 10;
    const suggestedMin = Math.round((recommended * 0.9) / 10) * 10;
    const suggestedMax = Math.round((recommended * 1.1) / 10) * 10;

    res.json({
      materialCost: material,
      laborCost: labor,
      productionHours: hours,
      baseCost,
      demand,
      recommendedPrice: recommended,
      suggestedRange: { min: suggestedMin, max: suggestedMax },
      marketReference: marketMin || marketMax ? { min: marketMin, max: marketMax } : null,
      explanation: baseCost
        ? `Estimated from ₹${material.toFixed(0)} material + ₹${labor.toFixed(0)} labour, with a ${Math.round((demandMultiplier - 1) * 100)}% demand/margin factor.`
        : "Enter material and labour costs to calculate a transparent estimate.",
      disclaimer: "This is an estimate, not a live marketplace price. Verify local and online market prices before publishing.",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getMarketLinkage = async (req, res) => {
  try {
    const {
      productName = "",
      category = "",
      craft = "",
      location = "",
      price = 0,
      capacity = 0,
      festival = "",
    } = req.body;

    const text = `${productName} ${category} ${craft}`.toLowerCase();
    const opportunities = [];

    if (/textile|silk|dupatta|weav|fabric|fashion/.test(text)) {
      opportunities.push(
        { market: "Boutique & ethnic fashion stores", reason: "Craft-led textiles fit curated apparel and gifting collections.", priority: "High" },
        { market: "Wedding & festive gifting", reason: "Traditional textiles are suitable for seasonal and wedding demand.", priority: "High" },
        { market: "Handloom exhibitions", reason: "In-person craft discovery supports premium storytelling.", priority: "Medium" }
      );
    } else if (/pottery|clay|terracotta|ceramic|diya|home/.test(text)) {
      opportunities.push(
        { market: "Home decor & lifestyle stores", reason: "Handmade decor has strong visual and gifting appeal.", priority: "High" },
        { market: "Festival & corporate gifting", reason: "Small handcrafted items can be bundled for seasonal gifting.", priority: "High" },
        { market: "Craft fairs & exhibitions", reason: "Physical demonstrations can communicate handmade value.", priority: "Medium" }
      );
    } else if (/painting|art|madhubani|wood|bamboo|basket|craft/.test(text)) {
      opportunities.push(
        { market: "Art & handicraft retailers", reason: "Specialist buyers value distinctive craft and provenance.", priority: "High" },
        { market: "Corporate gifting", reason: "Story-rich handmade products can be positioned as meaningful gifts.", priority: "Medium" },
        { market: "Online handmade marketplaces", reason: "Visual storytelling helps niche craft discovery.", priority: "Medium" }
      );
    } else {
      opportunities.push(
        { market: "Local boutiques & retailers", reason: "Start with buyers who can evaluate the craft category directly.", priority: "High" },
        { market: "Corporate gifting", reason: "Handmade products can be positioned as differentiated gifts.", priority: "Medium" },
        { market: "Online handmade marketplaces", reason: "Digital catalogs expand reach beyond the local area.", priority: "Medium" }
      );
    }

    const cities = location.toLowerCase().includes("up") || location.toLowerCase().includes("uttar")
      ? ["Delhi NCR", "Lucknow", "Jaipur"]
      : ["Delhi NCR", "Mumbai", "Bengaluru"];

    const seasonal = festival
      ? `${festival}: consider launching 3-6 weeks before peak demand.`
      : "Festival and wedding seasons can create short demand windows; track orders to improve future predictions.";

    res.json({
      location: location || "India",
      price: Number(price) || 0,
      capacity: Number(capacity) || 0,
      opportunities,
      targetCities: cities,
      seasonalInsight: seasonal,
      nextActions: [
        "Prepare a 5-10 product digital catalog with consistent photos.",
        "Contact 3-5 relevant retailer/buyer segments and compare their quantity, price and delivery requirements.",
        "Record enquiries and conversions so future recommendations can be based on your real sales data.",
      ],
      disclaimer: "These are market-segment recommendations, not verified buyer leads or live demand statistics.",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const matchBuyer = async (req, res) => {
  try {
    const {
      craft = "",
      category = "",
      quantity = 0,
      price = 0,
      capacity = 0,
      deliveryDays = 30,
      buyerCraft = "",
      buyerCategory = "",
      buyerQuantity = 0,
      buyerBudget = 0,
      buyerLocation = "",
      artisanLocation = "",
    } = req.body;

    const q = `${craft} ${category}`.toLowerCase();
    const b = `${buyerCraft} ${buyerCategory}`.toLowerCase();

    let score = 0;
    const reasons = [];
    const gaps = [];

    if (q && b && (q.includes(b) || b.includes(q) || q.split(/\s+/).some((w) => w.length > 3 && b.includes(w)))) {
      score += 35; reasons.push("Craft/category is compatible.");
    } else {
      gaps.push("Craft/category needs manual verification.");
    }

    const requestedQty = Number(buyerQuantity) || Number(quantity) || 0;
    const available = Number(capacity) || 0;
    if (requestedQty > 0 && available >= requestedQty) {
      score += 25; reasons.push("Production capacity can cover the requested quantity.");
    } else if (requestedQty > 0) {
      gaps.push("Requested quantity is above the supplied capacity.");
    }

    const unitPrice = Number(price) || 0;
    const budget = Number(buyerBudget) || 0;
    if (unitPrice > 0 && budget > 0 && unitPrice <= budget) {
      score += 25; reasons.push("Unit price is within the buyer's budget.");
    } else if (unitPrice > 0 && budget > 0) {
      gaps.push("Unit price is above the buyer's stated budget.");
    }

    if (artisanLocation && buyerLocation) {
      if (artisanLocation.toLowerCase().split(/[\s,]+/).some((w) => w.length > 2 && buyerLocation.toLowerCase().includes(w))) {
        score += 10; reasons.push("Location appears compatible.");
      } else {
        score += 5; reasons.push("Delivery geography should be confirmed.");
      }
    } else {
      score += 5;
    }

    const delivery = Number(deliveryDays) || 30;
    if (delivery >= 7) {
      score += 5;
      reasons.push("Delivery window is usable for a small-batch artisan order.");
    }

    score = Math.min(100, score);
    const band = score >= 80 ? "Excellent match" : score >= 60 ? "Good match" : score >= 40 ? "Potential match" : "Low match";

    res.json({
      score,
      band,
      reasons,
      gaps,
      buyer: { quantity: requestedQty, budget, location: buyerLocation },
      artisan: { capacity: available, price: unitPrice, location: artisanLocation },
      note: "Compatibility score is a decision-support estimate, not a guarantee of a completed transaction.",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
