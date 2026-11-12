# 拾頁｜統計與 R 語言筆記

一個繁體中文筆記整理網站，以描述統計、機率分配、統計推論、迴歸分析、R 語言實作五個主題，整理觀念、程式碼與練習。

## 已有功能
- 六篇公開示範筆記，含官方 R 文件連結。
- 全文搜尋、主題分類、日期／標題排序。
- 收藏、閱讀、複製 R 程式碼。
- 新增與編輯個人筆記、刪除個人筆記、還原示範版本。
- localStorage 本機儲存、JSON 匯出／匯入；不同內容衝突時保留為另一篇。
- 響應式版面、鍵盤焦點、原生 dialog 對話框。

個人資料只儲存在目前瀏覽器與來源網址，不會跨裝置同步。清除網站資料前請先匯出備份。網站是整理與閱讀工具，不會執行 R 程式碼；範例可複製到 R 或 RStudio 執行。

## 本機啟動
在專案根目錄執行：
```powershell
python -m http.server 4317 --directory dist
```
瀏覽 `http://localhost:4317`。不需要安裝 npm 套件。請使用 HTTP 預覽，以確保瀏覽器儲存與剪貼簿行為一致。

## 新增公開筆記
先讀 [AGENTS.md](./AGENTS.md)，再將符合 schema 的物件加入 `dist/notes.js` 的 `SEED_NOTES`。讀者按網站的「新增筆記」只會建立本機個人內容；要讓所有訪客都看得到，需修改公開資料並重新部署。

## GitHub Pages 部署
1. 在自己的 GitHub 建立 public repository，例如 `shiye-notes`。
2. 將這個專案的完整內容上傳到 repository 根目錄，保留 `.github/workflows/pages.yml` 與 `dist/` 結構；不要把 zip 本身當作網站檔案上傳。
3. 到 repository 的 **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**。
4. 在 **Actions** 頁面手動執行 **Deploy static site to Pages**，或將修改 push 到 `main` 分支。初次上傳若早於 Pages 設定，請手動重新執行。
5. 等待 workflow 成功，從 Pages 設定或 workflow 的 deployment URL 取得真正網站連結，並用登出／無痕視窗確認老師可開啟。

若使用其他預設分支，調整 workflow 中 `branches: [main]`。網站使用相對路徑，可部署於 repository 子路徑。規範下載副本需與根目錄一致。

官方操作參考：[建立 GitHub Pages 網站](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)、[自訂 GitHub Actions 工作流程](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## 作業對應
| 要求 | 專案對應 |
| --- | --- |
| 自訂專案 | 統計與 R 語言筆記整理網站 |
| AI 專案規範 | 根目錄 `AGENTS.md` |
| 可瀏覽頁面 | `dist/index.html` 與完整筆記閱讀功能 |
| GitHub 專案 | 將本專案上傳自己的 repository；目前尚未代建 GitHub repo |
| 公開網站 | 透過上述 Pages workflow 發布；私人 Sites 預覽不等於老師可公開瀏覽 |
| 後續擴充說明 | AGENTS.md 的資料格式與新增任務範例 |

## 驗證
JavaScript 語法檢查：
```powershell
node --check dist/app.js
node --check dist/notes.js
```
網站功能驗證結果見 `VALIDATION.md`。統計說明以 R 官方文件為參考；瀏覽器功能驗證與 R 程式實際執行是不同項目。
