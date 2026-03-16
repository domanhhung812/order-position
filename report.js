const axios = require("axios");

const FIREBASE_URL = process.env.FIREBASE_URL;
const TG_TOKEN = process.env.TELEGRAM_TOKEN;
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendReport() {
    try {
        // Tự động làm sạch link: bỏ dấu gạch chéo thừa và thêm .json
        const cleanUrl = FIREBASE_URL.replace(/\/+$/, "");
        const finalUrl = `${cleanUrl}/trades.json`;

        console.log("Đang kết nối tới:", finalUrl);

        const response = await axios.get(finalUrl);
        const trades = response.data ? Object.values(response.data) : [];
        
        const now = new Date();
        const activeTrades = trades.filter(t => !t.closeTime);
        const closedRecent = trades.filter(t => {
            if (!t.closeTime) return false;
            const closeDate = new Date(t.closeTime);
            return (now - closeDate) <= (48 * 60 * 60 * 1000);
        });

        let totalPnL = 0;
        closedRecent.forEach(t => {
            const p = (t.direction === 'MUA' ? (t.closePrice - t.openPrice) : (t.openPrice - t.closePrice)) * t.volume;
            totalPnL += p;
        });

        let message = `📊 <b>BÁO CÁO TRADING CLOUD</b>\n\n`;
        message += `🔹 <b>ĐANG MỞ: ${activeTrades.length} lệnh</b>\n`;
        message += `✅ <b>ĐÃ CHỐT (48H): ${closedRecent.length} lệnh</b>\n`;
        message += `💰 P&L: <b>$${totalPnL.toFixed(2)}</b>\n\n`;
        message += `🚀 <i>Hệ thống tự động vận hành</i>`;

        await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
            chat_id: TG_CHAT_ID,
            text: message,
            parse_mode: "HTML"
        });
        
        console.log("===> BOT ĐÃ NHẮN TIN THÀNH CÔNG!");
    } catch (error) {
        console.error("Lỗi chi tiết:", error.response ? error.response.status : error.message);
        if (error.response && error.response.status === 403) {
            console.log("LƯU Ý: Vui lòng kiểm tra lại Rules trên Firebase đã Publish chưa.");
        }
    }
}

sendReport();
