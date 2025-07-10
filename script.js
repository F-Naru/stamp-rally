const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbyjrqr1GtvUVPnlqKAGFfXzNol2IkQR4i1b3xjcuhYy_x-PGtfys7ZNuk5PgJYPceoqtg/exec';

/**
 * デバイス用のユニークIDを取得または生成する関数
 * @returns {string} デバイスID
 */
function getDeviceId() {
  let deviceId = localStorage.getItem('myRallyDeviceId');
  if (!deviceId) { // new
    deviceId = crypto.randomUUID();
    localStorage.setItem('myRallyDeviceId', deviceId);
  }
  return deviceId;
}

document.addEventListener('DOMContentLoaded', () => {
    verifyStampWithGas(); // GAS問い合わせ
    updateStampDisplay(); // LocalStorageのスタンプ表示更新
});

/**
 * URLパラメータをGASに送信してキーを照合し、結果に応じてスタンプを保存する非同期関数
 */
async function verifyStampWithGas() {
    const urlParams = new URLSearchParams(window.location.search);
    const spotId = urlParams.get('spot');
    const secretKey = urlParams.get('key');

    if (spotId && secretKey) {
        const deviceId = getDeviceId();
        const requestUrl = `${GAS_API_URL}?spot=${spotId}&key=${secretKey}&device=${deviceId}`;

        try {
            const response = await fetch(requestUrl);
            const result = await response.json();

            if (result.success) { // OK
                const stamps = JSON.parse(localStorage.getItem('myStamps')) || {};
                
                if (!stamps[spotId]) { // store stamp
                    stamps[spotId] = { acquired: true, date: new Date().toISOString(), name: result.spotName };
                    localStorage.setItem('myStamps', JSON.stringify(stamps));
                    showAcquiredMessage(`${result.spotName}のスタンプをゲット！`);
                    updateStampDisplay();
                }
            } else {
                console.error('invalid key:', result.message);
            }
        } catch (error) {
            console.error('error:', error);
        } finally {
            history.replaceState(null, '', window.location.pathname);
        }
    }
}

/**
 * LocalStorageのデータに基づいてスタンプ台紙の表示を更新する関数
 */
function updateStampDisplay() {
    const stamps = JSON.parse(localStorage.getItem('myStamps')) || {};
    document.querySelectorAll('.stamp-item').forEach(el => el.classList.remove('acquired'));
    
    for (const spotId in stamps) {
        if (stamps[spotId].acquired) {
            const stampElement = document.getElementById(`stamp-${spotId}`);
            if (stampElement) {
                stampElement.classList.add('acquired');
            }
        }
    }
}

function showAcquiredMessage(text) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = text;
    messageElement.classList.add('show');
    setTimeout(() => { messageElement.classList.remove('show'); }, 3000);
}