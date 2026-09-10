import { useNavigate } from "react-router-dom";
import { FaLock, FaTruck, FaShieldAlt, FaGem, FaCube } from "react-icons/fa";
import { useState } from "react";
import "./home.css"
import Image from "./image.png"
export default function Home() {
    const navigate = useNavigate();
    const [lang, setLang] = useState("EN");
    const isAR = lang === "AR";

    const theme = {
        bg: "#000",
        bgSoft: "#0F0F0F",
        text: "#fff",
        textDim: "#777",
        border: "#262626",
    };

    const content = {
        EN: {
            bar: "Professional design services 50%–75% cheaper than local market",
            title1: "Creative",
            title2: "Philosophy",
            heroText:
                "At its core, the pen is our central tool — the foundation of our project and brand identity as an innovative platform offering comprehensive creative services for everyone.",
            btn: "View Works",
            philosophyTitle: "Our Philosophy",
            philosophyText:
                "We craft the image and the optimal geometric structure that embodies precise meaning and the inner spirit of every idea, compressing concepts into expressive visual forms that communicate quickly and clearly.",
            servicesTitle: "Our Services",
            servicesText:
                "We enable the production of hundreds and thousands of designs professionally and provide complete digital design solutions for any project or concept.",
            services: [
                "Digital Designs",
                "Branding & Logos",
                "Fashion Design",
                "Custom Designs",
                "Product Printing",
                "Artist Support"
            ],
            links: ["Premium Designs", "Custom Projects", "Production", "Secure Service"],
            copyright: "All Rights Reserved"
        },

        AR: {
            bar: "خدمات تصميم احترافية بأسعار أقل من السوق المحلي بنسبة 50٪ إلى 75٪",
            title1: "فلسفة",
            title2: "الإبداع",
            heroText:
                "في المقام الأول القلم هو أداتنا المركزية التي يقوم عليها مشروعنا وهويتنا كمنصة مبتكرة تقدم خدمات إبداعية شاملة ومتاحة للجميع.",
            btn: "عرض الأعمال",
            philosophyTitle: "فلسفتنا",
            philosophyText:
                "نصنع الصورة والبنية الهندسية المثلى التي تجسد المعنى الدقيق والروح الكامنة خلف الفكرة، حيث نختصر المفاهيم في أشكال بصرية معبرة توصل الرسالة بسرعة ووضوح.",
            servicesTitle: "خدماتنا",
            servicesText:
                "نتيح إنتاج مئات وآلاف التصاميم بشكل احترافي ونوفر حلول تصميم رقمي كاملة لأي مشروع أو فكرة.",
            services: [
                "تصاميم رقمية",
                "شعارات وهوية",
                "تصميم أزياء",
                "تصاميم مخصصة",
                "طباعة منتجات",
                "دعم الفنانين"
            ],
            links: ["تصاميم احترافية", "مشاريع خاصة", "تنفيذ", "خدمة موثوقة"],
            copyright: "جميع الحقوق محفوظة"
        }
    };

    const t = content[lang];

    const quickLinks = [
        { icon: <FaGem />, text: t.links[0] },
        { icon: <FaCube />, text: t.links[1] },
        { icon: <FaTruck />, text: t.links[2] },
        { icon: <FaLock />, text: t.links[3] }
    ];

    return (
        <div
            style={{
                fontFamily: isAR ? "Cairo, sans-serif" : "Inter, sans-serif",
                background: theme.bg,
                color: theme.text,
                direction: isAR ? "rtl" : "ltr"
            }}
        >

            {/* LANGUAGE BUTTON */}
            <button
                onClick={() => setLang(lang === "EN" ? "AR" : "EN")}
                style={{
                    position: "fixed",
                    bottom: 0,
                    right: 0,
                    zIndex: 999,
                    padding: "10px 18px",
                    background: "#fff",
                    color: "#000",
                    border: "none",
                    fontWeight: "700",
                    cursor: "pointer"
                }}
            >
                {lang === "EN" ? "AR" : "EN"}
            </button>

            {/* TOP BAR */}
            <div style={{ background: "#fff", color: "#000", textAlign: "center", padding: 8, fontWeight: "700" }}>
                {t.bar}
            </div>

            {/* HERO PHILOSOPHY SECTION */}
            <div
                style={{
                    position: "relative",
                    height: "90vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    backgroundImage:
                        `url(${Image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                }}
            >
                {/* overlay */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.75)"
                    }}
                />

                {/* content */}
                <div style={{ position: "relative", maxWidth: 900, padding: "0 20px" }}>
                    <h1 style={{ fontSize: "clamp(3rem,6vw,5rem)", margin: 0, fontWeight: 900 }}>
                        {t.title1} <br /> {t.title2}
                    </h1>

                    <p style={{ marginTop: 30, fontSize: "clamp(1.2rem,2vw,1.6rem)", color: "#ccc", lineHeight: 1.9 }}>
                        {t.heroText}
                    </p>

                    <button
                        className="btn_v"
                        onClick={() => navigate("/store")}
                        style={{
                            marginTop: 40,
                            padding: "18px 60px",
                            background: "#fff",
                            color: "#000",
                            border: "none",
                            fontWeight: 800,
                            fontSize:25,
                            letterSpacing: 1,
                            cursor: "pointer"
                        }}
                    >
                        {t.btn}
                    </button>
                </div>
            </div>

            {/* QUICK LINKS */}
            <div style={{ padding: "70px 20px", borderBottom: `1px solid ${theme.border}` }}>
                <div style={{ display: "flex", justifyContent: "center", gap: 50, flexWrap: "wrap" }}>
                    {quickLinks.map((q, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, fontWeight: 600 }}>
                            {q.icon} {q.text}
                        </div>
                    ))}
                </div>
            </div>

            {/* PHILOSOPHY TEXT BLOCK */}
            <div style={{ background: theme.bgSoft, padding: "120px 20px", textAlign: "center" }}>
                <FaShieldAlt size={50} />
                <h2 style={{ fontSize: "2.8rem", margin: "30px 0" }}>{t.philosophyTitle}</h2>

                <p style={{ maxWidth: 950, margin: "auto", lineHeight: 2.1, color: theme.textDim, fontSize: "1.5rem" }}>
                    {t.philosophyText}
                </p>
            </div>

            {/* SERVICES */}
            <div style={{ padding: "120px 20px", textAlign: "center" }}>
                <h2 style={{ fontSize: "2.8rem", marginBottom: 40 }}>{t.servicesTitle}</h2>

                <p style={{ maxWidth: 900, margin: "0 auto 60px", color: theme.textDim, lineHeight: 2.1, fontSize: "1.5rem" }}>
                    {t.servicesText}
                </p>

                <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 35, fontWeight: 600 }}>
                    {t.services.map((s, i) => <span key={i}>{s}</span>)}
                </div>
            </div>

            {/* FOOTER */}
            <div style={{ borderTop: `1px solid ${theme.border}`, padding: "60px 20px", textAlign: "center", color: theme.textDim }}>
                © 2026 — {t.copyright}
            </div>
        </div>
    );
}
