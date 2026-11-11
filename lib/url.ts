/** Дозволяємо лише http(s)-посилання (захист від javascript: у старих даних) */
export const safeHref = (u: string) => (/^https?:\/\//i.test(u) ? u : "#");
