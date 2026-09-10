import nodemailer from "nodemailer"


// Generate random number for otp .***.***.
export async function random_num(count, min, max) {
    let numbers = "";
    for (let i = 0; i < count; i++) {
        numbers += Math.floor(Math.random() * (max - min + 1) + min).toString() // Return a single one digit .***.***.
    }
    return numbers // return the full digits OTP .***.***.
}
// Send otp code to the user with email .***.***.
export async function otp_sender(email, otp) {
    console.log(otp) // Checking the otp on the system .***.***.

    const user = process.env.EMAIL_USER;
    const pass = process.env.APPASS;

    if (!user || !pass) {
        throw new Error('Email service is not configured. Set EMAIL_USER and APPASS in .env');
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        secure: true,
        auth: {
            user,
            pass,
        }
    });

    const info = await transporter.sendMail({
        from: `"Qalam Support" <${user}>`,
        to: email,
        subject: 'OTP Verification',
        text: `Your OTP is: ${otp}`,
        html: `<h1>Hello Friend</h1><p>Your OTP is <strong>${otp}</strong></p>`,
    });

    return info;
}

// Send generic email with custom subject and HTML body .***.***.
export async function sendEmail(email, subject, htmlBody) {
    const transporter = await nodemailer.createTransport({
        service: "gmail",
        port: 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.APPASS,
        }
    })
    const info = await transporter.sendMail({
        from: 'Qalam Support',
        to: email,
        subject: subject,
        html: htmlBody,
    })

    return info
}