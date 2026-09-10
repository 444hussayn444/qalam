import { useState } from "react";
import "./description.css";

export default function Description() {
    const [lang, setLang] = useState("en"); // 'en' for English, 'ar' for Arabic

    const englishContent = {
        headerTitle: "About Us",
        subtitle: "Innovation in Black & White",
        sections: [
            {
                title: "Who We Are",
                items: [
                    "Delta Pen is the first workshop for engineering art and modern digital design reflecting the spirit of free thought and uniqueness. We provide your imagination and expressive creations with excellent quality and standard engineering specifications.",
                ],
            },
            {
                title: "What We Provide",
                items: [
                    "Get your custom-designed product fully visualized as a digital product or printed items (clothes, boards, others on demand) at 50%-75% lower than standard market prices.",
                    "Choose from our digital gallery or store for a limited and very affordable price for each engineering category in our store.",
                    "Special service for art lovers and musicians: complete branding and exclusive design for artistic works, including clothes and trend designs, available as digital service or printed products with standard quality.",
                ],
            },
            {
                title: "Contact Details",
                items: [
                    { label: "Phone", value: "EG +20 155 187 0889" },
                    { label: "Address", value: "9 Mansor Street" },
                ],
            },
        ],
    };

    const arabicContent = {
        headerTitle: "حولنا",
        subtitle: "الابتكار بالأسود والأبيض",
        sections: [
            {
                title: "من نحن",
                items: [
                    "∆ القلم اول مساحه عمل (ورشه) للفن الهندسي و التصميم الرقمي العصري العاكس لروح الفكر الحر و الفريد بالقلم قبل اي شئ نقدم لك وحي مخيلتك و تصويرك المعبر عنك بجوده ممتازه و مواصفات هندسيه قياسيه تابعه للقوانين القياسيه الهندسيه العالميه للتجاره و الاعلام و العمل الحر",
                ],
            },
            {
                title: "خدماتنا",
                items: [
                    "احصل علي طلبك الخاص بكامل تصميمك المصور بخيالك الخاص كمنتج رقمي او من اشكال منتجاتنا المطبوعه الخاصة (ملابس / ألواح / اخر حسب الطلب) بسعر اقل ٧٥٪ كحد اقصي و ٥٠٪ كحد ادني من السوق الرقمي الهندسي و الفني",
                    "او يمكنك اختيار ما نال اعجابك من معرضنا او متجرنا الرقمي ... بسعر محدود و رخيص جدا لكل قسم هندسي من اقسام متجرنا",
                    "خدمة مخصوص لمجال محبين الفن و الموسيقيين كتصميم براندنج كامل و منفرد للأعمال الفنية و نعمل علي تزويدكم ايضا انتاج المتعلقات من ملابس و تصميم الصيحات لكم ك (فنانين / والمتابعين المهتمين) بإتاحة طلب الخدمة المفتوحه و الحره كخدمة رقمية او في شكل من اشكال منتجاتنا بجودة قياسية",
                ],
            },
            {
                title: "بيانات الاتصال",
                items: [
                    { label: "الهاتف", value: "EG +20 155 187 0889" },
                    { label: "العنوان", value: "9 شارع منصور" },
                ],
            },
        ],
    };

    const content = lang === "en" ? englishContent : arabicContent;

    return (
        <div className={`description-page ${lang === "ar" ? "rtl" : ""}`}>
            <div className="description-header">
                <h1>{content.headerTitle}</h1>
                <p className="subtitle">{content.subtitle}</p>
                <button className="lang-switch" onClick={() => setLang(lang === "en" ? "ar" : "en")}>
                    {lang === "en" ? "العربية" : "English"}
                </button>
            </div>

            <div className="sections-vertical">
                {content.sections.map((section, idx) => (
                    <section className="info-column" key={idx}>
                        <h2 className="section-title">{section.title}</h2>
                        <ul className={`info-list ${section.title.includes("Contact") || section.title.includes("الاتصال") ? "contact-list" : ""}`}>
                            {section.items.map((item, i) =>
                                typeof item === "string" ? (
                                    <li key={i}>{item}</li>
                                ) : (
                                    <li className="contact-item" key={i}>
                                        <span className="label">{item.label}</span>
                                        <span className="value">{item.value}</span>
                                    </li>
                                )
                            )}
                        </ul>
                    </section>
                ))}
            </div>
        </div>
    );
}
