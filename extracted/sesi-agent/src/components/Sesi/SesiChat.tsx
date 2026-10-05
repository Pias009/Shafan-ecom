"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSesi, type ProductSuggestion } from "./useSesi";
import { Loader2, ChevronRight } from "lucide-react";
import SesiRadarChart from "./SesiRadarChart";
import ProductPrescriptionCard from "./ProductPrescriptionCard";
import SkinTestCTA from "./SkinTestCTA";
import ProductRecommendationCard from "./ProductRecommendationCard";
import CooldownScreen from "./CooldownScreen";
import { pickSesiGif } from "@/lib/sesi/gifs";

const MAX_QUESTIONS_BEFORE_COOLDOWN = 8;

const GREETING_VARIANTS = [
  "Hey there! I'm Sesi, your skincare guide. Ready to discover what your skin needs today?",
  "Welcome! I'm Sesi. I help people find the perfect routine for their skin. What brings you here?",
  "Hi! I'm Sesi. Tell me about your skin — I'd love to help you find products that truly work for you.",
  "Great to meet you! I'm Sesi. Whether you have specific concerns or just want to explore, I'm here to help.",
];

const WELCOME_QUICK_REPLIES = [
  "Analyze my skin type",
  "Recommend products for me",
  "Ask a skincare question",
  "Take a skin assessment",
];

export default function SesiChat() {
  const {
    state,
    persona,
    messages,
    isTyping,
    aiHistory,
    suggestedProducts,
    routineTimerActive,
    skinType,
    skinConcerns,
    questionCount,
    cooldownExpiry,
    hasPurchased,
    addMessage,
    setTyping,
    advanceState,
    setChartData,
    setRecommendedProductId,
    setProductSuggestions,
    addAIHistory,
    triggerRoutinePivot,
    setSkinType,
    setSkinConcerns,
    incrementQuestionCount,
    triggerCooldown,
    markPurchased,
    clearCooldown,
  } = useSesi();

  const [userInput, setUserInput] = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializingRef = useRef(false);
  const greetingIndex = useRef(Math.floor(Math.random() * GREETING_VARIANTS.length));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, showQuickReplies]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sesi-cooldown");
      if (saved) {
        const expiry = JSON.parse(saved);
        if (expiry > Date.now()) {
          triggerCooldown();
        } else {
          clearCooldown();
        }
      }
    } catch {
      // ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldownExpiry && cooldownExpiry <= Date.now()) {
      clearCooldown();
    }
  }, [cooldownExpiry, clearCooldown]);

  useEffect(() => {
    if (state === "PLAYFUL_FRIEND" && messages.length === 0 && !initializingRef.current) {
      initializingRef.current = true;
      const greeting = GREETING_VARIANTS[greetingIndex.current % GREETING_VARIANTS.length];
      greetingIndex.current++;
      playSequentialMessages(
        [greeting],
        () => {
          setShowQuickReplies(WELCOME_QUICK_REPLIES);
        }
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const playSequentialMessages = (
    texts: string[],
    onComplete: () => void
  ) => {
    setTyping(true);
    let index = 0;

    const sendNext = () => {
      if (index < texts.length) {
        addMessage(texts[index], false);
        index++;
        setTimeout(sendNext, 1000);
      } else {
        setTyping(false);
        onComplete();
      }
    };

    sendNext();
  };

  const fetchProductRecommendations = async (
    type: string,
    concerns: string[]
  ) => {
    setTyping(true);
    try {
      const res = await fetch("/api/sesi/recommend-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skinType: type,
          concerns,
          limit: 4,
        }),
      });

      const data = await res.json();

      if (data.products && data.products.length > 0) {
        const products = data.products as ProductSuggestion[];
        setProductSuggestions(products);
        advanceState("PRODUCT_RECOMMENDATION");

        addMessage(
          `I found ${products.length} products tailored to your ${type} skin. Here's what I recommend:`,
          false,
          "product_recommendation"
        );

        products.forEach((product, i) => {
          addMessage(
            `${i + 1}. ${product.name}\n${product.description || `Formulated for: ${product.skinTypes.join(", ")}`}\nPrice: ${product.price}`,
            false,
            "product_recommendation",
            product.id
          );
        });

        const howToUse = products
          .map((p) => p.howToUse)
          .filter((h): h is string => Boolean(h))[0];
        if (howToUse) {
          addMessage(
            `How to use:\n\n${howToUse}`,
            false
          );
        } else {
          addMessage(
            `Quick routine guide:\n\nMorning: Cleanse → Treat → Moisturize → SPF\nNight: Cleanse → Treat → Night Cream`,
            false
          );
        }

        setShowQuickReplies([
          "Show me product details",
          "Get different suggestions",
          "Build my routine",
        ]);
    } else {
      addMessage(
        "I couldn't find exact matches right now. Let me try a different approach for you.",
        false
      );
      setShowQuickReplies(["Try a different skin type", "Ask me anything else"]);
    }
    } catch {
      addMessage(
        "I apologize, but I'm having trouble accessing product recommendations right now. Could you try again in a moment?",
        false
      );
    } finally {
      setTyping(false);
    }
  };

  const sendToAI = async (
    text: string,
    mode: "baby" | "doctor" | "reveal" | "product" = "baby"
  ) => {
    incrementQuestionCount();

    if (questionCount + 1 >= MAX_QUESTIONS_BEFORE_COOLDOWN && !hasPurchased) {
      setTyping(true);
      setShowQuickReplies([]);
      addMessage(text, true);
      addAIHistory("user", text);

      addMessage(
        "You've gotten a lot of great advice today! Before I wrap up, let me suggest some products that match what we've discussed.",
        false
      );

      setTimeout(() => {
        fetchProductRecommendations(skinType || "normal", skinConcerns.length > 0 ? skinConcerns : ["brightening"]);
      }, 1000);

      setTimeout(() => {
        addMessage(
          "I'll be back tomorrow if you need more help. In the meantime, check out those suggestions or your saved routine!",
          false,
          "cooldown"
        );
        setShowQuickReplies(["View my routine", "Browse suggested products"]);
        triggerCooldown();
      }, 6000);

      return;
    }

    setTyping(true);
    setShowQuickReplies([]);
    addMessage(text, true);
    addAIHistory("user", text);

    try {
      const res = await fetch("/api/sesi/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          mode,
          history: aiHistory,
        }),
      });

      const data = await res.json();

      const gifUrl = state === "REVEAL_SHINE" ? (pickSesiGif(data.text, persona) ?? undefined) : undefined;
      addMessage(data.text, false, "text", undefined, gifUrl);
      addAIHistory("assistant", data.text);

      if (data.chartData) {
        setChartData(data.chartData as Record<string, number>);
      }

      if (data.recommendedProductId) {
        setRecommendedProductId(data.recommendedProductId);
      }

      if (data.mode === "reveal" && state !== "REVEAL_SHINE") {
        advanceState("REVEAL_SHINE");
      } else if (state === "DR_SESI_DIAGNOSIS") {
        setTimeout(() => {
          if (!routineTimerActive) {
            triggerRoutinePivot();
            setTimeout(() => {
              addMessage(
                "I've put together a routine based on what you've shared. Would you like to see it?",
                false,
                "routine_pivot"
              );
              setShowQuickReplies(["Show me my routine", "Tell me more"]);
            }, 5000);
          }
        }, 5000);
      }

      if (state === "DR_SESI_DIAGNOSIS" && !showQuickReplies.length) {
        setShowQuickReplies([
          "That sounds right",
          "Not quite",
          "Tell me more about that",
        ]);
      }
    } catch {
      addMessage(
        "I'm having a bit of trouble processing that. Could you try asking again?",
        false
      );
    } finally {
      setTyping(false);
    }
  };

  const handleQuickReply = (reply: string) => {
    if (reply === "Maybe later") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      addMessage(
        "No problem at all! I'm here whenever you're ready to explore your skincare routine.",
        false
      );
      setShowQuickReplies([]);
      return;
    }

    if (reply === "Analyze my skin type") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      advanceState("SKIN_ANALYSIS");
      setShowQuickReplies([]);
      setTimeout(() => {
        playSequentialMessages(
          [
            "Let's find your skin type. After washing your face and waiting about 30 minutes, how does your skin feel?",
          ],
          () => {
            setShowQuickReplies([
              "Tight and dry",
              "Oily all over",
              "Oily in T-zone, normal elsewhere",
              "Balanced and comfortable",
              "Red or irritated",
            ]);
          }
        );
      }, 300);
      return;
    }

    if (reply === "Recommend products for me") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      advanceState("PRODUCT_REQUEST");
      setShowQuickReplies([]);
      setTimeout(() => {
        addMessage("I'd be happy to recommend products. First, what's your skin type?", false);
        setShowQuickReplies([
          "Oily",
          "Dry",
          "Combination",
          "Sensitive",
          "Normal",
          "Not sure",
        ]);
      }, 500);
      return;
    }

    if (reply === "Ask a skincare question") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      setShowQuickReplies([]);
      setTimeout(() => {
        playSequentialMessages(
          [
            "Feel free to ask me anything about skincare! What's on your mind?",
          ],
          () => {
            setShowQuickReplies([
              "How do I deal with dry skin?",
              "What's good for acne?",
              "How to reduce dark spots?",
              "Tips for glowing skin?",
              "Anti-aging routine advice?",
              "Something else",
            ]);
          }
        );
      }, 300);
      return;
    }

    if (reply === "Take a skin assessment") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      advanceState("DR_SESI_DIAGNOSIS");
      setShowQuickReplies([]);
      setTimeout(() => {
        addMessage("Let's do a thorough skin assessment. How would you describe your skin right now?", false);
        setShowQuickReplies([
          "Dry and flaky",
          "Oily and shiny",
          "Combination",
          "Normal and healthy",
          "Sensitive and reactive",
          "I'm not sure",
        ]);
      }, 500);
      return;
    }

    if (reply === "Not sure") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      advanceState("SKIN_ANALYSIS");
      setShowQuickReplies([]);
      setTimeout(() => {
        playSequentialMessages(
          [
            "No worries! Let's figure it out together. After cleansing your face and waiting 30 minutes without any products, how does it feel?",
          ],
          () => {
            setShowQuickReplies([
              "Tight and dry",
              "Shiny all over",
              "Oily in T-zone only",
              "Comfortable",
              "Red or itchy",
            ]);
          }
        );
      }, 300);
      return;
    }

    if (reply === "How do I deal with dry skin?") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      setSkinType("dry");
      setSkinConcerns(["hydration"]);
      setShowQuickReplies([]);
      setTimeout(() => {
        addMessage("Dry skin benefits from hydrating ingredients like hyaluronic acid, ceramides, and gentle cleansing. Let me find some products that would work well for you.", false);
        setTimeout(() => {
          fetchProductRecommendations("dry", ["hydration"]);
        }, 1500);
      }, 500);
      return;
    }

    if (reply === "What's good for acne?") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      setSkinConcerns(["acne"]);
      setShowQuickReplies([]);
      setTimeout(() => {
        addMessage("For acne-prone skin, ingredients like salicylic acid, niacinamide, and non-comedogenic moisturizers can help. What's your skin type?", false);
        setShowQuickReplies([
          "Oily",
          "Dry",
          "Combination",
          "Sensitive",
        ]);
      }, 500);
      return;
    }

    if (reply === "How to reduce dark spots?") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      setSkinConcerns(["dark spot"]);
      setShowQuickReplies([]);
      setTimeout(() => {
        addMessage("Dark spots often respond well to vitamin C, niacinamide, and consistent sun protection. What's your skin type?", false);
        setShowQuickReplies([
          "Oily",
          "Dry",
          "Combination",
          "Sensitive",
          "Normal",
        ]);
      }, 500);
      return;
    }

    if (reply === "Tips for glowing skin?") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      setSkinConcerns(["brightening"]);
      setShowQuickReplies([]);
      setTimeout(() => {
        addMessage("Glowing skin comes from a combination of good hydration, exfoliation, and the right active ingredients. What's your skin type?", false);
        setShowQuickReplies([
          "Oily",
          "Dry",
          "Combination",
          "Sensitive",
          "Normal",
        ]);
      }, 500);
      return;
    }

    if (reply === "Anti-aging routine advice?") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      setSkinConcerns(["aging"]);
      setShowQuickReplies([]);
      setTimeout(() => {
        addMessage("A good anti-aging routine includes SPF daily, retinoids, antioxidants like vitamin C, and consistent hydration. What's your skin type?", false);
        setShowQuickReplies([
          "Oily",
          "Dry",
          "Combination",
          "Sensitive",
          "Normal",
        ]);
      }, 500);
      return;
    }

    if (reply === "Something else") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      setShowQuickReplies([]);
      addMessage(
        "Tell me about your skin concern and I'll do my best to help!",
        false
      );
      return;
    }

    if (
      ["Oily", "Dry", "Combination", "Sensitive", "Normal"].includes(
        reply
      )
    ) {
      addMessage(reply, true);
      addAIHistory("user", reply);

      const typeMap: Record<string, string> = {
        "Oily": "oily",
        "Dry": "dry",
        "Combination": "combination",
        "Sensitive": "sensitive",
        "Normal": "normal",
      };
      const detectedType = typeMap[reply] || "normal";
      setSkinType(detectedType);

      setShowQuickReplies([]);
      setTimeout(() => {
        if (skinConcerns.length > 0) {
          addMessage(`Great. Let me find products suited for ${detectedType} skin with your concerns in mind.`, false);
          setTimeout(() => {
            fetchProductRecommendations(detectedType, skinConcerns);
          }, 1000);
        } else {
          addMessage("What are your main skin concerns? I can help with several areas.", false);
          setShowQuickReplies([
            "Acne and breakouts",
            "Dark spots and hyperpigmentation",
            "Fine lines and aging",
            "Dullness and uneven tone",
            "Large pores",
            "General glow and health",
          ]);
        }
      }, 500);
      return;
    }

    if (
      ["Acne and breakouts", "Dark spots and hyperpigmentation", "Fine lines and aging", "Dullness and uneven tone", "Large pores", "General glow and health"].includes(
        reply
      )
    ) {
      addMessage(reply, true);
      addAIHistory("user", reply);

      const concernMap: Record<string, string> = {
        "Acne and breakouts": "acne",
        "Dark spots and hyperpigmentation": "dark spot",
        "Fine lines and aging": "aging",
        "Dullness and uneven tone": "dull",
        "Large pores": "pores",
        "General glow and health": "brightening",
      };
      const concern = concernMap[reply] || "brightening";
      setSkinConcerns([concern]);

      setShowQuickReplies([]);
      setTimeout(() => {
        addMessage("Analyzing your skin profile...", false);
        setTimeout(() => {
          fetchProductRecommendations(skinType || "normal", [concern]);
        }, 1500);
      }, 300);
      return;
    }

    if (
      ["Tight and dry", "Oily all over", "Oily in T-zone, normal elsewhere", "Balanced and comfortable", "Red or irritated", "Tight and dry all over", "Shiny all over", "Oily in T-zone only", "Comfortable", "Red or itchy"].includes(
        reply
      )
    ) {
      addMessage(reply, true);
      addAIHistory("user", reply);

      const testMap: Record<string, string> = {
        "Tight and dry": "dry",
        "Tight and dry all over": "dry",
        "Shiny all over": "oily",
        "Oily all over": "oily",
        "Oily in T-zone, normal elsewhere": "combination",
        "Oily in T-zone only": "combination",
        "Balanced and comfortable": "normal",
        "Comfortable": "normal",
        "Red or irritated": "sensitive",
        "Red or itchy": "sensitive",
      };
      const detectedType = testMap[reply] || "normal";
      setSkinType(detectedType);

      setShowQuickReplies([]);
      setTimeout(() => {
        playSequentialMessages(
          [
            `Based on that, your skin appears to be ${detectedType} type.`,
            "What's your primary skincare concern?",
          ],
          () => {
            setShowQuickReplies([
              "Acne and breakouts",
              "Dark spots and hyperpigmentation",
              "Fine lines and aging",
              "Dullness and uneven tone",
              "General glow and health",
            ]);
          }
        );
      }, 500);
      return;
    }

    if (reply === "Show me product details") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      if (suggestedProducts.length > 0) {
        const first = suggestedProducts[0];
        addMessage(
          `You can view full product details and purchase by clicking on the product cards above. ${first.name} is a great option for your needs.`,
          false
        );
      }
      setShowQuickReplies(["Save my routine", "Get different suggestions"]);
      return;
    }

    if (reply === "Get different suggestions") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      setShowQuickReplies([]);
      setTimeout(() => {
        fetchProductRecommendations(skinType || "normal", skinConcerns);
      }, 500);
      return;
    }

    if (reply === "Save my routine" || reply === "Build my routine") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      addMessage(
        "Your routine has been noted. Here's a general framework:\n\nMorning: Cleanse → Treat → Moisturize → SPF\nNight: Cleanse → Treat → Night Cream\n\nTailor the products to your skin type and concerns.",
        false
      );
      setShowQuickReplies(["Ask more questions", "I'm done for now"]);
      return;
    }

    if (reply === "What's a skin test? 🤔") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      addMessage(
        "A skin assessment helps identify your skin type and concerns through a series of questions. It takes about 2 minutes and gives you personalized recommendations.",
        false
      );
      setShowQuickReplies(["Let's do the assessment", "Just suggest products"]);
      return;
    }

    if (reply === "Let's do it! 🔍" || reply === "Let's do the assessment") {
      advanceState("SKIN_ANALYSIS");
      setShowQuickReplies([]);
      setTimeout(() => {
        playSequentialMessages(
          [
            "After washing your face, how does it feel?",
          ],
          () => {
            setShowQuickReplies([
              "Tight and dry",
              "Oily all over",
              "Oily in T-zone, normal elsewhere",
              "Balanced and comfortable",
              "Red or irritated",
            ]);
          }
        );
      }, 300);
      return;
    }

    if (reply === "Show me my routine" || reply === "View my routine") {
      advanceState("ROUTINE_UPSELL");
      setShowQuickReplies([]);
      return;
    }

    if (reply === "Yes, let's go! 🚀") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      advanceState("SKIN_ANALYSIS");
      setShowQuickReplies([]);
      setTimeout(() => {
        playSequentialMessages(
          [
            "Let's find your skin type.",
            "How does your skin feel after washing?",
          ],
          () => {
            setShowQuickReplies([
              "Tight and dry",
              "Shiny all over",
              "Oily in T-zone only",
              "Comfortable and balanced",
            ]);
          }
        );
      }, 300);
      return;
    }

    if (reply === "Browse suggested products" || reply === "View products 🛍️") {
      advanceState("PRODUCT_RECOMMENDATION");
      setShowQuickReplies([]);
      setTimeout(() => {
        fetchProductRecommendations(skinType || "normal", skinConcerns.length > 0 ? skinConcerns : ["brightening"]);
      }, 500);
      return;
    }

    if (reply === "Buy a product 🛒") {
      markPurchased();
      addMessage(reply, true);
      addAIHistory("user", reply);
      addMessage(
        "Great choice! Adding products to your routine is the first step toward healthier skin.",
        false
      );
      setShowQuickReplies(["Ask more questions", "View my routine"]);
      return;
    }

    if (reply === "Tell me more" || reply === "Tell me more about that") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      setShowQuickReplies([]);
      const nextMode =
        state === "DR_SESI_DIAGNOSIS" || state === "REVEAL_SHINE"
          ? "doctor"
          : state === "PRODUCT_RECOMMENDATION" || state === "SKIN_ANALYSIS" || state === "PRODUCT_REQUEST"
          ? "product"
          : "baby";
      sendToAI("Can you tell me more about that?", nextMode);
      return;
    }

    if (reply === "That sounds right" || reply === "Yes, that's me ✅" || reply === "That's correct") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      setShowQuickReplies([]);
      const nextMode =
        state === "DR_SESI_DIAGNOSIS" || state === "REVEAL_SHINE"
          ? "doctor"
          : "baby";
      sendToAI("Yes, that's accurate. What's the next question?", nextMode);
      return;
    }

    if (reply === "Not quite" || reply === "Not really ❌" || reply === "I'm not sure 🤷" || reply === "I don't know 🤷") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      setShowQuickReplies([]);
      const nextMode =
        state === "DR_SESI_DIAGNOSIS" || state === "REVEAL_SHINE"
          ? "doctor"
          : "baby";
      sendToAI("I'm not sure that's accurate for me. Can you help clarify?", nextMode);
      return;
    }

    const mode =
      state === "DR_SESI_DIAGNOSIS" || state === "REVEAL_SHINE"
        ? "doctor"
        : state === "PRODUCT_RECOMMENDATION" || state === "SKIN_ANALYSIS" || state === "PRODUCT_REQUEST"
        ? "product"
        : "baby";
    sendToAI(reply, mode);
    setShowQuickReplies([]);
  };

  const handleSend = () => {
    if (!userInput.trim() || isTyping) return;
    const text = userInput.trim();
    setUserInput("");

    if (text.toLowerCase() === "skin test" || text.toLowerCase() === "skin assessment") {
      addMessage(text, true);
      addAIHistory("user", text);
      advanceState("DR_SESI_DIAGNOSIS");
      setTimeout(() => {
        playSequentialMessages(
          [
            "Let's begin your skin assessment. How would you describe your skin?",
          ],
          () => {
            setShowQuickReplies([
              "Dry and flaky",
              "Oily and shiny",
              "Combination",
              "Normal and healthy",
              "Sensitive and reactive",
              "I'm not sure",
            ]);
          }
        );
      }, 300);
      return;
    }

    if (
      text.toLowerCase().includes("suggest") ||
      text.toLowerCase().includes("recommend") ||
      text.toLowerCase().includes("product")
    ) {
      addMessage(text, true);
      addAIHistory("user", text);
      advanceState("PRODUCT_REQUEST");
      setShowQuickReplies([]);
      setTimeout(() => {
        playSequentialMessages(
          [
            "I'd be happy to suggest products for you.",
            "First, what's your skin type?",
          ],
          () => {
            setShowQuickReplies([
              "Oily",
              "Dry",
              "Combination",
              "Sensitive",
              "Normal",
              "Not sure",
            ]);
          }
        );
      }, 300);
      return;
    }

    const mode =
      state === "DR_SESI_DIAGNOSIS" || state === "REVEAL_SHINE"
        ? "doctor"
        : state === "PRODUCT_RECOMMENDATION" || state === "SKIN_ANALYSIS" || state === "PRODUCT_REQUEST"
        ? "product"
        : "baby";
    sendToAI(text, mode);
  };

  const renderMessageContent = (msg: {
    text: string;
    type: string;
    productId?: string;
  }) => {
    if (msg.type === "skin_test_cta") {
      return (
        <SkinTestCTA onClick={() => advanceState("DR_SESI_DIAGNOSIS")} />
      );
    }

    if (msg.type === "chart") {
      return <SesiRadarChart />;
    }

    if (msg.type === "product_prescription" && msg.productId) {
      const product = suggestedProducts.find((p) => p.id === msg.productId);
      if (product) {
        return <ProductPrescriptionCard product={product} />;
      }
    }

    if (msg.type === "product_recommendation" && msg.productId) {
      const product = suggestedProducts.find((p) => p.id === msg.productId);
      if (product) {
        return <ProductRecommendationCard product={product} />;
      }
    }

    return <p className="whitespace-pre-wrap">{msg.text}</p>;
  };

  const [isOnCooldown, setIsOnCooldown] = useState(false);

  useLayoutEffect(() => {
    if (cooldownExpiry) {
      const check = () => setIsOnCooldown(cooldownExpiry > Date.now());
      check();
      const interval = setInterval(check, 1000);
      return () => clearInterval(interval);
    } else {
      setIsOnCooldown(false);
    }
  }, [cooldownExpiry]);

  if (isOnCooldown) {
    return <CooldownScreen />;
  }

  const isDoctorMode = persona === "doctor";

  return (
    <div className="flex flex-col h-full relative">
      {isDoctorMode && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400/40 to-transparent"
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400/20 to-transparent"
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
              delay: 2,
            }}
          />
        </motion.div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar relative z-10">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`flex ${
                msg.fromUser ? "justify-end" : "justify-start"
              }`}
            >
              <div className="flex flex-col items-start gap-2 max-w-[90%]">
                {msg.gifUrl && !msg.fromUser && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="rounded-2xl overflow-hidden shadow-md border border-gray-100/50 w-28 h-28"
                  >
                    <img
                      src={msg.gifUrl}
                      alt="Sesi reaction"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                )}
                <div
                  className={`px-4 py-3 rounded-3xl text-sm leading-relaxed ${
                    msg.fromUser
                      ? isDoctorMode
                        ? "bg-teal-500/90 text-white rounded-br-md"
                        : "bg-pink-500/90 text-white rounded-br-md"
                      : msg.type === "routine_pivot"
                      ? "bg-gradient-to-r from-amber-100/90 to-orange-100/90 backdrop-blur-md text-amber-800 rounded-bl-md shadow-sm border border-amber-200/50 font-bold"
                      : msg.type === "product_recommendation"
                      ? "bg-white/80 backdrop-blur-md text-gray-800 rounded-bl-md shadow-sm border border-gray-100/50"
                      : "bg-white/80 backdrop-blur-md text-gray-800 rounded-bl-md shadow-sm border border-gray-100/50"
                  }`}
                >
                  {renderMessageContent(msg)}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div
              className={`px-4 py-3 bg-white/80 backdrop-blur-md rounded-3xl rounded-bl-md shadow-sm border border-gray-100/50 ${
                isDoctorMode ? "border-teal-100/50" : ""
              }`}
            >
              <Loader2
                className={`w-4 h-4 animate-spin ${
                  isDoctorMode ? "text-teal-400" : "text-gray-400"
                }`}
              />
            </div>
          </motion.div>
        )}

        {showQuickReplies.length > 0 && !isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2 pt-2"
          >
            {showQuickReplies.map((reply, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => handleQuickReply(reply)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border hover:bg-white/90 active:scale-95 transition-all text-left ${
                  isDoctorMode
                    ? "bg-teal-50/70 backdrop-blur-md border-teal-200/50"
                    : "bg-white/70 backdrop-blur-md border-gray-200/50"
                }`}
              >
                  <span
                    className={`text-sm font-medium ${
                      isDoctorMode ? "text-teal-700" : "text-gray-700"
                    }`}
                >
                  {reply}
                </span>
                <ChevronRight
                  className={`w-4 h-4 ml-auto ${
                    isDoctorMode ? "text-teal-400" : "text-gray-400"
                  }`}
                />
              </motion.button>
            ))}
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-3 border-t border-white/20 relative z-10">
        <div className="flex gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={
              state === "DR_SESI_DIAGNOSIS"
                ? "Tell Dr. Sesi about your skin..."
                : state === "PRODUCT_REQUEST"
                ? "What's your skin type?"
                : state === "SKIN_ANALYSIS"
                ? "Describe your skin after the test..."
                : state === "PRODUCT_RECOMMENDATION"
                ? "Ask about a product..."
                : "Type a message..."
            }
            className="flex-1 px-4 py-3 bg-white/60 backdrop-blur-md border border-gray-200/50 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300/50"
          />
          <button
            onClick={handleSend}
            disabled={isTyping || !userInput.trim()}
            className={`px-5 py-3 text-white rounded-2xl text-sm font-bold disabled:opacity-40 active:scale-95 transition-transform ${
              isDoctorMode
                ? "bg-teal-500 hover:bg-teal-600"
                : "bg-pink-500 hover:bg-pink-600"
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
