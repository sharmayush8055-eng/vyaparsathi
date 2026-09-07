import { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout.jsx";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import {
  Camera,
  Mic,
  MicOff,
  Sparkles,
  Tag,
  MapPin,
  IndianRupee,
  Users,
  Factory,
  Trash2,
  Copy,
  CheckCircle2,
  TrendingUp,
  Languages,
  Target,
  ShieldCheck,
} from "lucide-react";

const EMPTY_PROFILE = {
  craft: "",
  location: "",
  productionCapacity: "",
  priceMin: "",
  priceMax: "",
  languages: ["Hindi", "English"],
};

const EMPTY_PRICE = {
  materialCost: "",
  laborCost: "",
  productionHours: "",
  observedMin: "",
  observedMax: "",
  demand: "medium",
};

const EMPTY_BUYER = {
  buyerCraft: "",
  buyerCategory: "",
  buyerQuantity: "",
  buyerBudget: "",
  buyerLocation: "",
  deliveryDays: "30",
};

const languageCodes = {
  English: "en-IN",
  Hindi: "hi-IN",
  Bengali: "bn-IN",
  Marathi: "mr-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN",
  Gujarati: "gu-IN",
  Kannada: "kn-IN",
};

const ArtisanCopilot = () => {
  const [tab, setTab] = useState("catalog");
  const [imageData, setImageData] = useState("");
  const [imageName, setImageName] = useState("");
  const [voiceText, setVoiceText] = useState("");
  const [language, setLanguage] = useState("Hindi");
  const [listening, setListening] = useState(false);
  const [catalog, setCatalog] = useState(null);
  const [catalogs, setCatalogs] = useState([]);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [priceForm, setPriceForm] = useState(EMPTY_PRICE);
  const [priceResult, setPriceResult] = useState(null);
  const [marketResult, setMarketResult] = useState(null);
  const [buyerForm, setBuyerForm] = useState(EMPTY_BUYER);
  const [buyerResult, setBuyerResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    Promise.all([
      api.get("/ai-copilot/catalogs"),
      api.get("/ai-copilot/profile"),
    ])
      .then(([catalogRes, profileRes]) => {
        setCatalogs(catalogRes.data || []);
        setProfile({ ...EMPTY_PROFILE, ...profileRes.data });
      })
      .catch(() => toast.error("Could not load AI Copilot data"));
  }, []);

  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Please choose JPG, PNG or WEBP.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Please choose an image below 4 MB.");
      return;
    }

    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => setImageData(reader.result);
    reader.readAsDataURL(file);
  };

  const toggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input is not supported here. Try Chrome or Edge.");
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = languageCodes[language] || "hi-IN";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setVoiceText(text);
    };
    recognition.onerror = () => {
      setListening(false);
      toast.error("Voice recognition could not complete.");
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const generateCatalog = async () => {
    if (!imageData && !voiceText.trim()) {
      toast.error("Take a product photo or describe the product first.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/ai-copilot/catalogs/generate", {
        imageData,
        voiceText,
        language,
      });
      setCatalog(data.catalog);
      setCatalogs((prev) => [data.catalog, ...prev]);
      toast.success(data.message);
      setTab("catalog");
    } catch (error) {
      toast.error(error.response?.data?.message || "Catalog generation failed");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      const { data } = await api.put("/ai-copilot/profile", profile);
      setProfile({ ...EMPTY_PROFILE, ...data });
      toast.success("Artisan profile saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save profile");
    }
  };

  const calculatePrice = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/ai-copilot/pricing", priceForm);
      setPriceResult(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Pricing calculation failed");
    } finally {
      setLoading(false);
    }
  };

  const findMarkets = async () => {
    const source = catalog || catalogs[0];
    if (!source) {
      toast.error("Generate a catalog first.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/ai-copilot/market-linkage", {
        productName: source.productName,
        category: source.category,
        craft: source.craft || profile.craft,
        location: profile.location,
        price: priceResult?.recommendedPrice || profile.priceMin,
        capacity: profile.productionCapacity,
        festival: "",
      });
      setMarketResult(data);
      setTab("markets");
    } catch (error) {
      toast.error(error.response?.data?.message || "Market analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const matchBuyer = async () => {
    const source = catalog || catalogs[0];
    if (!source) {
      toast.error("Generate a catalog first.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/ai-copilot/buyer-match", {
        craft: source.craft || profile.craft,
        category: source.category,
        price: priceResult?.recommendedPrice || profile.priceMin,
        capacity: profile.productionCapacity,
        artisanLocation: profile.location,
        ...buyerForm,
      });
      setBuyerResult(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Buyer matching failed");
    } finally {
      setLoading(false);
    }
  };

  const deleteCatalog = async (id) => {
    try {
      await api.delete(`/ai-copilot/catalogs/${id}`);
      setCatalogs((prev) => prev.filter((item) => item._id !== id));
      if (catalog?._id === id) setCatalog(null);
      toast.success("Catalog removed");
    } catch {
      toast.error("Could not remove catalog");
    }
  };

  const copyListing = async () => {
    if (!catalog) return;
    const text = `${catalog.productName}\n\n${catalog.description}\n\nMaterial: ${catalog.material}\nCraft: ${catalog.craft}\n\n${catalog.culturalStory}\n\n${catalog.tags.map((t) => `#${t.replace(/\s+/g, "")}`).join(" ")}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Marketplace listing copied");
    } catch {
      toast.error("Clipboard permission was unavailable");
    }
  };

  const tabs = [
    { id: "catalog", label: "Snap-to-Catalog", icon: Camera },
    { id: "pricing", label: "Smart Pricing", icon: IndianRupee },
    { id: "markets", label: "Market Linkage", icon: Target },
    { id: "buyer", label: "Buyer Match", icon: Users },
    { id: "profile", label: "Artisan Profile", icon: Factory },
  ];

  return (
    <Layout title="AI Artisan Copilot">
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 p-6 lg:p-8 text-white shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5" /> AI-powered artisan business assistant
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold">From one photo to a market-ready opportunity.</h1>
              <p className="text-brand-100 text-sm mt-2 max-w-2xl">
                Speak in your language, create a professional catalog, estimate a fair price, discover target markets and test buyer compatibility.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/10 rounded-2xl p-3"><b className="block text-lg">01</b>Catalog</div>
              <div className="bg-white/10 rounded-2xl p-3"><b className="block text-lg">02</b>Price</div>
              <div className="bg-white/10 rounded-2xl p-3"><b className="block text-lg">03</b>Market</div>
              <div className="bg-white/10 rounded-2xl p-3"><b className="block text-lg">04</b>Match</div>
            </div>
          </div>
        </section>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition ${
                tab === id ? "bg-brand-600 text-white border-brand-600" : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {tab === "catalog" && (
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-5">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-semibold text-gray-800">Snap-to-Catalog AI</h2>
                    <p className="text-xs text-gray-400 mt-1">Photo + voice becomes a marketplace listing.</p>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-brand-600" />
                </div>

                <label className="border-2 border-dashed border-gray-200 hover:border-brand-400 rounded-2xl min-h-48 flex items-center justify-center cursor-pointer overflow-hidden">
                  {imageData ? (
                    <img src={imageData} alt="Product preview" className="w-full h-64 object-contain bg-gray-50" />
                  ) : (
                    <div className="text-center p-8">
                      <Camera className="w-9 h-9 mx-auto text-brand-500 mb-2" />
                      <p className="text-sm font-medium text-gray-700">Take or upload product photo</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG or WEBP • up to 4 MB</p>
                    </div>
                  )}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImage} />
                </label>
                {imageName && <p className="text-xs text-gray-400 mt-2 truncate">Selected: {imageName}</p>}

                <div className="mt-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="label mb-0">Describe the product in your language</label>
                    <select className="text-xs border border-gray-200 rounded-lg px-2 py-1" value={language} onChange={(e) => setLanguage(e.target.value)}>
                      {Object.keys(languageCodes).map((l) => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="relative">
                    <textarea
                      className="input-field min-h-28 pr-12"
                      value={voiceText}
                      onChange={(e) => setVoiceText(e.target.value)}
                      placeholder={language === "Hindi" ? "उदाहरण: यह हाथ से बनी मिट्टी की दीया है..." : "Example: This is a hand-painted terracotta diya..."}
                    />
                    <button
                      type="button"
                      onClick={toggleVoice}
                      className={`absolute right-3 bottom-3 w-9 h-9 rounded-full flex items-center justify-center ${listening ? "bg-red-500 text-white animate-pulse" : "bg-brand-50 text-brand-600"}`}
                      title="Voice input"
                    >
                      {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">{listening ? "Listening… speak naturally." : "Voice recognition uses your browser and does not require typing."}</p>
                </div>

                <button onClick={generateCatalog} disabled={loading} className="btn-primary w-full mt-5 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" /> {loading ? "Analyzing…" : "Generate Smart Catalog"}
                </button>
              </div>

              {catalog && (
                <div className="card border-brand-100">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[11px] uppercase tracking-wide text-brand-600 font-semibold">Generated catalog</span>
                      <h2 className="text-xl font-bold text-gray-800 mt-1">{catalog.productName}</h2>
                      <p className="text-xs text-gray-400 mt-1">{catalog.category} • {catalog.craft}</p>
                    </div>
                    <button onClick={copyListing} className="btn-secondary flex items-center gap-2 text-xs"><Copy className="w-3.5 h-3.5" /> Copy listing</button>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3 mt-5">
                    <Info label="Material" value={catalog.material} />
                    <Info label="Craft" value={catalog.craft} />
                    <Info label="Production time" value={catalog.productionTime} />
                  </div>

                  <div className="mt-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</p>
                    <p className="text-sm text-gray-700 mt-1 leading-6">{catalog.description}</p>
                  </div>
                  <div className="mt-4 bg-brand-50 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-brand-700 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> Cultural story</p>
                    <p className="text-sm text-gray-700 mt-1 leading-6">{catalog.culturalStory}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {(catalog.tags || []).map((tag) => <span key={tag} className="px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-600">#{tag}</span>)}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-4">
                    {catalog.aiMode === "openrouter" ? "Vision + LLM analysis enabled." : "Demo intelligence mode. Add OPENROUTER_API_KEY for real vision + LLM analysis."}
                  </p>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 card h-fit">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-brand-600" />
                <div>
                  <h3 className="font-semibold text-gray-800">Saved Catalogs</h3>
                  <p className="text-xs text-gray-400">Your latest AI-generated listings</p>
                </div>
              </div>
              <div className="space-y-3 max-h-[620px] overflow-y-auto">
                {catalogs.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-10">No catalogs yet. Create your first one.</p>
                ) : catalogs.map((item) => (
                  <div key={item._id} className={`rounded-2xl border p-3 ${catalog?._id === item._id ? "border-brand-400 bg-brand-50/50" : "border-gray-100"}`}>
                    <div className="flex justify-between gap-2">
                      <button className="text-left flex-1" onClick={() => setCatalog(item)}>
                        <p className="text-sm font-semibold text-gray-800">{item.productName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                      </button>
                      <button onClick={() => deleteCatalog(item._id)} className="text-gray-300 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "pricing" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="font-semibold text-gray-800">Smart Pricing Assistant</h2>
              <p className="text-xs text-gray-400 mt-1">Transparent estimate using your costs and optional observed market range.</p>
              <div className="grid sm:grid-cols-2 gap-4 mt-5">
                <Field label="Material cost (₹)" value={priceForm.materialCost} onChange={(v) => setPriceForm({ ...priceForm, materialCost: v })} type="number" />
                <Field label="Labour cost (₹)" value={priceForm.laborCost} onChange={(v) => setPriceForm({ ...priceForm, laborCost: v })} type="number" />
                <Field label="Production hours" value={priceForm.productionHours} onChange={(v) => setPriceForm({ ...priceForm, productionHours: v })} type="number" />
                <div><label className="label">Demand level</label><select className="input-field" value={priceForm.demand} onChange={(e) => setPriceForm({ ...priceForm, demand: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                <Field label="Observed market min (₹)" value={priceForm.observedMin} onChange={(v) => setPriceForm({ ...priceForm, observedMin: v })} type="number" />
                <Field label="Observed market max (₹)" value={priceForm.observedMax} onChange={(v) => setPriceForm({ ...priceForm, observedMax: v })} type="number" />
              </div>
              <button onClick={calculatePrice} disabled={loading} className="btn-primary w-full mt-5 flex justify-center items-center gap-2"><TrendingUp className="w-4 h-4" /> {loading ? "Calculating…" : "Calculate Fair Price"}</button>
            </div>
            <div className="card">
              {priceResult ? (
                <>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Recommended price</p>
                  <p className="text-4xl font-bold text-brand-600 mt-1">₹{priceResult.recommendedPrice.toLocaleString("en-IN")}</p>
                  <p className="text-sm text-gray-500 mt-2">Suggested range: ₹{priceResult.suggestedRange.min.toLocaleString("en-IN")} – ₹{priceResult.suggestedRange.max.toLocaleString("en-IN")}</p>
                  <div className="grid grid-cols-3 gap-2 mt-5">
                    <MiniStat label="Base cost" value={`₹${priceResult.baseCost.toFixed(0)}`} />
                    <MiniStat label="Demand" value={priceResult.demand} />
                    <MiniStat label="Hours" value={priceResult.productionHours} />
                  </div>
                  <div className="bg-orange-50 rounded-2xl p-4 mt-5 text-xs text-orange-800">{priceResult.explanation}</div>
                  <p className="text-[11px] text-gray-400 mt-4">{priceResult.disclaimer}</p>
                </>
              ) : (
                <EmptyState icon={IndianRupee} title="Your pricing insight will appear here" text="Enter material and labour costs to get a transparent estimate." />
              )}
            </div>
          </div>
        )}

        {tab === "markets" && (
          <div className="space-y-5">
            <div className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div><h2 className="font-semibold text-gray-800">AI Market Linkage Engine</h2><p className="text-xs text-gray-400 mt-1">Find the buyer segments and locations most worth testing.</p></div>
              <button onClick={findMarkets} disabled={loading} className="btn-primary flex items-center justify-center gap-2"><MapPin className="w-4 h-4" /> {loading ? "Analyzing…" : "Analyze Markets"}</button>
            </div>
            {marketResult ? (
              <div className="grid lg:grid-cols-3 gap-5">
                <div className="card lg:col-span-2">
                  <h3 className="font-semibold text-gray-800">Priority buyer segments</h3>
                  <div className="space-y-3 mt-4">
                    {marketResult.opportunities.map((op, i) => (
                      <div key={i} className="border border-gray-100 rounded-2xl p-4 flex gap-3">
                        <span className={`text-[10px] font-bold px-2 py-1 h-fit rounded-full ${op.priority === "High" ? "bg-brand-50 text-brand-700" : "bg-orange-50 text-orange-700"}`}>{op.priority}</span>
                        <div><p className="font-medium text-sm text-gray-800">{op.market}</p><p className="text-xs text-gray-500 mt-1">{op.reason}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="card"><p className="text-xs text-gray-400">Target cities to test</p><div className="flex flex-wrap gap-2 mt-3">{marketResult.targetCities.map((city) => <span key={city} className="px-2.5 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-xs font-medium">{city}</span>)}</div></div>
                  <div className="card"><p className="text-xs text-gray-400">Seasonal insight</p><p className="text-sm text-gray-700 mt-2 leading-6">{marketResult.seasonalInsight}</p></div>
                </div>
                <div className="lg:col-span-3 bg-blue-50 rounded-2xl p-4 text-xs text-blue-800">{marketResult.disclaimer}</div>
              </div>
            ) : (
              <div className="card"><EmptyState icon={MapPin} title="No market analysis yet" text="Generate a catalog and save your artisan location/profile, then run Market Linkage." /></div>
            )}
          </div>
        )}

        {tab === "buyer" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="font-semibold text-gray-800">Buyer Requirement Matcher</h2>
              <p className="text-xs text-gray-400 mt-1">Enter a buyer's requirement to calculate compatibility with your catalog.</p>
              <div className="grid sm:grid-cols-2 gap-4 mt-5">
                <Field label="Buyer craft" value={buyerForm.buyerCraft} onChange={(v) => setBuyerForm({ ...buyerForm, buyerCraft: v })} placeholder="e.g. pottery" />
                <Field label="Buyer category" value={buyerForm.buyerCategory} onChange={(v) => setBuyerForm({ ...buyerForm, buyerCategory: v })} placeholder="e.g. home decor" />
                <Field label="Required quantity" value={buyerForm.buyerQuantity} onChange={(v) => setBuyerForm({ ...buyerForm, buyerQuantity: v })} type="number" />
                <Field label="Budget per unit (₹)" value={buyerForm.buyerBudget} onChange={(v) => setBuyerForm({ ...buyerForm, buyerBudget: v })} type="number" />
                <Field label="Buyer location" value={buyerForm.buyerLocation} onChange={(v) => setBuyerForm({ ...buyerForm, buyerLocation: v })} placeholder="e.g. Delhi" />
                <Field label="Delivery days" value={buyerForm.deliveryDays} onChange={(v) => setBuyerForm({ ...buyerForm, deliveryDays: v })} type="number" />
              </div>
              <button onClick={matchBuyer} disabled={loading} className="btn-primary w-full mt-5 flex justify-center gap-2"><Users className="w-4 h-4" /> {loading ? "Matching…" : "Calculate Match Score"}</button>
            </div>
            <div className="card">
              {buyerResult ? (
                <>
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Compatibility score</p>
                    <p className="text-6xl font-bold text-brand-600 mt-2">{buyerResult.score}%</p>
                    <p className="font-semibold text-gray-700 mt-1">{buyerResult.band}</p>
                  </div>
                  <div className="mt-6 space-y-2">{buyerResult.reasons.map((r, i) => <p key={i} className="text-sm text-gray-600 flex gap-2"><CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />{r}</p>)}</div>
                  {buyerResult.gaps.length > 0 && <div className="mt-4 bg-orange-50 rounded-2xl p-4"><p className="text-xs font-semibold text-orange-800">Check before accepting</p>{buyerResult.gaps.map((g, i) => <p key={i} className="text-xs text-orange-700 mt-1">• {g}</p>)}</div>}
                  <p className="text-[11px] text-gray-400 mt-5">{buyerResult.note}</p>
                </>
              ) : <EmptyState icon={Users} title="Buyer match appears here" text="Try a requirement such as 300 units, ₹500 budget, 30-day delivery." />}
            </div>
          </div>
        )}

        {tab === "profile" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="font-semibold text-gray-800">Artisan Business Profile</h2>
              <p className="text-xs text-gray-400 mt-1">This information powers market and buyer recommendations.</p>
              <div className="space-y-4 mt-5">
                <Field label="Primary craft" value={profile.craft} onChange={(v) => setProfile({ ...profile, craft: v })} placeholder="e.g. Pottery" />
                <Field label="Location" value={profile.location} onChange={(v) => setProfile({ ...profile, location: v })} placeholder="District / State" />
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Capacity / month" value={profile.productionCapacity} onChange={(v) => setProfile({ ...profile, productionCapacity: v })} type="number" />
                  <Field label="Min price" value={profile.priceMin} onChange={(v) => setProfile({ ...profile, priceMin: v })} type="number" />
                  <Field label="Max price" value={profile.priceMax} onChange={(v) => setProfile({ ...profile, priceMax: v })} type="number" />
                </div>
              </div>
              <button onClick={saveProfile} className="btn-primary w-full mt-5">Save Artisan Profile</button>
            </div>
            <div className="card bg-gray-50">
              <Languages className="w-7 h-7 text-brand-600" />
              <h3 className="font-semibold text-gray-800 mt-3">Voice-first, multilingual workflow</h3>
              <p className="text-sm text-gray-500 mt-2 leading-6">The copilot accepts speech in supported Indian language modes and turns it into structured catalog information. For a production deployment, connect a dedicated Indic speech-to-text and translation service for stronger regional-language coverage.</p>
              <div className="flex flex-wrap gap-2 mt-4">{Object.keys(languageCodes).map((l) => <span key={l} className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-full text-gray-600">{l}</span>)}</div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const Field = ({ label, value, onChange, type = "text", placeholder = "" }) => (
  <div>
    <label className="label">{label}</label>
    <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input-field" min={type === "number" ? 0 : undefined} />
  </div>
);

const Info = ({ label, value }) => (
  <div className="bg-gray-50 rounded-xl p-3"><p className="text-[11px] text-gray-400">{label}</p><p className="text-sm font-medium text-gray-700 mt-1">{value || "Not provided"}</p></div>
);

const MiniStat = ({ label, value }) => (
  <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-[10px] text-gray-400">{label}</p><p className="text-sm font-semibold text-gray-700 mt-1 capitalize">{value}</p></div>
);

const EmptyState = ({ icon: Icon, title, text }) => (
  <div className="min-h-64 flex flex-col items-center justify-center text-center"><Icon className="w-10 h-10 text-brand-300" /><p className="font-semibold text-gray-700 mt-3">{title}</p><p className="text-sm text-gray-400 mt-1 max-w-sm">{text}</p></div>
);

export default ArtisanCopilot;
