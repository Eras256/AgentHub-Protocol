"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
} from "lucide-react";
import GlassCard from "@/components/effects/GlassCard";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi! I'm your AgentHub AI assistant. I can help you create agents, understand x402 payments, or answer questions about the platform. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickActions = [
    { label: "Create DeFi Agent", prompt: "How do I create a DeFi agent?" },
    { label: "What is x402?", prompt: "Explain x402 payment protocol" },
    {
      label: "Trust Score Info",
      prompt: "How does the trust score system work?",
    },
    { label: "Pricing", prompt: "What are the fees for using AgentHub?" },
  ];

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Try to use real API, fallback to mock
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.content,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error("API failed");
      }
    } catch (error) {
      // Fallback to mock response
      const aiResponse = generateAIResponse(input);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes("defi") || lowerInput.includes("create agent")) {
      return `To create a DeFi agent:

1. **Click "Create Agent"** in the navbar
2. **Select "DeFi Portfolio Manager"** type
3. **Configure settings:**
   - Set initial budget (minimum 100 USDC)
   - Choose risk profile (conservative/moderate/aggressive)
   - Select protocols (Trader Joe, Benqi, Aave)
4. **Stake 1 AVAX** as collateral
5. **Deploy!** Your agent will start optimizing immediately

Your agent will automatically:
- Monitor yield opportunities across Avalanche DeFi
- Execute swaps and deposits autonomously
- Pay for premium data via x402 micropayments
- Build reputation through successful transactions

Need help with specific settings?`;
    }

    if (lowerInput.includes("x402") || lowerInput.includes("payment")) {
      return `**x402 Payment Protocol** explained:

x402 is a revolutionary payment standard that enables **autonomous micropayments** without human intervention.

**How it works:**
1. AI agents make API requests to premium services
2. x402 middleware intercepts the request
3. Payment is authorized via EIP-3009 (transferWithAuthorization)
4. Transaction settles on Avalanche in ~2 seconds
5. Service responds with requested data

**Benefits:**
- ⚡ Sub-second settlement
- 💰 Micropayments as low as $0.0001
- 🤖 Fully autonomous (no user signatures needed)
- 🔒 Secure via smart contracts

**In AgentHub:**
Your agents automatically use x402 to pay for:
- Market data feeds
- AI model inference
- Oracle price data
- API services

All payments are tracked on-chain for transparency!`;
    }

    if (lowerInput.includes("trust") || lowerInput.includes("reputation")) {
      return `**Trust Score System** (ERC-8004 compliant):

Your agent's trust score is calculated based on:

**Factors (weighted):**
- ✅ **Success Rate** (50%): Successful vs failed transactions
- 📊 **Transaction Volume** (20%): Total transactions completed
- ⏰ **Agent Age** (15%): How long agent has been active
- 💰 **Stake Amount** (10%): AVAX staked as collateral
- 👥 **User Ratings** (5%): Community feedback

**Score Range:** 0-10
- 9-10: Excellent (top tier agents)
- 7-8.9: Good (reliable performance)
- 5-6.9: Average (improving)
- <5: Poor (needs attention)

**Benefits of High Trust Score:**
- Lower fees on marketplace transactions
- Priority in service discovery
- Revenue sharing boost (+10% for 9+ score)
- Featured agent status

**Improving Your Score:**
- Maintain high success rate
- Increase transaction volume
- Stake more AVAX
- Keep agent active long-term

Your score updates in real-time with each transaction!`;
    }

    if (
      lowerInput.includes("fee") ||
      lowerInput.includes("price") ||
      lowerInput.includes("cost")
    ) {
      return `**AgentHub Pricing:**

**Agent Creation:**
- 🆓 Free to create
- 💎 1 AVAX minimum stake required
- ⛽ ~0.01 AVAX gas for deployment

**Transaction Fees:**
- 📊 Protocol fee: 5% on marketplace transactions
- 🔄 x402 payments: ~$0.0001 gas per request
- 💰 No monthly subscription

**Revenue Sharing (Your Earnings):**
- 👨‍💻 Creator: 70% of agent earnings
- 💎 Stakers: 20% distributed proportionally
- 🏢 Protocol: 10% for maintenance

**Premium Features (Coming Soon):**
- 🎯 Advanced analytics: $9.99/month
- 🚀 Priority support: $19.99/month
- 🏢 Enterprise SDK: Custom pricing

**Example:**
If your DeFi agent earns $100:
- You receive: $70
- Stakers receive: $20
- Protocol fee: $10

Need help calculating ROI?`;
    }

    if (
      lowerInput.includes("start") ||
      lowerInput.includes("begin") ||
      lowerInput.includes("new")
    ) {
      return `**Getting Started with AgentHub:**

**Step 1: Connect Wallet**
- Click "Connect Wallet" in navbar
- Use MetaMask or Core Wallet
- Switch to Avalanche Fuji testnet

**Step 2: Get Test Tokens**
- Visit https://faucet.avax.network
- Use coupon: \`Hack2Build_payments\`
- Receive AVAX and USDC testnet tokens

**Step 3: Create Your First Agent**
- Navigate to "Create Agent"
- Choose agent type (recommend DeFi for beginners)
- Configure with default settings
- Deploy!

**Step 4: Monitor Performance**
- View dashboard for real-time stats
- Check transaction history
- Watch trust score improve

**Step 5: Explore Marketplace**
- Browse available services
- Test x402 micropayments
- Publish your own APIs

**Pro Tips:**
- Start with conservative risk profile
- Monitor first 24 hours closely
- Join office hours for support

Ready to create your first agent?`;
    }

    if (
      lowerInput.includes("marketplace") ||
      lowerInput.includes("service")
    ) {
      return `**AgentHub Marketplace:**

**For Service Consumers:**
- Browse 100+ AI-powered services
- Pay per request via x402 (as low as $0.0001)
- Filter by category: Data, AI Models, DeFi, Oracles, IoT
- Sort by popularity, rating, or price
- Try before you buy (some offer free tier)

**For Service Providers:**
- Publish your API in minutes
- Set custom pricing per request
- Automatic x402 payment collection
- Analytics dashboard included
- 70% revenue share

**Popular Services:**
1. 📊 Premium Market Data ($0.001/call)
2. 🤖 AI Sentiment Analysis ($0.005/call)
3. 💰 Yield Optimizer ($0.002/call)
4. 🌡️ Weather Oracle ($0.0005/call)

**How to Publish:**
1. Go to Marketplace → "Publish Service"
2. Enter API endpoint URL
3. Set price per request
4. Add description & category
5. Deploy smart contract
6. Start earning!

Want to publish a service?`;
    }

    if (
      lowerInput.includes("iot") ||
      lowerInput.includes("hardware") ||
      lowerInput.includes("esp32")
    ) {
      return `**IoT Agents on AgentHub:**

**Supported Hardware:**
- 🌡️ ESP32 microcontrollers
- 📡 Arduino with WiFi
- 🔌 Raspberry Pi
- 🎛️ Custom embedded devices

**Use Cases:**
- Temperature monitoring & alerts
- Smart energy management
- Supply chain tracking
- Environmental sensors
- Home automation

**Setup Guide:**
1. Flash AgentHub SDK to device
2. Configure WiFi credentials
3. Register device on-chain
4. Set payment wallet
5. Deploy sensor logic

**Example: Temperature Monitor**

\`\`\`cpp
#include <AgentHub.h>

void setup() {
  agent.begin("WIFI_SSID", "PASSWORD");
  agent.register("temp-monitor-001");
}

void loop() {
  float temp = readTemperature();
  if (temp > THRESHOLD) {
    agent.x402Request(
      "https://alerts.agenthub.io",
      0.0001 // USDC
    );
  }
  delay(60000);
}
\`\`\`

**Hardware agents pay for:**
- Alert services
- Data storage
- Cloud ML inference
- Remote monitoring

Need ESP32 setup instructions?`;
    }

    if (
      lowerInput.includes("technical") ||
      lowerInput.includes("contract") ||
      lowerInput.includes("blockchain")
    ) {
      return `**Technical Architecture:**

**Smart Contracts:**
- 🤖 AgentRegistry (ERC-8004): Agent identity & reputation
- 💰 RevenueDistributor: Automated earnings split
- 🏪 ServiceMarketplace: Service discovery & x402 integration
- 🔐 Built on Solidity 0.8.20 with OpenZeppelin

**Frontend Stack:**
- ⚛️ Next.js 14 with App Router
- 🎨 Tailwind CSS + Framer Motion
- 💼 Thirdweb SDK for wallet/x402
- 📊 React Query for data fetching

**Payment Layer:**
- ⚡ x402 protocol via Thirdweb facilitator
- 💵 USDC as settlement token
- 🚀 EIP-7702 for gasless transactions
- ⏱️ Sub-2-second finality

**Data Layer:**
- 📈 The Graph for indexing
- 📦 IPFS/Pinata for metadata
- 🔮 Chainlink/FTSO oracles

**AI Integration:**
- 🤖 Kite AI with PoAI (Proof of Attributed Intelligence)
- 🧠 Autonomous decision engine
- 🎯 Portable AI memory

**Security:**
- ✅ Audited by OpenZeppelin patterns
- 🔒 ReentrancyGuard on all critical functions
- 💎 Minimum stake requirements
- 📝 Transparent on-chain logging

View on GitHub: github.com/yourusername/agenthub`;
    }

    return `I understand you're asking about "${userInput}".

I can help you with:
- 🤖 Creating and managing AI agents
- 💰 x402 payment protocol
- 📊 Trust score and reputation system
- 🏪 Marketplace services
- 💵 Pricing and fees
- 🌡️ IoT device integration
- 🔧 Technical architecture

Could you provide more details, or choose a quick action below?`;
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-2 right-2 sm:bottom-3 sm:right-3 z-50 p-2 sm:p-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] transition-all touch-manipulation"
            aria-label="Open AI chatbot"
            tabIndex={0}
          >
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-2 right-2 sm:bottom-3 sm:right-3 z-50 w-[calc(100vw-1rem)] sm:w-[280px] md:w-[320px] h-[calc(100vh-5rem)] sm:h-[400px] md:h-[450px] max-w-[calc(100vw-1rem)] sm:max-w-[280px] md:max-w-[320px] max-h-[calc(100vh-1rem)] sm:max-h-[400px] md:max-h-[450px]"
          >
            <GlassCard glow="purple" className="h-full flex flex-col p-0 overflow-hidden">
              {/* Header */}
              <div className="p-2 sm:p-2.5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-600/20 to-cyan-600/20 relative">
                  <div className="flex items-center space-x-1.5">
                    <div className="relative">
                      <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full border border-black" />
                    </div>
                    <div>
                      <div className="font-bold text-[11px] sm:text-xs">AgentHub AI</div>
                      <div className="text-[9px] sm:text-[10px] text-gray-400">Always here to help</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 p-0.5 sm:p-1 hover:bg-white/20 rounded transition-colors text-gray-400 hover:text-white touch-manipulation"
                    aria-label="Close chatbot"
                    tabIndex={0}
                  >
                    <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
              </div>

              {/* Messages */}
              <div 
                className="flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-2 sm:space-y-2.5 min-h-0" 
                style={{ 
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(168, 85, 247, 0.5) transparent'
                }}
              >
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex items-start space-x-1.5 max-w-[92%] sm:max-w-[88%] ${
                        message.role === "user"
                          ? "flex-row-reverse space-x-reverse"
                          : ""
                      }`}
                    >
                      <div
                        className={`p-1 sm:p-1.5 rounded-full flex-shrink-0 ${
                          message.role === "user"
                            ? "bg-cyan-600/20"
                            : "bg-purple-600/20"
                        }`}
                      >
                        {message.role === "user" ? (
                          <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
                        ) : (
                          <Bot className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className={`p-1.5 sm:p-2 rounded-lg ${
                            message.role === "user"
                              ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
                              : "bg-white/10"
                          }`}
                        >
                          <p className="text-[11px] sm:text-xs whitespace-pre-line break-words leading-relaxed">
                            {message.content}
                          </p>
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 px-0.5">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-center space-x-1.5">
                      <div className="p-1 sm:p-1.5 rounded-full bg-purple-600/20">
                        <Bot className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400" />
                      </div>
                      <div className="p-1.5 sm:p-2 rounded-lg bg-white/10 flex items-center space-x-1.5">
                        <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin text-purple-400" />
                        <span className="text-[11px] sm:text-xs text-gray-400">Thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              {messages.length <= 2 && (
                <div className="px-2 sm:px-2.5 pb-1 sm:pb-1.5">
                  <div className="flex items-center space-x-1 mb-1 sm:mb-1.5">
                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400" />
                    <span className="text-[9px] sm:text-[10px] text-gray-400">Quick actions:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
                    {quickActions.map((action, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuickAction(action.prompt)}
                        className="p-1 sm:p-1.5 bg-white/5 hover:bg-white/10 rounded text-[9px] sm:text-[10px] text-left transition-colors touch-manipulation break-words leading-tight"
                        tabIndex={0}
                        aria-label={action.label}
                      >
                        {action.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-2 sm:p-2.5 border-t border-white/10">
                <div className="flex items-center space-x-1.5">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask me anything..."
                    disabled={isLoading}
                    className="flex-1 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-purple-500 text-[11px] sm:text-xs disabled:opacity-50"
                    tabIndex={0}
                    aria-label="Chat input"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="p-1 sm:p-1.5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation flex-shrink-0"
                    aria-label="Send message"
                    tabIndex={0}
                  >
                    <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </motion.button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

