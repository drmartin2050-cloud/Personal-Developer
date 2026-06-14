import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Calculator, 
  Coins, 
  HelpCircle, 
  TrendingUp, 
  DollarSign, 
  ArrowRightLeft, 
  Sparkles,
  Info
} from "lucide-react";
import { LocalizationSchema, Language } from "../types";
import { countTokens } from "../lib/tokenCounter";
import { PRICING_TABLE, calculateCost } from "../lib/pricing";
import { getExchangeRates, convertCurrency, formatCurrency, FALLBACK_RATES, ExchangeRates } from "../lib/currency";

interface CalculatorViewProps {
  key?: string;
  t: LocalizationSchema["calculator"];
  lang: Language;
}

export default function CalculatorView({ t, lang }: CalculatorViewProps) {
  // Input fields
  const [inputText, setInputText] = useState("");
  const [estimatedOutput, setEstimatedOutput] = useState(150); // slider for output tokens
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [baselineModel, setBaselineModel] = useState("gpt-4o");

  // Calculated tokens
  const [inputTokens, setInputTokens] = useState(0);
  const [outputTokens, setOutputTokens] = useState(150);
  const [totalTokens, setTotalTokens] = useState(150);

  // Exchange rates
  const [rates, setRates] = useState<ExchangeRates>(FALLBACK_RATES);
  const [usingFallback, setUsingFallback] = useState(false);

  // Fetch exchange rates on load
  useEffect(() => {
    getExchangeRates()
      .then((data) => {
        setRates(data);
        setUsingFallback(false);
      })
      .catch(() => {
        setRates(FALLBACK_RATES);
        setUsingFallback(true);
      });
  }, []);

  // Recalculate input tokens when text changes
  useEffect(() => {
    const calculated = countTokens(inputText);
    setInputTokens(calculated);
  }, [inputText]);

  // Sync state variables
  useEffect(() => {
    setOutputTokens(estimatedOutput);
    setTotalTokens(inputTokens + estimatedOutput);
  }, [inputTokens, estimatedOutput]);

  const selectedPricing = PRICING_TABLE[selectedModel] || PRICING_TABLE["gpt-4o-mini"];
  const baselinePricing = PRICING_TABLE[baselineModel] || PRICING_TABLE["gpt-4o"];

  // Compute costs
  const selectedCostUsd = calculateCost(selectedModel, inputTokens, outputTokens);
  const baselineCostUsd = calculateCost(baselineModel, inputTokens, outputTokens);

  // Compute savings
  const savedUsd = Math.max(0, baselineCostUsd - selectedCostUsd);
  const isSavingPositive = baselineCostUsd > selectedCostUsd;

  // Convert costs
  const selectedConverted = convertCurrency(selectedCostUsd, rates);
  const savedConverted = convertCurrency(savedUsd, rates);

  return (
    <div id="calculator-root" className="space-y-6 max-w-6xl mx-auto" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Intro Header */}
      <div id="calc-header-banner" className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-950 via-slate-900 to-zinc-950 p-6 sm:p-8 border border-zinc-805/60">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl animate-pulse" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/10 border border-sky-450/20 text-sky-400 text-xs font-mono font-bold rounded-full">
            <Calculator className="h-4 w-4 text-sky-400" />
            <span>{lang === "ar" ? "أدوات موازنة الحوسبة والميزانية" : "BUDGETING & TOKEN ESTIMATOR"}</span>
          </div>
          <h1 id="calc-title" className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t.title}
          </h1>
          <p id="calc-subtitle" className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
            {t.subtitle}
          </p>
        </div>
      </div>

      {usingFallback && (
        <div id="exchange-fallback-warn" className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400 flex items-center gap-2">
          <Info className="h-4 w-4" />
          <span>{t.errExchange}</span>
        </div>
      )}

      {/* Main Grid */}
      <div id="calc-grid-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Control Panel Column */}
        <div id="calc-controls-col" className="lg:col-span-7 space-y-6">
          <div id="calc-input-card" className="bg-zinc-950 border border-zinc-805 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="token-text-input" className="text-md font-bold text-zinc-200 flex items-center gap-2">
                <Coins className="h-4 w-4 text-sky-400" />
                {t.inputLabel}
              </label>
              <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded">
                {lang === "ar" ? `الأحرف: ${inputText.length}` : `Chars: ${inputText.length}`}
              </span>
            </div>
            
            <textarea
              id="token-text-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.placeholder}
              rows={5}
              className="w-full bg-zinc-90 w-full rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 font-sans text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-all leading-relaxed"
            />

            {/* Model Matchers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label htmlFor="model-select" className="text-xs font-semibold text-zinc-400 block">
                  {t.modelLabel}
                </label>
                <select
                  id="model-select"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-250 font-semibold focus:outline-none focus:border-sky-500 cursor-pointer text-white"
                >
                  {Object.entries(PRICING_TABLE).map(([id, item]) => (
                    <option key={id} value={id}>
                      {item.name} ({item.provider})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="baseline-select" className="text-xs font-semibold text-zinc-400 block">
                  {t.baselineLabel}
                </label>
                <select
                  id="baseline-select"
                  value={baselineModel}
                  onChange={(e) => setBaselineModel(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-250 font-semibold focus:outline-none focus:border-sky-500 cursor-pointer text-white"
                >
                  {Object.entries(PRICING_TABLE).map(([id, item]) => (
                    <option key={id} value={id}>
                      {item.name} ({item.provider})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Simulated Output Slider */}
            <div className="space-y-3 pt-4 border-t border-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">
                  {lang === "ar" ? "حجم مخرجات الرد التقديرية (Output Size)" : "Estimated Output Generation Size"}
                </span>
                <span className="text-xs font-bold font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded">
                  {estimatedOutput} {lang === "ar" ? "رمز" : "tokens"}
                </span>
              </div>
              <input
                id="output-tokens-slider"
                type="range"
                min={10}
                max={4000}
                step={10}
                value={estimatedOutput}
                onChange={(e) => setEstimatedOutput(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>10 tkn</span>
                <span>1,500 tkn</span>
                <span>4,000 tkn</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Dashboard Display Column */}
        <div id="calc-display-col" className="lg:col-span-5 space-y-6">
          <div id="calc-results-card" className="bg-zinc-950 border border-zinc-805 rounded-2xl p-6 space-y-6">
            <h3 id="panel-title" className="text-md font-extrabold text-zinc-200 border-b border-zinc-900 pb-3 flex items-center gap-2">
              <Coins className="h-4 w-4 text-sky-400" />
              {t.resultsTitle}
            </h3>

            {/* Token Numbers */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-900 text-center">
                <span className="text-[10px] text-zinc-450 uppercase font-bold block">{t.inputTokens}</span>
                <span className="text-xl font-mono font-extrabold text-sky-400 mt-1 block">{inputTokens}</span>
              </div>
              <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-900 text-center">
                <span className="text-[10px] text-zinc-450 uppercase font-bold block">{t.outputTokens}</span>
                <span className="text-xl font-mono font-extrabold text-indigo-400 mt-1 block">{outputTokens}</span>
              </div>
              <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-900 text-center">
                <span className="text-[10px] text-zinc-450 uppercase font-bold block">{t.totalTokens}</span>
                <span className="text-xl font-mono font-extrabold text-white mt-1 block">{totalTokens}</span>
              </div>
            </div>

            {/* Price Lists in 4 currencies */}
            <div className="space-y-3.5 bg-zinc-900/30 p-4 rounded-xl border border-zinc-850">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-bold border-b border-zinc-900 pb-2">
                <span>{lang === "ar" ? `سعر ${selectedPricing.name}` : `${selectedPricing.name} Cost`}</span>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">{selectedPricing.provider}</span>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400 flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5 text-zinc-500" />
                    {t.costUsd}
                  </span>
                  <span className="font-mono font-extrabold text-white">
                    {formatCurrency(selectedConverted.USD, "USD", lang)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400 flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-500 font-mono">ج.م</span>
                    {t.costEgp}
                  </span>
                  <span className="font-mono font-extrabold text-sky-400">
                    {formatCurrency(selectedConverted.EGP, "EGP", lang)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400 flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-500">€</span>
                    {t.costEur}
                  </span>
                  <span className="font-mono font-semibold text-zinc-300">
                    {formatCurrency(selectedConverted.EUR, "EUR", lang)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400 flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-500">¥</span>
                    {t.costCny}
                  </span>
                  <span className="font-mono font-semibold text-zinc-300">
                    {formatCurrency(selectedConverted.CNY, "CNY", lang)}
                  </span>
                </div>
              </div>
            </div>

            {/* Savings Indicator */}
            {isSavingPositive ? (
              <motion.div 
                id="savings-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 animate-bounce" />
                    {t.savingsLabel}
                  </span>
                  <span className="text-[9px] uppercase font-mono font-black tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                    {lang === "ar" ? "أقل تكلفة" : "MORE OPTIMIZED"}
                  </span>
                </div>
                
                <p className="text-xs text-emerald-300 leading-relaxed font-semibold">
                  {t.savingHighlight.replace(
                    "{value}", 
                    `${formatCurrency(savedConverted.USD, "USD", lang)} (${formatCurrency(savedConverted.EGP, "EGP", lang)})`
                  )}
                </p>

                <div className="text-[10px] text-zinc-450 border-t border-emerald-500/10 pt-2 flex justify-between items-center">
                  <span>{lang === "ar" ? `بالمقارنة مع: ${baselinePricing.name}` : `Compared against: ${baselinePricing.name}`}</span>
                  <span className="font-mono">{baselinePricing.inputCostPerMillion > selectedPricing.inputCostPerMillion ? "✓ Good choice" : ""}</span>
                </div>
              </motion.div>
            ) : (
              <div id="no-savings-card" className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs text-zinc-400 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-zinc-450" />
                  {lang === "ar" ? "النموذج المرجعي متكافئ أو أرخص" : "Alternative matches baseline cost structure"}
                </span>
                <p className="text-[11px] text-zinc-500">
                  {lang === "ar" 
                    ? "النموذج الذي اخترته متطابق في التكلفة أو قد يكون أكثر تكلفة من المرجعي. اختر طرازاً مرجعياً أعلى لإجراء مقارنة مالية."
                    : "The model you are testing matches or exceeds baseline pricing parameters. Choose a larger baseline like GPT-4o for savings evaluations."
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
