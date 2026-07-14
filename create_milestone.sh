#!/bin/bash
curl -X POST -H "Authorization: token ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/Moeabdelaziz007/AxiomID/milestones \
  -d '{
    "title": "v1.0.0 – Identity-First Agent Platform",
    "description": "🚀 تحويل AxiomID إلى منصة هوية عالمية شاملة للوكلاء الذاتيين. \nيغطي هذا التحديث الجذري المعمارية الجديدة (Domain-Driven Design), محرك التشغيل الافتراضي (Execution Engine)، ونظام الـ Event Sourcing للـ Identity Jobs. يتضمن واجهة الـ AI Creator Wizard بدون برمجة (No-Code)، ومحاكي نشر النطاقات الفرعية (e.g. agent.axiomid.app). \n\nالمحاور الرئيسية:\n1. 🏗️ **Identity Core:** DDD Layer, IdentityJob State Machine, Capability Interfaces.\n2. 🔌 **Orchestration:** DefaultExecutionEngine, Step Handlers (Domain, DID, Passport, Marketplace).\n3. 🪄 **AI Creator Wizard:** Progressive UI for Subdomain reservation and Genome selection.\n4. 🌐 **Public Identity Endpoint:** Subdomain rewrites to Passport via Middleware.\n\nالهدف: تمكين 60 مليون مستخدم من إطلاق وكلائهم بهوية سيادية موثقة بنقرة واحدة.",
    "state": "open",
    "due_on": "2026-08-30T00:00:00Z"
  }'
