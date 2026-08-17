import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, X, Sparkles, AlertCircle, Check } from "lucide-react";
import { parseVoiceInvoice, isSpeechRecognitionSupported } from "../utils/voiceParser.js";
import toast from "react-hot-toast";

// Voice billing modal: owner taps mic, speaks the order naturally,
// e.g. "bill for Ramesh, two Parle-G, one milk, three soap"
// The transcript is parsed against the live product list and shown
// as an editable preview before it's added to the cart.
const VoiceBilling = ({ products, onClose, onConfirm }) => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsed, setParsed] = useState(null);
  const recognitionRef = useRef(null);
  const supported = isSpeechRecognitionSupported();

  useEffect(() => {
    if (!supported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event) => {
      let finalText = "";
      for (let i = 0; i < event.results.length; i++) {
        finalText += event.results[i][0].transcript + " ";
      }
      setTranscript(finalText.trim());
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        toast.error("Microphone permission denied. Please allow mic access.");
      } else if (event.error !== "no-speech") {
        toast.error("Voice recognition error: " + event.error);
      }
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;

    return () => recognition.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = () => {
    setTranscript("");
    setParsed(null);
    try {
      recognitionRef.current?.start();
      setListening(true);
    } catch (e) {
      // recognition may already be running; ignore
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const handleParse = () => {
    if (!transcript.trim()) {
      toast.error("Say something first, or type it below.");
      return;
    }
    const result = parseVoiceInvoice(transcript, products);
    if (result.items.length === 0) {
      toast.error("Couldn't match any products. Try naming them more clearly.");
    }
    setParsed(result);
  };

  const handleConfirm = () => {
    onConfirm(parsed);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-600" />
            <h3 className="font-semibold text-lg text-gray-800">Speak to Bill</h3>
          </div>
          <button onClick={onClose} className="text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-gray-400 mb-5">
          Try: "bill for Ramesh, two Parle-G, one milk, three soap"
        </p>

        {!supported ? (
          <div className="bg-orange-50 text-orange-700 rounded-xl p-4 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            Voice recognition isn't supported in this browser. Please use Google Chrome or Microsoft Edge on desktop or Android.
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center py-4">
              <button
                onClick={listening ? stopListening : startListening}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  listening ? "bg-red-500 animate-pulse" : "bg-brand-600 hover:bg-brand-700"
                }`}
              >
                {listening ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
              </button>
              <p className="text-xs text-gray-400 mt-3">
                {listening ? "Listening... tap to stop" : "Tap the mic and speak your order"}
              </p>
            </div>

            <div className="mb-4">
              <label className="label">Transcript (you can edit this)</label>
              <textarea
                className="input-field min-h-[80px]"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="What you say will appear here..."
              />
            </div>

            <button onClick={handleParse} className="btn-secondary w-full mb-4">
              Match Products from Order
            </button>

            {parsed && (
              <div className="border-t border-gray-100 pt-4">
                {parsed.customerName && (
                  <p className="text-sm text-gray-600 mb-3">
                    Customer: <span className="font-semibold text-gray-800">{parsed.customerName}</span>
                  </p>
                )}

                {parsed.items.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {parsed.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm bg-brand-50 rounded-lg px-3 py-2">
                        <span className="flex items-center gap-1.5 text-gray-700">
                          <Check className="w-3.5 h-3.5 text-brand-600" />
                          {item.name}
                        </span>
                        <span className="text-gray-500">{item.quantity} x ₹{item.price}</span>
                      </div>
                    ))}
                  </div>
                )}

                {parsed.unmatched.length > 0 && (
                  <div className="bg-orange-50 rounded-lg px-3 py-2 text-xs text-orange-700 mb-3">
                    Couldn't match: {parsed.unmatched.join(", ")}
                  </div>
                )}

                {parsed.items.length > 0 && (
                  <button onClick={handleConfirm} className="btn-primary w-full">
                    Add {parsed.items.length} item{parsed.items.length > 1 ? "s" : ""} to Bill
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VoiceBilling;
