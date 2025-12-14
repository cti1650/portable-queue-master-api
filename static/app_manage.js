const API_URL = '/queue';
const tableBody = document.getElementById('queueListBody');
const loadingDiv = document.getElementById('loading');
const queueTable = document.getElementById('queueTable');

/**
 * 待ち行列リストをAPIから取得し、画面に表示する
 */
async function updateQueueList() {
    loadingDiv.style.display = 'block';
    queueTable.style.display = 'none';
    tableBody.innerHTML = ''; 

    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('APIからのデータ取得に失敗しました');
        }
        const data = await response.json();
        
        let html = '';
        data.forEach(entry => {
            const rowClass = `status-${entry.status.toLowerCase()}`;
            const createdAt = new Date(entry.created_at).toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'});
            
            let actionButtons = '';
            const num = entry.queue_number;
            
            if (entry.status === 'Waiting') {
                actionButtons += `<button class="action-btn btn-call" onclick="updateStatus(${num}, 'Serving')">対応開始</button>`;
                actionButtons += `<button class="action-btn btn-cancel" onclick="updateStatus(${num}, 'Cancelled')">キャンセル</button>`;
            } else if (entry.status === 'Serving') {
                actionButtons += `<button class="action-btn btn-complete" onclick="updateStatus(${num}, 'Completed')">完了</button>`;
                actionButtons += `<button class="action-btn btn-cancel" onclick="updateStatus(${num}, 'Cancelled')">キャンセル</button>`;
            } else {
                actionButtons = entry.status === 'Completed' ? '完了' : 'キャンセル済み';
            }

            html += `
                <tr class="${rowClass}">
                    <td>${num}</td>
                    <td>${entry.party_size}名</td>
                    <td>${entry.seat_type}</td>
                    <td>${createdAt}</td>
                    <td>${entry.status}</td>
                    <td>${actionButtons}</td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
        loadingDiv.style.display = 'none';
        queueTable.style.display = 'table';

    } catch (error) {
        console.error("リストの更新中にエラー:", error);
        loadingDiv.textContent = `エラーが発生しました: ${error.message}`;
    }
}

/**
 * 指定した整理番号のステータスを更新する (PUTリクエスト)
 */
async function updateStatus(queueNumber, newStatus) {
    if (!confirm(`${queueNumber}番のステータスを「${newStatus}」に変更しますか？`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${queueNumber}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`更新APIエラー: ${errorData.detail || '不明なエラー'}`);
        }

        // 成功したらリストを再読み込み
        updateQueueList();

    } catch (error) {
        console.error("ステータス更新中にエラーが発生:", error);
        alert(`ステータス更新に失敗しました: ${error.message}`);
    }
}


// ページロード時と、10秒ごとに自動更新
document.addEventListener('DOMContentLoaded', () => {
    updateQueueList();
    setInterval(updateQueueList, 10000);
    // updateStatus関数をグローバルに利用できるようにしておく
    window.updateStatus = updateStatus;
    window.updateQueueList = updateQueueList; // 手動更新ボタン用
});
