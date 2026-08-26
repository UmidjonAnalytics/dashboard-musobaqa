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

  loginError: {
    badRequest: "Kirishda xatolik yuz berdi. Qaytadan urinib ko'ring.",
  },
} as const;
