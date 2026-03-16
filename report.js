const axios = require("axios");

const DB_URL = process.env.FIREBASE_URL;
const TG_TOKEN = process.env.TELEGRAM_TOKEN;
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendReport() {
    try {
        const response = await axios.get(`${DB_URL}/trades.json`);
        const trades = response.data ? Object.values(response.data) : [];
        
        const now = new Date();
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        // 1. Lọc lệnh đang mở
        const activeTrades = trades.filter(t => !t.closeTime);
        
        // 2. Lọc lệnh đã đóng (Hôm nay + Hôm qua)
        const closedRecent = trades.filter(t => {
            if (!t.closeTime) return false;
            const closeDate = new Date(t.closeTime);
            // Kiểm tra nếu lệnh đóng trong vòng 48h qua
            return (now - closeDate) <= (2 * oneDayMs);
        });

        let totalPnL = 0;
        closedRecent.forEach(t => {
            const exitP = parseFloat(t.closePrice);
            const openP = parseFloat(t.openPrice);
            const vol = parseFloat(t.volume);
            const p = (t.direction === 'MUA' ? (exitP - openP) : (openP - exitP)) * vol;
            totalPnL += p;
        });

        // Tạo nội dung tin nhắn
        let message = `📊 <b>BÁO CÁO TRADING TỔNG HỢP</b>\n`;
        message += `<i>Cập nhật: ${now.toLocaleString('vi-VN')}</i>\n\n`;
        
        message += `🔹 <b>LỆNH ĐANG MỞ (${activeTrades.length}):</b>\n`;
        if (activeTrades.length > 0) {
            activeTrades.forEach(t => {
                message += `- ${t.title} (${t.direction} x${t.volume})\n`;
            });
        } else {
            message += `- Không có lệnh nào đang chạy.\n`;
        }

        message += `\n✅ <b>ĐÃ ĐÓNG (2 NGÀY GẦN NHẤT):</b>\n`;
        message += `- Số lệnh: ${closedRecent.length}\n`;
        message += `- Tổng P&L: <b>${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}</b>\n`;

        message += `\n🚀 <i>Chúc Hưng ngày mới giao dịch thuận lợi!</i>`;

        await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
            chat_id: TG_CHAT_ID,
            text: message,
            parse_mode: "HTML"
        });
        
        console.log("Đã gửi báo cáo tổng hợp thành công!");
    } catch (error) {
        console.error("Lỗi:", error.message);
    }
}

sendReport();
