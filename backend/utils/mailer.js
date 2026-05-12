const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendMissEmail = async (memberName, memberEmail) => {
    if (!memberEmail) return;

    const mailOptions = {
        from: `"Bike Turn Tracker" <${process.env.EMAIL_USER}>`,
        to: memberEmail,
        subject: `🏍️ You missed your bike turn, ${memberName}!`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background: #1a1a2e; color: #fff; border-radius: 12px;">
                <h2 style="color: #e94560;">Hey ${memberName}! 👋</h2>
                <p style="font-size: 16px; color: #ccc;">
                    You missed your bike turn today. The team relies on everyone taking their fair share to keep things running smoothly.
                </p>
                <p style="font-size: 16px; color: #ccc;">
                    Please make sure to give your bike for the next round so no one gets overburdened. Collaboration keeps us going! 🤝
                </p>
                <hr style="border-color: #333;" />
                <p style="font-size: 12px; color: #888;">— Bike Turn Tracker Team</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Miss email sent to ${memberName} (${memberEmail})`);
    } catch (err) {
        console.error(`Failed to send email to ${memberName}:`, err.message);
    }
};

module.exports = { sendMissEmail };
