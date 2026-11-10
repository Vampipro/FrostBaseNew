export type Lang = "ua" | "en" | "ru";
export const LANGS: Lang[] = ["ua", "en", "ru"];

const D: Record<Lang, Record<string, string>> = {
  ua: {
    nav_search: "Пошук", nav_stats: "Статистика", nav_report: "Подати жалобу", nav_admin: "Адмін", login: "Вхід", register: "Реєстрація", logout: "Вийти",
    hero_pre: "// СИСТЕМА ОНЛАЙН // ЧЕКЕР СКАМЕРІВ", hero_sub: "Перевір юзернейм або Telegram ID за базою скамерів. Миттєвий пошук, схожі акаунти, реакції спільноти.",
    stat_scammers: "Записів у базі", stat_searches: "Пошуків", stat_views: "Переглядів",
    search_ph: "Юзернейм або Telegram ID…", search_btn: "Пошук", all_statuses: "Усі статуси", pending_status: "На модерації", all_types: "Усі типи",
    sort_rel: "За релевантністю", sort_new: "Новіші", sort_old: "Старіші", sort_likes: "За лайками", sort_views: "За переглядами", sort_complaints: "За жалобами",
    results: "Результати", similar: "Схожі акаунти", empty_title: "Нічого не знайдено", empty_sub: "Змініть запит або фільтри", reset: "Скинути",
    top_searches: "Топ пошуків", loading: "Завантаження…", more: "Ще", page: "Сторінка",
    pending_since: "На модерації з", complaints: "жалоб", views: "переглядів", details: "Деталі",
    m_id: "Telegram ID", m_type: "Тип", m_amount: "Сума", m_date: "Дата", m_complaints: "Жалоб", m_views: "Переглядів", m_desc: "Опис", m_proofs: "Докази", m_proof_link: "Посилання на доказ",
    copy_user: "Копіювати юз", copy_id: "Копіювати ID", open_tg: "Відкрити в Telegram", copied: "Скопійовано", like: "Скам", neutral: "Не впевнений", dislike: "Не скам",
    comments: "Коментарі", comment_ph: "Ваш коментар…", send: "Надіслати", login_to_comment: "Увійдіть, щоб коментувати", no_comments: "Коментарів ще немає", report_comment: "Поскаржитись", reported: "Скаргу надіслано",
    appeal: "Подати апеляцію", appeal_title: "Апеляція: я не винен", appeal_desc: "Опишіть, чому ви не скамер", appeal_shots: "Посилання на скріншоти (кожне з нового рядка)", appeal_sent: "Апеляцію надіслано",
    r_title: "Подати жалобу", r_instruction: "Інструкція", r_username: "Юзернейм скамера", r_id: "Telegram ID скамера", r_one_required: "Достатньо заповнити одне з полів — юз або ID",
    r_tag: "Тег", r_shots: "Скріншоти (посилання, кожне з нового рядка)", r_desc: "Опис ситуації", r_amount: "Сума", r_currency: "Валюта",
    r_contact: "Зв'язатися зі мною", r_contact_user: "Ваш юзернейм у Telegram", r_submit: "Відправити на модерацію", r_ok: "Дякуємо! Жалоба відправлена на модерацію.", r_limit: "Ліміт заявок з одного IP: ",
    username: "Логін", password: "Пароль", auth_login_title: "Вхід", auth_reg_title: "Реєстрація", no_account: "Немає акаунта?", have_account: "Вже є акаунт?",
    st_title: "Статистика", st_scammers: "Скамерів у базі", st_pending: "На модерації", st_subs: "Подано жалоб", st_users: "Користувачів", st_comments: "Коментарів", st_today: "Пошуків сьогодні", st_7d: "Пошуків за 7 днів",
    st_reactions: "Реакції", st_by_status: "За тегами", st_by_type: "За типами", st_top_searched: "Найбільше шукають", st_top_viewed: "Найбільше переглядів", st_top_liked: "Найбільше лайків", st_top_queries: "Топ запитів (30 днів)", st_per_day: "Пошуки за 14 днів", st_latest: "Останні додані",
    footer_note: "Інформація подається спільнотою. Перевіряйте перед угодою.", back: "Назад", not_found: "Не знайдено", error: "Помилка",
    settings: "Налаштування", set_theme: "Тема", th_frost: "Frost", th_neon: "Neon", th_light: "Світла", set_bg: "Анімований фон", set_grid: "Сітка", set_scan: "Скан-лінії", set_anim: "Анімації", set_glow: "Свічення", set_lite: "Lite-режим (без ефектів)", set_reset: "Скинути", report_again: "Подати ще одну", nf_title: "Сторінку не знайдено", err_title: "Щось пішло не так", retry: "Спробувати ще", home: "На головну", mod_hint: "Лише для адміністрації",
  },
  en: {
    nav_search: "Search", nav_stats: "Statistics", nav_report: "Report a scammer", nav_admin: "Admin", login: "Log in", register: "Sign up", logout: "Log out",
    hero_pre: "// SYSTEM ONLINE // SCAMMER CHECKER", hero_sub: "Check a username or Telegram ID against the scammer database. Instant search, similar accounts, community reactions.",
    stat_scammers: "Records", stat_searches: "Searches", stat_views: "Views",
    search_ph: "Username or Telegram ID…", search_btn: "Search", all_statuses: "All statuses", pending_status: "Under review", all_types: "All types",
    sort_rel: "Relevance", sort_new: "Newest", sort_old: "Oldest", sort_likes: "Most likes", sort_views: "Most views", sort_complaints: "Most reports",
    results: "Results", similar: "Similar accounts", empty_title: "Nothing found", empty_sub: "Try another query or filters", reset: "Reset",
    top_searches: "Top searches", loading: "Loading…", more: "More", page: "Page",
    pending_since: "Under review since", complaints: "reports", views: "views", details: "Details",
    m_id: "Telegram ID", m_type: "Type", m_amount: "Amount", m_date: "Date", m_complaints: "Reports", m_views: "Views", m_desc: "Description", m_proofs: "Evidence", m_proof_link: "Proof link",
    copy_user: "Copy username", copy_id: "Copy ID", open_tg: "Open in Telegram", copied: "Copied", like: "Scam", neutral: "Not sure", dislike: "Not scam",
    comments: "Comments", comment_ph: "Your comment…", send: "Send", login_to_comment: "Log in to comment", no_comments: "No comments yet", report_comment: "Report", reported: "Report sent",
    appeal: "File an appeal", appeal_title: "Appeal: I'm not guilty", appeal_desc: "Explain why you are not a scammer", appeal_shots: "Screenshot links (one per line)", appeal_sent: "Appeal sent",
    r_title: "Report a scammer", r_instruction: "Instruction", r_username: "Scammer's username", r_id: "Scammer's Telegram ID", r_one_required: "Fill in at least one field — username or ID",
    r_tag: "Tag", r_shots: "Screenshots (links, one per line)", r_desc: "Description", r_amount: "Amount", r_currency: "Currency",
    r_contact: "Contact me", r_contact_user: "Your Telegram username", r_submit: "Send for moderation", r_ok: "Thank you! Your report was sent for moderation.", r_limit: "Reports per IP limit: ",
    username: "Username", password: "Password", auth_login_title: "Log in", auth_reg_title: "Sign up", no_account: "No account?", have_account: "Already registered?",
    st_title: "Statistics", st_scammers: "Scammers in base", st_pending: "Under review", st_subs: "Reports filed", st_users: "Users", st_comments: "Comments", st_today: "Searches today", st_7d: "Searches, 7 days",
    st_reactions: "Reactions", st_by_status: "By tag", st_by_type: "By type", st_top_searched: "Most searched", st_top_viewed: "Most viewed", st_top_liked: "Most liked", st_top_queries: "Top queries (30 days)", st_per_day: "Searches, 14 days", st_latest: "Latest added",
    footer_note: "Information is provided by the community. Verify before any deal.", back: "Back", not_found: "Not found", error: "Error",
    settings: "Settings", set_theme: "Theme", th_frost: "Frost", th_neon: "Neon", th_light: "Light", set_bg: "Animated background", set_grid: "Grid", set_scan: "Scanlines", set_anim: "Animations", set_glow: "Glow", set_lite: "Lite mode (no effects)", set_reset: "Reset", report_again: "Report another", nf_title: "Page not found", err_title: "Something went wrong", retry: "Try again", home: "Home", mod_hint: "Staff only",
  },
  ru: {
    nav_search: "Поиск", nav_stats: "Статистика", nav_report: "Подать жалобу", nav_admin: "Админ", login: "Вход", register: "Регистрация", logout: "Выйти",
    hero_pre: "// СИСТЕМА ОНЛАЙН // ЧЕКЕР СКАМЕРОВ", hero_sub: "Проверь юзернейм или Telegram ID по базе скамеров. Мгновенный поиск, похожие аккаунты, реакции сообщества.",
    stat_scammers: "Записей в базе", stat_searches: "Поисков", stat_views: "Просмотров",
    search_ph: "Юзернейм или Telegram ID…", search_btn: "Поиск", all_statuses: "Все статусы", pending_status: "На модерации", all_types: "Все типы",
    sort_rel: "По релевантности", sort_new: "Новее", sort_old: "Старее", sort_likes: "По лайкам", sort_views: "По просмотрам", sort_complaints: "По жалобам",
    results: "Результаты", similar: "Похожие аккаунты", empty_title: "Ничего не найдено", empty_sub: "Измените запрос или фильтры", reset: "Сбросить",
    top_searches: "Топ поисков", loading: "Загрузка…", more: "Ещё", page: "Страница",
    pending_since: "На модерации с", complaints: "жалоб", views: "просмотров", details: "Детали",
    m_id: "Telegram ID", m_type: "Тип", m_amount: "Сумма", m_date: "Дата", m_complaints: "Жалоб", m_views: "Просмотров", m_desc: "Описание", m_proofs: "Доказательства", m_proof_link: "Ссылка на доказательство",
    copy_user: "Копировать юз", copy_id: "Копировать ID", open_tg: "Открыть в Telegram", copied: "Скопировано", like: "Скам", neutral: "Не уверен", dislike: "Не скам",
    comments: "Комментарии", comment_ph: "Ваш комментарий…", send: "Отправить", login_to_comment: "Войдите, чтобы комментировать", no_comments: "Комментариев пока нет", report_comment: "Пожаловаться", reported: "Жалоба отправлена",
    appeal: "Подать апелляцию", appeal_title: "Апелляция: я не виноват", appeal_desc: "Опишите, почему вы не скамер", appeal_shots: "Ссылки на скриншоты (каждая с новой строки)", appeal_sent: "Апелляция отправлена",
    r_title: "Подать жалобу", r_instruction: "Инструкция", r_username: "Юзернейм скамера", r_id: "Telegram ID скамера", r_one_required: "Достаточно заполнить одно из полей — юз или ID",
    r_tag: "Тег", r_shots: "Скриншоты (ссылки, каждая с новой строки)", r_desc: "Описание ситуации", r_amount: "Сумма", r_currency: "Валюта",
    r_contact: "Связаться со мной", r_contact_user: "Ваш юзернейм в Telegram", r_submit: "Отправить на модерацию", r_ok: "Спасибо! Жалоба отправлена на модерацию.", r_limit: "Лимит заявок с одного IP: ",
    username: "Логин", password: "Пароль", auth_login_title: "Вход", auth_reg_title: "Регистрация", no_account: "Нет аккаунта?", have_account: "Уже есть аккаунт?",
    st_title: "Статистика", st_scammers: "Скамеров в базе", st_pending: "На модерации", st_subs: "Подано жалоб", st_users: "Пользователей", st_comments: "Комментариев", st_today: "Поисков сегодня", st_7d: "Поисков за 7 дней",
    st_reactions: "Реакции", st_by_status: "По тегам", st_by_type: "По типам", st_top_searched: "Чаще всего ищут", st_top_viewed: "Больше всего просмотров", st_top_liked: "Больше всего лайков", st_top_queries: "Топ запросов (30 дней)", st_per_day: "Поиски за 14 дней", st_latest: "Недавно добавленные",
    footer_note: "Информация предоставляется сообществом. Проверяйте перед сделкой.", back: "Назад", not_found: "Не найдено", error: "Ошибка",
    settings: "Настройки", set_theme: "Тема", th_frost: "Frost", th_neon: "Neon", th_light: "Светлая", set_bg: "Анимированный фон", set_grid: "Сетка", set_scan: "Скан-линии", set_anim: "Анимации", set_glow: "Свечение", set_lite: "Lite-режим (без эффектов)", set_reset: "Сбросить", report_again: "Подать ещё одну", nf_title: "Страница не найдена", err_title: "Что-то пошло не так", retry: "Повторить", home: "На главную", mod_hint: "Только для администрации",
  },
};

export const t = (lang: Lang, k: string) => D[lang][k] ?? D.ru[k] ?? D.ua[k] ?? k;

/** Назва тега/типу з перекладами {ua,en,ru}; якщо перекладу нема — label */
export function tr(item: { label: string; translations?: any } | null | undefined, lang: Lang) {
  if (!item) return "";
  const v = item.translations?.[lang];
  return (typeof v === "string" && v) || item.label;
}
