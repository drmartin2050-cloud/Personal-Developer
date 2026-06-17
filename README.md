---
title: Developer Dashboard
emoji: 🖥️
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# 🖥️ Personal Developer Dashboard

لوحة تحكم مطور شخصي متكاملة تدعم العربية والإنجليزية.

## ✨ المميزات

- **Dashboard تفاعلي** – عرض إحصائيات المشاريع والمفاتيح
- **إدارة المفاتيح** – تشفير وتخزين آمن لمفاتيح API
- **تكامل مع Supabase** – قاعدة بيانات سحابية
- **تكامل مع Firebase** – مصادقة وتخزين
- **مساعد ذكي** – يعمل عبر Groq API (Llama 3.3)
- **نظام Failover** – تبديل تلقائي بين مزودي الذكاء الاصطناعي
- **تصميم متجاوب** – يعمل على جميع الأجهزة

## 🛠️ التقنيات المستخدمة

| التقنية | الاستخدام |
|---------|-----------|
| React 18 | واجهة المستخدم |
| TypeScript | لغة البرمجة |
| Vite | أداة البناء |
| TailwindCSS | التصميم |
| Supabase | قاعدة البيانات |
| Firebase | المصادقة والتخزين |
| Groq API | الذكاء الاصطناعي |

## 🚀 النشر على Hugging Face

### 1. المتطلبات المسبقة
- حساب على Hugging Face
- حساب على Groq (للحصول على API Key)

### 2. متغيرات البيئة المطلوبة

أضف هذه المتغيرات في `Settings → Variables and secrets`:

| المتغير | الشرح |
|---------|-------|
| `GROQ_API_KEY` | مفتاح Groq API (يبدأ بـ `gsk_`) |
| `GEMINI_API_KEY` | مفتاح Gemini API (اختياري) |
| `SUPABASE_URL` | رابط Supabase (اختياري) |
| `SUPABASE_ANON_KEY` | مفتاح Supabase (اختياري) |

### 3. إعادة البناء
بعد إضافة المتغيرات، اذهب إلى `Settings → Builder → Rebuild Space`

## 📊 هيكل المشروع
