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

const MAX_QUESTIONS_BEFORE_COOLDOWN = 5;

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
    if (state === "PLAYFUL_FRIEND" && messages.length === 0) {
      playSequentialMessages(
        [
          "Hiiiii! I'm Sesi! Your personal skin bestie! 👋✨",
          "I'm here to help you discover your perfect skincare routine! 💖",
        ],
        () => {
          setShowQuickReplies([
            "Suggest me products 💡",
            "What's a skin test? 🤔",
            "Maybe later",
          ]);
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
        setTimeout(sendNext, 1200);
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
          `Yay! I found ${products.length} perfect products for your ${type.toLowerCase()} skin! ✨🎁\n\nHere's your personalized routine:`,
          false,
          "product_recommendation"
        );

        products.forEach((product, i) => {
          addMessage(
            `${i + 1}. ${product.name} — ${product.skinTypes.join(", ")}\n\nFor: ${product.concerns.join(", ") || "All skin types"}\nPrice: ${product.price}`,
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
            `💡 How to use your products:\n\n${howToUse}\n\nShine shine shine! Your skin is going to love these! ✨💖`,
            false
          );
        } else {
          addMessage(
            `💡 Quick routine:\n\n☀️ Morning: Cleanse → Treatment → Moisturizer → SPF\n🌙 Night: Cleanse → Treatment → Night Cream\n\nShine shine shine! ✨💖`,
            false
          );
        }

        setShowQuickReplies([
          "View product details 🔍",
          "More suggestions 🔄",
          "Save my routine 💾",
        ]);
    } else {
      addMessage(
        "Hmm, I couldn't find perfect matches right now... but don't worry! Let me suggest something else! ✨",
        false
      );
      setShowQuickReplies(["Try different skin type 🔄", "Ask Sesi anything 💬"]);
    }
      addMessage(
        "eee! Sesi is having trouble finding products... try again! ✨",
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
        "eee! Dr. Sesi has helped you a lot today! 💖 Before I go rest, let me suggest some perfect products for you! ✨🎁",
        false
      );

      setTimeout(() => {
        fetchProductRecommendations(skinType || "normal", skinConcerns.length > 0 ? skinConcerns : ["brightening"]);
      }, 1000);

      setTimeout(() => {
        addMessage(
          "Dr. Sesi will look after you after 24 hours! Buy one of these suggestions or check 'My Routine' and I'll be back! Bye bye! 👋💖",
          false,
          "cooldown"
        );
        setShowQuickReplies(["See my routine 💆‍♀️", "View products 🛍️"]);
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

      addMessage(data.text, false);
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
                "Wait! eee! 🛑 To make this work best, use this too! Shine shine shine! 💎",
                false,
                "routine_pivot"
              );
              setShowQuickReplies(["Show me my routine! ✨", "Tell me more"]);
            }, 5000);
          }
        }, 5000);
      }

      if (state === "DR_SESI_DIAGNOSIS" && !showQuickReplies.length) {
        setShowQuickReplies([
          "I don't know... 🤷",
          "Can you explain? 📖",
          "Next question",
        ]);
      }
    } catch {
      addMessage(
        "eee! Sesi is having trouble thinking... try again! ✨",
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
        "No rush! I'll be here whenever you're ready to glow! 💖✨",
        false
      );
      setShowQuickReplies([]);
      return;
    }

    if (reply === "Suggest me products 💡") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      advanceState("PRODUCT_REQUEST");
      setShowQuickReplies([]);
      setTimeout(() => {
        playSequentialMessages(
          [
            "Yay! Let's find your perfect products! 🎁✨",
            "First, what's your skin type?",
          ],
          () => {
            setShowQuickReplies([
              "Oily ✨",
              "Dry 🏜️",
              "Combination 🌗",
              "Sensitive 🤧",
              "Normal 😊",
              "I don't know 🤷",
            ]);
          }
        );
      }, 300);
      return;
    }

    if (reply === "I don't know 🤷") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      advanceState("SKIN_ANALYSIS");
      setShowQuickReplies([]);
      setTimeout(() => {
        playSequentialMessages(
          [
            "No worries! Let's do a quick test! 🧪✨",
            "Wash your face, wait 30 minutes, then tell me: How does your skin feel?",
          ],
          () => {
            setShowQuickReplies([
              "Tight & dry 🏜️",
              "Shiny everywhere ✨",
              "Oily in T-zone only 🌗",
              "Comfortable & soft 😊",
              "Red & itchy 🤧",
            ]);
          }
        );
      }, 300);
      return;
    }

    if (
      ["Oily ✨", "Dry 🏜️", "Combination 🌗", "Sensitive 🤧", "Normal 😊"].includes(
        reply
      )
    ) {
      addMessage(reply, true);
      addAIHistory("user", reply);

      const typeMap: Record<string, string> = {
        "Oily ✨": "oily",
        "Dry 🏜️": "dry",
        "Combination 🌗": "combination",
        "Sensitive 🤧": "sensitive",
        "Normal 😊": "normal",
      };
      setSkinType(typeMap[reply] || "normal");

      setShowQuickReplies([]);
      setTimeout(() => {
        addMessage(
          "Great! What are your main skin concerns? (pick one or more below)",
          false
        );
        setShowQuickReplies([
          "Acne 😣",
          "Dark spots 🌑",
          "Anti-aging ⏳",
          "Dull skin 💤",
          "Pores 🔍",
          "No concerns, just glow! ✨",
        ]);
      }, 500);
      return;
    }

    if (
      ["Acne 😣", "Dark spots 🌑", "Anti-aging ⏳", "Dull skin 💤", "Pores 🔍", "No concerns, just glow! ✨"].includes(
        reply
      )
    ) {
      addMessage(reply, true);
      addAIHistory("user", reply);

      const concernMap: Record<string, string> = {
        "Acne 😣": "acne",
        "Dark spots 🌑": "dark spot",
        "Anti-aging ⏳": "aging",
        "Dull skin 💤": "dull",
        "Pores 🔍": "pores",
        "No concerns, just glow! ✨": "brightening",
      };
      setSkinConcerns([concernMap[reply] || "brightening"]);

      setShowQuickReplies([]);
      setTimeout(() => {
        addMessage("Analyzing your skin profile... 🧪✨", false);
        setTimeout(() => {
          fetchProductRecommendations(skinType || "normal", [
            concernMap[reply] || "brightening",
          ]);
        }, 1500);
      }, 300);
      return;
    }

    if (
      ["Tight & dry 🏜️", "Shiny everywhere ✨", "Oily in T-zone only 🌗", "Comfortable & soft 😊", "Red & itchy 🤧"].includes(
        reply
      )
    ) {
      addMessage(reply, true);
      addAIHistory("user", reply);

      const testMap: Record<string, string> = {
        "Tight & dry 🏜️": "dry",
        "Shiny everywhere ✨": "oily",
        "Oily in T-zone only 🌗": "combination",
        "Comfortable & soft 😊": "normal",
        "Red & itchy 🤧": "sensitive",
      };
      const detectedType = testMap[reply] || "normal";
      setSkinType(detectedType);

      setShowQuickReplies([]);
      setTimeout(() => {
        playSequentialMessages(
          [
            `Based on your test, you have ${detectedType} skin! 🎯`,
            "Now let's find your perfect products! What's your main concern?",
          ],
          () => {
            setShowQuickReplies([
              "Acne 😣",
              "Dark spots 🌑",
              "Anti-aging ⏳",
              "Dull skin 💤",
              "Just glow! ✨",
            ]);
          }
        );
      }, 500);
      return;
    }

    if (reply === "View product details 🔍") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      if (suggestedProducts.length > 0) {
        const first = suggestedProducts[0];
        addMessage(
          `Check out ${first.name}! It's perfect for your skin. Click "View Product" to see full details and add to cart! 🛍️✨`,
          false
        );
      }
      setShowQuickReplies(["Save my routine 💾", "More suggestions 🔄"]);
      return;
    }

    if (reply === "More suggestions 🔄") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      setShowQuickReplies([]);
      setTimeout(() => {
        fetchProductRecommendations(skinType || "normal", skinConcerns);
      }, 500);
      return;
    }

    if (reply === "Save my routine 💾") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      addMessage(
        "Your routine is saved! Follow it daily for the best glow! ✨💖\n\nMorning: Cleanse → Treat → Moisturize → SPF\nNight: Cleanse → Treat → Night Cream",
        false
      );
      setShowQuickReplies(["Ask more questions 💬", "Done for now 👋"]);
      return;
    }

    if (reply === "What's a skin test? 🤔") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      addMessage(
        "A skin test is like a magic check-up for your skin! eee! It helps me understand what your skin needs to be happy! 🌸",
        false
      );
      setShowQuickReplies(["Let's do it! ✨", "Suggest products instead 💡"]);
      return;
    }

    if (reply === "Not now") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      addMessage(
        "That's okay! Just tap me when you're ready for a glow up! 💖",
        false
      );
      setShowQuickReplies([]);
      return;
    }

    if (reply === "Let's do it! ✨") {
      advanceState("DR_SESI_DIAGNOSIS");
      setShowQuickReplies([]);
      setTimeout(() => {
        playSequentialMessages(
          [
            "Okay... let me put on my special doctor glasses! 👓",
            "Dr. Sesi is here! Let's start your skin check-up! First question: How does your skin feel right now? 💧",
          ],
          () => {
            setShowQuickReplies([
              "Dry and tight 🏜️",
              "Oily and shiny ✨",
              "Comfortable 😊",
              "I don't know 🤷",
            ]);
          }
        );
      }, 300);
      return;
    }

    if (reply === "Show me my routine! ✨") {
      advanceState("ROUTINE_UPSELL");
      setShowQuickReplies([]);
      return;
    }

    if (reply === "Yes, let's go! 🚀") {
      addMessage(reply, true);
      addAIHistory("user", reply);
      advanceState("DR_SESI_DIAGNOSIS");
      setShowQuickReplies([]);
      setTimeout(() => {
        playSequentialMessages(
          [
            "Yay! Let me put on my doctor glasses! 👓✨",
            "Dr. Sesi is here! Tell me: how does your skin feel right now?",
          ],
          () => {
            setShowQuickReplies([
              "Dry and tight 🏜️",
              "Oily and shiny ✨",
              "Comfortable 😊",
              "I don't know 🤷",
            ]);
          }
        );
      }, 300);
      return;
    }

    if (reply === "View products 🛍️") {
      advanceState("PRODUCT_RECOMMENDATION");
      setShowQuickReplies([]);
      setTimeout(() => {
        fetchProductRecommendations(skinType || "normal", skinConcerns.length > 0 ? skinConcerns : ["brightening"]);
      }, 500);
      return;
    }

    if (reply === "See my routine 💆‍♀️") {
      advanceState("ROUTINE_UPSELL");
      setShowQuickReplies([]);
      return;
    }

    if (reply === "Buy a product 🛒") {
      markPurchased();
      addMessage(reply, true);
      addAIHistory("user", reply);
      addMessage(
        "Yay! You made a great choice! 💖 Dr. Sesi is so happy! Your skin is going to shine shine shine! ✨🎁",
        false
      );
      setShowQuickReplies(["Ask more questions 💬", "See my routine 💆‍♀️"]);
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

    if (text.toLowerCase() === "skin test") {
      addMessage(text, true);
      addAIHistory("user", text);
      advanceState("DR_SESI_DIAGNOSIS");
      setTimeout(() => {
        playSequentialMessages(
          [
            "Ooooh! Let's start! First: how does your skin feel?",
          ],
          () => {
            setShowQuickReplies([
              "Dry 🏜️",
              "Oily ✨",
              "Normal 😊",
              "Sensitive 🤧",
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
            "Yay! Let's find your perfect products! 🎁✨",
            "First, what's your skin type?",
          ],
          () => {
            setShowQuickReplies([
              "Oily ✨",
              "Dry 🏜️",
              "Combination 🌗",
              "Sensitive 🤧",
              "Normal 😊",
              "I don't know 🤷",
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
              <div
                className={`max-w-[90%] px-4 py-3 rounded-3xl text-sm leading-relaxed ${
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
