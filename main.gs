const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1yVZ7OH7jGxrxHmX4CG2vG3hpIPbk9zFsvOmduvb8EJI/';
const KEY_SHEET_NAME = 'spot-keys';
const LOG_SHEET_NAME = 'log';

function test() {
  const keysSheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL).getSheetByName(KEY_SHEET_NAME);
  console.log(keysSheet.getRange("A1:C20").getValues());
}

/**
 * キーを照合し、対応するスポット情報を取得する関数
 * @param {string} spotId - 照合するスポットID
 * @param {string} secretKey - 照合するシークレットキー
 * @return {object|null} 照合に成功した場合はスポット情報を含むオブジェクト、失敗した場合はnull
 */
function validateKey(spotId, secretKey) {
  try {
    const keysSheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL).getSheetByName(KEY_SHEET_NAME);
    const keysTable = keysSheet.getRange("A1:C20").getValues();
    const foundRow = keysTable.find(row => row[0] === spotId);
    
    if (foundRow && secretKey === foundRow[1]) {
      return {
        success: true,
        spotName: foundRow[2]
      };
    }
  } catch (error) {
    console.error("Error in validateKey: ", error);
    return null; // エラー時もnullを返す
  }
  return null;
}

/**
 * ログをスプレッドシートに追記する関数
 * @param {string} deviceId - デバイスID
 * @param {string} spotId - スポットID
 * @param {string} secretKey - シークレットキー
 * @param {boolean} success - キー照合の成功/失敗
 */
function logAccess(deviceId, spotId, secretKey, success) {
  try {
    const logSheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL).getSheetByName(LOG_SHEET_NAME);
    const timestamp = new Date();
    logSheet.appendRow([
      timestamp,
      deviceId,
      spotId,
      secretKey,
      success ? 'true' : 'false'
    ]);
  } catch (error) {
    console.error("Error in logAccess: ", error);
  }
}

/**
 * Webリクエストを受け取ってキーを照合し、ログを記録するメインの関数
 * @param {object} e - GETリクエストのパラメータを含むイベントオブジェクト
 */
function doGet(e) {
  const params = e.parameter;
  const { spot, key, device } = params;
  
  let response = { success: false, message: 'Invalid key.' };

  // パラメータチェック
  if (!spot || !key) {
    response.message = 'Missing parameters.';
  } else {
    // キーの照合
    const validationResult = validateKey(spot, key);
    if (validationResult) {
      response = validationResult;
    }
  }

  // ログの記録
  logAccess(device || '', spot || '', key || '', response.success);

  // 結果をJSON形式で返す
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}