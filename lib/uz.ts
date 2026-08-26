// ============================================================================
// Saytdagi BARCHA o'zbekcha matnlar shu faylda.
// So'zlarni o'zgartirmoqchi bo'lsangiz, faqat shu faylni tahrirlang.
// Kodning boshqa qismiga tegish shart emas.
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
    welcomeBack: "Xush kelibsiz",
    notLoggedIn: "Siz tizimga kirmagansiz.",
    loginHint:
      "Sinf guruhlaridan birining a'zosi bo'lsangiz, quyidagi tugma orqali kiring. Kirmasdan ham saytni ko'rishingiz mumkin.",
    eligible: "Siz dashboard yuklashingiz va ovoz berishingiz mumkin.",
    notEligible:
      "Hisobingiz topildi, lekin siz hozircha hech qanday tasdiqlangan sinf guruhida emassiz. Agar bu xato bo'lsa, o'qituvchingizga murojaat qiling.",
  },

  login: {
    title: "Telegram orqali kirish",
    preparing: "Tayyorlanmoqda...",
    step1: "1-qadam: quyidagi tugmani bosing. Telegram ilovasi ochiladi.",
    step2: "2-qadam: bot yuborgan xabardagi \"Ha, tasdiqlayman\" tugmasini bosing.",
    openTelegram: "Telegramda ochish",
    waiting: "Tasdiqlashingizni kutyapmiz...",
    cancelled: "Kirish bekor qilindi.",
    expired: "Kirish havolasi eskirdi. Qaytadan urinib ko'ring.",
    retry: "Qaytadan urinish",
  },

  bot: {
    askConfirm: "Saytga kirishni tasdiqlaysizmi?",
    confirmYes: "Ha, tasdiqlayman",
    confirmNo: "Bekor qilish",
    confirmed: "Tasdiqlandi. Endi brauzeringizga qayting.",
    cancelled: "Kirish bekor qilindi.",
    toastConfirmed: "Tasdiqlandi!",
    toastCancelled: "Bekor qilindi.",
    toastExpired: "Bu havola endi amal qilmaydi.",
    linkExpired: "Bu kirish havolasi eskirgan. Saytga qaytib, qaytadan urinib ko'ring.",
    noToken: "Saytdagi \"Telegram orqali kirish\" tugmasi orqali kiring.",
  },
} as const;
