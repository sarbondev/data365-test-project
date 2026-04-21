import { Locale } from '@prisma/client';

export const SUPPORTED_LOCALES: Locale[] = ['uz', 'ru'];
export const DEFAULT_LOCALE: Locale = 'uz';

type MessageKey =
  | 'auth.phoneAlreadyRegistered'
  | 'auth.verificationNotFound'
  | 'auth.alreadyVerified'
  | 'auth.codeExpired'
  | 'auth.tooManyAttempts'
  | 'auth.openLinkFirst'
  | 'auth.codeIncorrect'
  | 'auth.invalidCredentials'
  | 'auth.notAuthenticated'
  | 'auth.invalidSession'
  | 'auth.userNotFound'
  | 'categories.notFound'
  | 'categories.nameRequired'
  | 'categories.alreadyExists'
  | 'categories.cannotDeleteDefault'
  | 'categories.cannotDeleteWithTx'
  | 'transactions.notFound'
  | 'transactions.amountPositive'
  | 'transactions.categoryMismatch'
  | 'transactions.noneToDelete';

type Dict = Record<MessageKey, string>;

const uz: Dict = {
  'auth.phoneAlreadyRegistered': 'Bu raqam allaqachon ro‘yxatdan o‘tgan',
  'auth.verificationNotFound': 'Tasdiqlash topilmadi',
  'auth.alreadyVerified': 'Allaqachon tasdiqlangan',
  'auth.codeExpired': 'Kod muddati tugagan',
  'auth.tooManyAttempts': 'Juda ko‘p urinish. Qaytadan boshlang',
  'auth.openLinkFirst': 'Avval Telegram bot orqali havolani oching',
  'auth.codeIncorrect': 'Kod noto‘g‘ri',
  'auth.invalidCredentials': 'Telefon yoki parol noto‘g‘ri',
  'auth.notAuthenticated': 'Tizimga kirilmagan',
  'auth.invalidSession': 'Sessiya yaroqsiz',
  'auth.userNotFound': 'Foydalanuvchi topilmadi',
  'categories.notFound': 'Kategoriya topilmadi',
  'categories.nameRequired': 'Kategoriya nomi kerak',
  'categories.alreadyExists': 'Bunday kategoriya allaqachon mavjud',
  'categories.cannotDeleteDefault': 'Standart kategoriyani o‘chirib bo‘lmaydi',
  'categories.cannotDeleteWithTx':
    'Tranzaksiyalari bor kategoriyani o‘chirib bo‘lmaydi',
  'transactions.notFound': 'Tranzaksiya topilmadi',
  'transactions.amountPositive': 'Summa musbat son bo‘lishi kerak',
  'transactions.categoryMismatch': 'Kategoriya turi mos kelmadi',
  'transactions.noneToDelete': 'O‘chirish uchun tranzaksiyalar yo‘q',
};

const ru: Dict = {
  'auth.phoneAlreadyRegistered': 'Этот номер уже зарегистрирован',
  'auth.verificationNotFound': 'Подтверждение не найдено',
  'auth.alreadyVerified': 'Уже подтверждено',
  'auth.codeExpired': 'Срок действия кода истёк',
  'auth.tooManyAttempts': 'Слишком много попыток. Начните заново',
  'auth.openLinkFirst': 'Сначала откройте ссылку в Telegram-боте',
  'auth.codeIncorrect': 'Неверный код',
  'auth.invalidCredentials': 'Неверный телефон или пароль',
  'auth.notAuthenticated': 'Вы не вошли в систему',
  'auth.invalidSession': 'Сессия недействительна',
  'auth.userNotFound': 'Пользователь не найден',
  'categories.notFound': 'Категория не найдена',
  'categories.nameRequired': 'Название категории обязательно',
  'categories.alreadyExists': 'Такая категория уже существует',
  'categories.cannotDeleteDefault': 'Нельзя удалить стандартную категорию',
  'categories.cannotDeleteWithTx':
    'Нельзя удалить категорию с транзакциями',
  'transactions.notFound': 'Транзакция не найдена',
  'transactions.amountPositive': 'Сумма должна быть положительной',
  'transactions.categoryMismatch': 'Тип категории не совпадает',
  'transactions.noneToDelete': 'Нет транзакций для удаления',
};

const DICTS: Record<Locale, Dict> = { uz, ru };

export function t(key: MessageKey, locale: Locale = DEFAULT_LOCALE): string {
  return DICTS[locale]?.[key] ?? DICTS[DEFAULT_LOCALE][key] ?? key;
}

export function normalizeLocale(raw: string | undefined | null): Locale {
  if (!raw) return DEFAULT_LOCALE;
  const lower = raw.toLowerCase().slice(0, 2);
  return SUPPORTED_LOCALES.includes(lower as Locale)
    ? (lower as Locale)
    : DEFAULT_LOCALE;
}
