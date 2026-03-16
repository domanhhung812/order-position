const axios = require("axios");

const FIREBASE_URL = process.env.FIREBASE_URL;
const TG_TOKEN = process.env.TELEGRAM_TOKEN;
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendReport() {
    try {
        const cleanUrl = FIREBASE_URL.replace(/\/+$/, "");
        const finalUrl = `${cleanUrl}/trades.json`;

        const response = await axios.get(finalUrl);
        const trades = response.data ? Object.values(response.data) : [];
        
        const now = new Date();
        const activeTrades = trades.filter(t => !t.closeTime);
        const closedRecent = trades.filter(t => t.closeTime); // Lấy tất cả lệnh đã đóng để test

        let message = `📊 <b>KẾT NỐI THÀNH CÔNG!</b>\n\n`;
        message += `🔹 Đang mở: ${activeTrades.length}\n`;
        message += `✅ Tổng đã đóng: ${closedRecent.length}\n`;

        await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
            chat_id: TG_CHAT_ID,
            text: message,
            parse_mode: "HTML"
        });
        console.log("Thành công!");
    } catch (error) {
        const errorMsg = `❌ <b>LỖI BOT:</b> ${error.message}\nLink: ${FIREBASE_URL}`;
        await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
            chat_id: TG_CHAT_ID,
            text: errorMsg
        }).catch(() => {});
        console.error("Lỗi:", error.message);
    }
}
sendReport();
