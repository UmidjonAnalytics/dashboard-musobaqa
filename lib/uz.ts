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
    works: "Ishlar",
    upload: "Yuklash",
    login: "Kirish",
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

  upload: {
    title: "Dashboard yuklash",
    competition: "Musobaqa",
    excel: "Excel",
    powerbi: "Power BI",
    dashTitle: "Ishingiz nomi",
    dashTitleHint: "Bu nom ovoz beruvchilarga ko'rinadi. Ismingizni yozmang.",
    description: "Qisqacha izoh (ixtiyoriy)",
    file: "Dashboard fayli",
    fileHintExcel: "Ruxsat etilgan: .xlsx, .xlsm, .xls -- eng ko'pi 25 MB",
    fileHintPowerbi: "Ruxsat etilgan: .pbix -- eng ko'pi 25 MB",
    images: "Rasmlar (1 tadan 4 tagacha)",
    imagesHint: "Bittasini asosiy rasm sifatida belgilang. Asosiy rasm ro'yxatlarda ko'rinadi.",
    addImage: "Rasm qo'shish",
    addLink: "Havola qo'shish",
    removeImage: "O'chirish",
    mainImage: "Asosiy rasm",
    imageUrlPlaceholder: "Rasm yoki GIF havolasi",
    submit: "Yuborish",
    submitting: "Yuborilmoqda...",
    uploadingFile: "Dashboard fayli yuklanmoqda...",
    uploadingImages: "Rasmlar yuklanmoqda...",
    saving: "Saqlanmoqda...",
    success: "Ishingiz muvaffaqiyatli yuborildi!",
    successHint: "Ovoz berish bosqichi boshlanganda ishingiz ro'yxatda paydo bo'ladi.",
  },

  uploadError: {
    notLoggedIn: "Avval Telegram orqali kiring.",
    notEligible: "Siz dashboard yuklay olmaysiz.",
    notUploadPhase: "Hozir yuklash bosqichi emas.",
    alreadySubmitted: "Siz bu musobaqaga allaqachon ish yuborgansiz. Har bir musobaqaga bittadan ish yuborish mumkin.",
    noFile: "Dashboard faylini tanlang.",
    badExtension: "Fayl turi mos emas.",
    fileTooBig: "Fayl juda katta (eng ko'pi 25 MB).",
    imageTooBig: "Rasm juda katta (eng ko'pi 5 MB).",
    noTitle: "Ishingiz nomini yozing.",
    noImages: "Kamida bitta rasm qo'shing.",
    tooManyImages: "Eng ko'pi 4 ta rasm.",
    noMain: "Bitta asosiy rasmni belgilang.",
    generic: "Xatolik yuz berdi. Qaytadan urinib ko'ring.",
  },

  phase: {
    before: "Yuklash bosqichi hali boshlanmagan.",
    uploadOpen: "Yuklash bosqichi ochiq.",
    votingOpen: "Ovoz berish bosqichi ochiq. Yuklash yopilgan.",
    after: "Musobaqa yakunlandi.",
    testingBanner: "SINOV REJIMI: bosqich qo'lda o'rnatilgan.",
  },

  phaseShort: {
    before: "Tez orada",
    upload: "Yuklash ochiq",
    voting: "Ovoz berish",
    after: "Yakunlandi",
    testing: "SINOV",
  },

  works: {
    title: "Yuborilgan ishlar",
    subtitle: "Barcha ishlarni ko'rish uchun hisob kerak emas.",
    empty: "Hozircha bu musobaqada ish yo'q.",
    count: "ta ish",
    open: "Batafsil",
    download: "Faylni yuklab olish",
    votingSoon: "Ovoz berish 4-sentabrda boshlanadi.",
    anonymousNote: "Mualliflar ismlari ovoz berish yakunlanguncha yashirin.",
  },

  work: {
    notFound: "Bunday ish topilmadi.",
    back: "Barcha ishlar",
    description: "Izoh",
    screenshots: "Rasmlar",
  },
} as const;
