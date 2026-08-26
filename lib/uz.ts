// ============================================================================
// Barcha saytdagi o'zbekcha matnlar shu yerda to'plangan.
// So'zlarni o'zgartirish uchun faqat shu faylni tahrirlang -- kodning
// qolgan qismiga tegishning hojati yo'q.
// ============================================================================

export const uz = {
  siteTitle: "Dashboard Musobaqasi",
  tagline: "Excel va Power BI dashboardlari musobaqasi",

  nav: {
    home: "Bosh sahifa",
    login: "Telegram orqali kirish",
    logout: "Chiqish",
  },

  home: {
    welcomeBack: (name: string) => `Xush kelibsiz, ${name}!`,
    notLoggedIn: "Siz tizimga kirmagansiz.",
    loginHint:
      "Sinf guruhlaridan birining a'zosi bo'lsangiz, quyidagi tugma orqali kiring.",
    eligible: "Siz dashboard yuklashingiz va ovoz berishingiz mumkin.",
    notEligible:
      "Hisobingiz topildi, lekin siz hozircha hech qanday tasdiqlangan sinf guruhida emassiz. Agar bu xato bo'lsa, o'qituvchingizga murojaat qiling.",
  },

  login: {
    title: "Telegram orqali kirish",
    preparing: "Tayyorlanmoqda...",
    instructions:
      "Quyidagi tugmani bosing -- Telegram ilovasi ochiladi va bot sizdan tasdiqlashni so'raydi.",
    openTelegram: "Telegramda ochish",
    waiting: "Tasdiqlashni kutyapmiz... Telegramda \"Ha, tasdiqlayman\" tugmasini bosing.",
    cancelled: "Kirish bekor qilindi.",
    expired: "Kirish havolasi eskirdi yoki noto'g'ri edi.",
    retry: "Qaytadan urinish",
  },
} as const;
