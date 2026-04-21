import { Locale } from '@prisma/client';

type BotCopy = {
  WELCOME: string;
  PROCESSING: string;
  AI_UNAVAILABLE: string;
  CANCELLED: string;
  NO_LAST_TX: string;
  GENERIC_ERROR: string;
  AMOUNT_REQUIRED: string;
  NOT_REGISTERED: string;
  VERIFY_OK: (code: string) => string;
  VERIFY_INVALID: string;
  TX_NOT_FOUND: string;
  DELETED: string;
  DELETE_FAILED: string;
  EDIT_REDIRECT: (url: string) => string;
  DELETE_LAST_OK: (amount: string, category: string) => string;
  INCOME_VERB: string;
  EXPENSE_VERB: string;
  CATEGORY_PICK_INCOME: string;
  CATEGORY_PICK_EXPENSE: string;
  CANCEL_BTN: string;
  EDIT_BTN: string;
  DELETE_BTN: string;
  UNCLEAR_FALLBACK: string;
};

const uz: BotCopy = {
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
  AI_UNAVAILABLE:
    "🤖 AI vaqtincha ishlamayapti. Iltimos, birozdan keyin qayta urinib ko'ring yoki matn orqali yozing.",
  CANCELLED: '❌ Bekor qilindi',
  NO_LAST_TX: "O'chirish uchun tranzaksiyalar topilmadi",
  GENERIC_ERROR: "❗ Xatolik yuz berdi. Iltimos, qayta urinib ko'ring",
  AMOUNT_REQUIRED:
    "Iltimos, summani kiriting. Masalan: \"3 mln so'm\" yoki \"2,500,000\"",
  NOT_REGISTERED: [
    "👋 Salom! Sizni tanimadim.",
    '',
    "Botdan foydalanish uchun avval dashboard'da ro'yxatdan o'ting:",
  ].join('\n'),
  VERIFY_OK: (code) =>
    [
      `✅ Tasdiqlash kodi: <b>${code}</b>`,
      '',
      "Ushbu kodni dashboard'ga kiriting. Kod 10 daqiqa amal qiladi.",
    ].join('\n'),
  VERIFY_INVALID:
    "❗ Tasdiqlash havolasi yaroqsiz yoki muddati tugagan. Dashboard'da qaytadan boshlang.",
  TX_NOT_FOUND: 'Tranzaksiya topilmadi',
  DELETED: "O'chirildi",
  DELETE_FAILED: "O'chirib bo'lmadi",
  EDIT_REDIRECT: (url) =>
    `✏️ Tahrirlash uchun web-dashboardga o'ting:\n${url}/transactions`,
  DELETE_LAST_OK: (amount, category) =>
    `🗑 So'nggi tranzaksiya o'chirildi:\n${amount} so'm — ${category}`,
  INCOME_VERB: 'Kirim',
  EXPENSE_VERB: 'Xarajat',
  CATEGORY_PICK_INCOME: '❓ Kirim kategoriyasini tanlang:',
  CATEGORY_PICK_EXPENSE: '❓ Xarajat kategoriyasini tanlang:',
  CANCEL_BTN: '❌ Bekor qilish',
  EDIT_BTN: '✏️ Tahrirlash',
  DELETE_BTN: "🗑 O'chirish",
  UNCLEAR_FALLBACK:
    "❓ Tushunmadim. Masalan yozing: \"Bugun ijaraga 3 mln so'm\"",
};

const ru: BotCopy = {
  WELCOME: [
    '👋 Здравствуйте! Я ваш финансовый помощник.',
    '',
    'Я умею:',
    '• Записывать доходы/расходы (текст или голос)',
    '• Готовить отчёты',
    '• Предупреждать о превышении бюджета',
    '',
    'Например, напишите или скажите:',
    '• "Сегодня за аренду заплатил 3 млн сум"',
    '• "Клиент перечислил 2.5 млн"',
    '• "Сколько в этом месяце ушло на логистику?"',
  ].join('\n'),
  PROCESSING: '⏳ Обрабатываю...',
  AI_UNAVAILABLE:
    '🤖 AI временно недоступен. Пожалуйста, попробуйте позже или напишите текстом.',
  CANCELLED: '❌ Отменено',
  NO_LAST_TX: 'Нет транзакций для удаления',
  GENERIC_ERROR: '❗ Произошла ошибка. Пожалуйста, попробуйте ещё раз',
  AMOUNT_REQUIRED:
    'Пожалуйста, укажите сумму. Например: "3 млн сум" или "2,500,000"',
  NOT_REGISTERED: [
    '👋 Здравствуйте! Я вас не узнал.',
    '',
    'Чтобы пользоваться ботом, сначала зарегистрируйтесь в дашборде:',
  ].join('\n'),
  VERIFY_OK: (code) =>
    [
      `✅ Код подтверждения: <b>${code}</b>`,
      '',
      'Введите этот код в дашборде. Код действует 10 минут.',
    ].join('\n'),
  VERIFY_INVALID:
    '❗ Ссылка подтверждения недействительна или устарела. Начните заново в дашборде.',
  TX_NOT_FOUND: 'Транзакция не найдена',
  DELETED: 'Удалено',
  DELETE_FAILED: 'Не удалось удалить',
  EDIT_REDIRECT: (url) =>
    `✏️ Для редактирования перейдите в веб-дашборд:\n${url}/transactions`,
  DELETE_LAST_OK: (amount, category) =>
    `🗑 Последняя транзакция удалена:\n${amount} сум — ${category}`,
  INCOME_VERB: 'Доход',
  EXPENSE_VERB: 'Расход',
  CATEGORY_PICK_INCOME: '❓ Выберите категорию дохода:',
  CATEGORY_PICK_EXPENSE: '❓ Выберите категорию расхода:',
  CANCEL_BTN: '❌ Отмена',
  EDIT_BTN: '✏️ Редактировать',
  DELETE_BTN: '🗑 Удалить',
  UNCLEAR_FALLBACK:
    '❓ Не понял. Например напишите: "Сегодня за аренду 3 млн сум"',
};

const COPIES: Record<Locale, BotCopy> = { uz, ru };

export function botMessages(locale: Locale): BotCopy {
  return COPIES[locale] ?? uz;
}

export const CALLBACK = {
  PICK_CATEGORY: 'pickcat',
  EDIT_TX: 'edit',
  DELETE_TX: 'del',
  CANCEL: 'cancel',
  LANG: 'lang',
};
