const axios = require("axios");

const FIREBASE_URL = process.env.FIREBASE_URL;
const TG_TOKEN = process.env.TELEGRAM_TOKEN;
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendReport() {
    try {
        // Tự động xử lý link chuẩn
        const cleanUrl = FIREBASE_URL.replace(/\/+$/, "");
        const finalUrl = `${cleanUrl}/.json`; // Đọc file gốc để lấy mục trades

        const response = await axios.get(finalUrl);
        
        // Lấy danh sách lệnh từ mục trades
        const tradesData = response.data && response.data.trades ? response.data.trades : {};
        const trades = Object.values(tradesData);
        
        const activeTrades = trades.filter(t => !t.closeTime);

        let message = `🚀 <b>KẾT NỐI THÀNH CÔNG!</b>\n\n`;
        message += `📊 <b>Lệnh đang mở: ${activeTrades.length}</b>\n`;
        
        if (activeTrades.length > 0) {
            activeTrades.forEach(t => {
                message += `- ${t.title}: ${t.direction} ${t.volume} lot (Giá: ${t.openPrice})\n`;
            });
        }

        await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
            chat_id: TG_CHAT_ID,
            text: message,
            parse_mode: "HTML"
        });
        
        console.log("===> ĐÃ GỬI BÁO CÁO QUA TELEGRAM!");
    } catch (error) {
        console.error("Lỗi:", error.message);
    }
}
sendReport();
