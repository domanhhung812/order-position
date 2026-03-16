const axios = require("axios");

// Lấy thông tin từ biến môi trường của GitHub (Secrets)
const DB_URL = process.env.FIREBASE_URL;
const TG_TOKEN = process.env.TELEGRAM_TOKEN;
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendReport() {
    try {
        // Lấy dữ liệu từ Firebase
        const response = await axios.get(`${DB_URL}/trades.json`);
        const trades = response.data ? Object.values(response.data) : [];
        
        // Lấy ngày hôm nay (format VN)
        const today = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
        
        // Lọc lệnh đã đóng trong ngày hôm nay
        const closedToday = trades.filter(t => t.closeTime && new Date(t.closeTime).toLocaleDateString('en-GB') === today);
        
        let totalPnL = 0;
        closedToday.forEach(t => {
            const exitP = parseFloat(t.closePrice);
            const openP = parseFloat(t.openPrice);
            const vol = parseFloat(t.volume);
            const p = (t.direction === 'MUA' ? (exitP - openP) : (openP - exitP)) * vol;
            totalPnL += p;
        });

        const activeCount = trades.filter(t => !t.closeTime).length;

        const message = `🔔 <b>BÁO CÁO TỰ ĐỘNG - ${today}</b>\n\n` +
                        `✅ Lệnh đã đóng: ${closedToday.length}\n` +
                        `💰 Lợi nhuận: <b>$${totalPnL.toFixed(2)}</b>\n` +
                        `📊 Lệnh đang chạy: ${activeCount}\n\n` +
                        `🚀 <i>Keep trading, Hưng!</i>`;

        await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
            chat_id: TG_CHAT_ID,
            text: message,
            parse_mode: "HTML"
        });
        console.log("Đã gửi báo cáo thành công!");
    } catch (error) {
        console.error("Lỗi:", error.message);
    }
}

sendReport();
