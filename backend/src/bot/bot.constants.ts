export const BOT_MESSAGES = {
  WELCOME: [
    "👋 Salom! Men sizning moliyaviy yordamchingizman.",
    '',
    'Quyidagilarni qila olaman:',
    "• Kirim/xarajatlarni yozib olaman (matn yoki ovoz orqali)",
    "• Hisobotlar tayyorlayman",
    "• Byudjet limitlari haqida ogohlantiraman",
    '',
    "Misol uchun yozing yoki ayting:",
    '• "Bugun ijaraga 3 mln so\'m to\'ladim"',
    '• "Klient 2.5 mln to\'ladi"',
    '• "Bu oyda logistikaga qancha sarfladik?"',
  ].join('\n'),
  PROCESSING: '⏳ Qayta ishlanmoqda...',
  CANCELLED: '❌ Bekor qilindi',
  NO_LAST_TX: 'O\'chirish uchun tranzaksiyalar topilmadi',
  GENERIC_ERROR: '❗ Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring',
  AMOUNT_REQUIRED:
    "Iltimos, summani kiriting. Masalan: \"3 mln so'm\" yoki \"2,500,000\"",
};

export const CALLBACK = {
  PICK_CATEGORY: 'pickcat',
  EDIT_TX: 'edit',
  DELETE_TX: 'del',
  CANCEL: 'cancel',
};
