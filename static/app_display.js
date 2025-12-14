const API_URL = '/queue';

async function updateDisplay() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // データを分類・抽出
        const waitingEntries = data.filter(entry => entry.status === 'Waiting');
        const servingEntries = data.filter(entry => entry.status === 'Serving');
        
        // 待ち行列の先頭
        const nextWaitingEntry = waitingEntries.sort((a, b) => a.queue_number - b.queue_number)[0];

        // 対応中の番号
        const servingNumber = servingEntries.length > 0 
            ? servingEntries.map(e => e.queue_number).join(', ') 
            : '---';

        // 画面の要素を更新
        document.getElementById('servingNumber').textContent = servingNumber;
        document.getElementById('waitingCount').textContent = `${waitingEntries.length} 組`;
        document.getElementById('nextWaiting').textContent = nextWaitingEntry ? nextWaitingEntry.queue_number : '待ち組なし';
        
    } catch (error) {
        console.error("表示情報の取得中にエラーが発生しました:", error);
        document.getElementById('servingNumber').textContent = '接続エラー';
        document.getElementById('waitingCount').textContent = '---';
    }
}

updateDisplay();
// 5秒ごとに自動更新
setInterval(updateDisplay, 5000);
