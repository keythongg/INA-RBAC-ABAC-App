import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
    resources: {
        en: {
            translation: {
                welcome: "Welcome to our website!",
                description: "This is a multi-language app.",
            },
        },
        bs: {
            translation: {
                welcome: "Dobrodošli na našu web stranicu!",
                description: "Ovo je aplikacija sa više jezika.",
            },
        },
    },
    lng: "en", // Početni jezik
    fallbackLng: "en",
    interpolation: { escapeValue: false },
});

export default i18n;
