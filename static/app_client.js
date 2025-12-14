const API_URL = '/queue';

// フォームの要素を取得
const formDiv = document.getElementById('queueForm');
const resultDiv = document.getElementById('result');
const numberDisplay = document.getElementById('queueNumberDisplay');
const partySizeInput = document.getElementById('partySize');
const seatTypeSelect = document.getElementById('seatType');
const errorMessage = document.getElementById('errorMessage');

/**
 * フォームの内容をAPIに送信し、発券処理を行う
 */
async function submitQueue() {
    errorMessage.style.display = 'none';

    const partySize = parseInt(partySizeInput.value);
    const seatType = seatTypeSelect.value;
    
    if (isNaN(partySize) || partySize <= 0) {
        showError("人数を正しく入力してください。");
        return;
    }

    const payload = {
        party_size: partySize,
        seat_type: seatType
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`APIエラー: ${errorData.detail || '不明なエラー'}`);
        }

        const entry = await response.json();
        
        // 結果表示
        numberDisplay.textContent = entry.queue_number;
        formDiv.style.display = 'none';
        resultDiv.style.display = 'block';

    } catch (error) {
        console.error("発券中にエラーが発生しました:", error);
        showError(`発券に失敗しました。時間をおいて再度お試しください。(${error.message})`);
    }
}

/**
 * 結果表示からフォームに戻す
 */
function resetForm() {
    resultDiv.style.display = 'none';
    formDiv.style.display = 'block';
    // フォーム内容をリセット
    partySizeInput.value = 2;
    seatTypeSelect.value = 'Table';
    errorMessage.style.display = 'none';
}

/**
 * エラーメッセージを表示する
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// ページロード時の初期設定
document.addEventListener('DOMContentLoaded', () => {
    formDiv.style.display = 'block';
    resultDiv.style.display = 'none';
    // submitQueue関数とresetForm関数をグローバルに利用できるようにしておく
    window.submitQueue = submitQueue;
    window.resetForm = resetForm;
});
