const axios = require("axios");

const sendReport = async () => {
    try {
        const baseUrl = process.env.FIREBASE_URL.replace(/\/+$/, "");
        // Thêm timestamp để tránh bị cache hoặc bị firewall chặn
        const finalUrl = `${baseUrl}/.json?auth_now=${Date.now()}`;

        console.log("Thử kết nối tới:", finalUrl);

        const response = await axios.get(finalUrl, {
            timeout: 10000,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const data = response.data;
        const trades = data && data.trades ? Object.values(data.trades) : [];
        
        let msg = `🔔 <b>THÔNG BÁO TỪ HỆ THỐNG</b>\n\n`;
        msg += `✅ Kết nối Firebase: <b>OK</b>\n`;
        msg += `📊 Số lệnh tìm thấy: <b>${trades.length}</b>\n`;

        if (trades.length > 0) {
            trades.forEach((t, i) => {
                msg += `\n${i+1}. <b>${t.title}</b>: ${t.direction} (Giá: ${t.openPrice})`;
            });
        }

        await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: msg,
            parse_mode: "HTML"
        });

        console.log("Thành công mỹ mãn!");
    } catch (error) {
        console.error("Lỗi 403 vẫn xuất hiện?");
        console.error("Chi tiết lỗi:", error.response ? JSON.stringify(error.response.data) : error.message);
        
        // Cố gắng báo lỗi về Telegram để biết GitHub đang nhìn thấy gì
        const errorText = `❌ Lỗi kết nối: ${error.message}\nStatus: ${error.response ? error.response.status : 'N/A'}`;
        await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: errorText
        }).catch(() => {});
    }
};

sendReport();
