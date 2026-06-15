import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calculator, 
  Coins, 
  TrendingUp, 
  DollarSign, 
  Info, 
  ArrowUp,
  Sparkles,
  BarChart3
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
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
  const savingsPct = baselineCostUsd > 0 ? (savedUsd / baselineCostUsd) * 100 : 0;

  // Convert costs
  const selectedConverted = convertCurrency(selectedCostUsd, rates);
  const savedConverted = convertCurrency(savedUsd, rates);

  // Recharts pricing comparison list data
  const chartData = [
    {
      name: selectedPricing.name,
      cost: Number(selectedCostUsd.toFixed(6)),
      color: "#6366f1"
    },
    {
      name: baselinePricing.name,
      cost: Number(baselineCostUsd.toFixed(6)),
      color: "#8b5cf6"
    }
  ];

  return (
    <div id="calculator-root" className="space-y-6 max-w-6xl mx-auto select-none" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Intro Header */}
      <div id="calc-header-banner" className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-3d-flat card-persp card-persp-hover">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-mono font-black rounded-full shadow-3xs uppercase">
            <Calculator className="h-4 w-4 text-indigo-600 shrink-0" />
            <span>{lang === "ar" ? "موازنة الحوسبة والميزانية" : "BUDGETING & TOKEN ESTIMATOR"}</span>
          </div>
          <h1 id="calc-title" className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight text-sans">
            {t.title}
          </h1>
          <p id="calc-subtitle" className="text-sm text-slate-500 font-semibold max-w-2xl leading-relaxed">
            {t.subtitle}
          </p>
        </div>
      </div>

      {usingFallback && (
        <div id="exchange-fallback-warn" className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-700 flex items-center gap-2.5 font-bold shadow-3xs">
          <Info className="h-4 w-4 text-amber-600 shrink-0" />
          <span>{t.errExchange}</span>
        </div>
      )}

      {/* Main Grid containing forms & counters */}
      <div id="calc-grid-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Control Panel Column */}
        <div id="calc-controls-col" className="lg:col-span-7 space-y-6">
          <div id="calc-input-card" className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-3d-flat card-persp card-persp-hover">
            <div className="flex items-center justify-between">
              <label htmlFor="token-text-input" className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                <Coins className="h-4.5 w-4.5 text-indigo-600" />
                {t.inputLabel}
              </label>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-205 font-black uppercase">
                {lang === "ar" ? `الأحرف: ${inputText.length}` : `Chars: ${inputText.length}`}
              </span>
            </div>
            
            <textarea
              id="token-text-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.placeholder}
              rows={5}
              className="w-full text-slate-850 bg-slate-50 border border-slate-205 rounded-2xl p-4 font-sans text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-505 focus:ring-1 focus:ring-indigo-500/10 transition-colors leading-relaxed font-semibold block"
            />

            {/* Model Matchers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 font-semibold">
              <div className="space-y-1.5">
                <label htmlFor="model-select" className="text-xs font-black text-slate-400 block uppercase tracking-wider">
                  {t.modelLabel}
                </label>
                <select
                  id="model-select"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 font-extrabold focus:outline-none focus:border-indigo-500 cursor-pointer shadow-3xs"
                >
                  {Object.entries(PRICING_TABLE).map(([id, item]) => (
                    <option key={id} value={id}>
                      {item.name} ({item.provider})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="baseline-select" className="text-xs font-black text-slate-400 block uppercase tracking-wider">
                  {t.baselineLabel}
                </label>
                <select
                  id="baseline-select"
                  value={baselineModel}
                  onChange={(e) => setBaselineModel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 font-extrabold focus:outline-none focus:border-indigo-500 cursor-pointer shadow-3xs"
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
            <div className="space-y-3.5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-500">
                  {lang === "ar" ? "حجم مخرجات الرد التقديرية (Output Size)" : "Estimated Output Generation Size"}
                </span>
                <span className="text-xs font-mono text-indigo-650 bg-indigo-50 border border-indigo-100 px-3 py-0.5 rounded-lg font-black">
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
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 font-semibold uppercase">
                <span>10 tkn</span>
                <span>2,000 tkn</span>
                <span>4,000 tkn</span>
              </div>
            </div>
          </div>

          {/* 3D cost visual comparison Recharts */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-3d-flat card-persp card-persp-hover">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-2 uppercase tracking-wider border-b border-slate-100 pb-3">
              <BarChart3 className="h-4.5 w-4.5 text-indigo-555" />
              <span>{lang === "ar" ? "تحليل التكلفة والمقارنة ثلاثية الأبعاد" : "Cost Analysis Comparisons Visualization"}</span>
            </h4>
            
            <div className="h-[155px] w-full font-mono text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                >
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "11px", fontWeight: "bold" }}
                    formatter={(value: any) => [`$${value}`, "Total USD Cost"]} 
                  />
                  <Bar dataKey="cost" radius={[8, 8, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Dashboard Display Column */}
        <div id="calc-display-col" className="lg:col-span-5 space-y-6">
          <div id="calc-results-card" className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-3d-flat card-persp select-none">
            <h3 id="panel-title" className="text-sm font-black text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2 uppercase">
              <Coins className="h-4.5 w-4.5 text-indigo-600" />
              {t.resultsTitle}
            </h3>

            {/* Token Numbers with subtle zoom in effects to simulate "3D counters" */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-200 text-center shadow-3xs card-persp card-persp-hover">
                <span className="text-[9px] text-slate-450 uppercase font-black block">{t.inputTokens}</span>
                <span className="text-base font-mono font-black text-indigo-600 mt-1 block tracking-tight">{inputTokens}</span>
              </div>
              <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-200 text-center shadow-3xs card-persp card-persp-hover">
                <span className="text-[9px] text-slate-450 uppercase font-black block">{t.outputTokens}</span>
                <span className="text-base font-mono font-black text-cyan-600 mt-1 block tracking-tight">{outputTokens}</span>
              </div>
              <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-200 text-center shadow-3xs card-persp card-persp-hover">
                <span className="text-[9px] text-slate-450 uppercase font-black block">{t.totalTokens}</span>
                <span className="text-base font-mono font-black text-slate-800 mt-1 block tracking-tight">{totalTokens}</span>
              </div>
            </div>

            {/* Price Lists in 4 currencies */}
            <div className="space-y-3.5 bg-slate-50/50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-505 font-black border-b border-slate-100 pb-2">
                <span>{lang === "ar" ? `سعر ${selectedPricing.name}` : `${selectedPricing.name} Cost`}</span>
                <span className="text-[9px] font-black font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg uppercase">{selectedPricing.provider}</span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-extrabold flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                    {t.costUsd}
                  </span>
                  <span className="font-mono font-black text-slate-850">
                    {formatCurrency(selectedConverted.USD, "USD", lang)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-extrabold flex items-center gap-2">
                    <span className="text-xs font-black text-slate-400 font-sans">EGP</span>
                    {t.costEgp}
                  </span>
                  <span className="font-mono font-black text-indigo-650">
                    {formatCurrency(selectedConverted.EGP, "EGP", lang)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-extrabold flex items-center gap-2">
                    <span className="text-xs font-black text-slate-400">€</span>
                    {t.costEur}
                  </span>
                  <span className="font-mono font-black text-slate-700">
                    {formatCurrency(selectedConverted.EUR, "EUR", lang)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-extrabold flex items-center gap-2">
                    <span className="text-xs font-black text-slate-400">CNY</span>
                    {t.costCny}
                  </span>
                  <span className="font-mono font-black text-slate-700">
                    {formatCurrency(selectedConverted.CNY, "CNY", lang)}
                  </span>
                </div>
              </div>
            </div>

            {/* Savings Indicator with POSITIVE number in green and an animated upward arrow! */}
            {isSavingPositive ? (
              <motion.div 
                id="savings-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/10 border border-emerald-200.5 p-4.5 rounded-2xl space-y-2.5 text-slate-800"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-700 flex items-center gap-1.5 uppercase">
                    <TrendingUp className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    {t.savingsLabel}
                  </span>
                  
                  {/* Upward jumping motion vector arrow */}
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="inline-flex items-center gap-1 text-[10px] font-mono font-black uppercase tracking-wider bg-emerald-500 text-white px-2.5 py-0.5 rounded-full shadow-3xs"
                  >
                    <ArrowUp className="h-3.5 w-3.5 text-white" />
                    <span>+{savingsPct.toFixed(0)}%</span>
                  </motion.div>
                </div>
                
                <p className="text-xs text-slate-700 leading-relaxed font-bold">
                  {t.savingHighlight.replace(
                    "{value}", 
                    `${formatCurrency(savedConverted.USD, "USD", lang)} (${formatCurrency(savedConverted.EGP, "EGP", lang)})`
                  )}
                </p>

                <div className="text-[10px] text-slate-450 font-bold border-t border-emerald-300/30 pt-2 flex justify-between items-center font-mono">
                  <span>{lang === "ar" ? `مستهدف المقارنة: ${baselinePricing.name}` : `Compared against: ${baselinePricing.name}`}</span>
                  <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 animate-spin" />
                    <span>Verified savings</span>
                  </span>
                </div>
              </motion.div>
            ) : (
              <div id="no-savings-card" className="bg-slate-50 border border-slate-200 p-4.5 rounded-2xl text-xs text-slate-500 space-y-1">
                <span className="font-black text-slate-705 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  {lang === "ar" ? "النموذج المرجعي متكافئ أو أرخص" : "Alternative matches baseline cost structure"}
                </span>
                <p className="text-[11px] text-slate-450 font-semibold leading-relaxed">
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
