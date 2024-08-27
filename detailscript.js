let db;

        // IndexedDBデータベースのオープン
        const request = indexedDB.open('fileManagerDB', 1);

        request.onsuccess = function(event) {
            db = event.target.result;
            displayFileDetails();
        };

        request.onerror = function(event) {
            console.error('Database error:', event.target.errorCode);
        };

        function getFileIdFromURL() {
            const params = new URLSearchParams(window.location.search);
            return params.get('id');
        }

        function displayFileDetails() {
            const fileId = Number(getFileIdFromURL());
            if (!fileId) {
                alert('無効なファイルIDです。');
                return;
            }

            const transaction = db.transaction(['files'], 'readonly');
            const objectStore = transaction.objectStore('files');
            const request = objectStore.get(fileId);

            request.onsuccess = function(event) {
                const fileData = event.target.result;
                if (fileData) {
                     let fileSizeCr; // 変数をここで宣言
            
                // ファイルサイズをMBに変換
                if (fileData.fileSize >= 1024 && fileData.fileSize < 1024 * 1024) {
                    fileSizeCr = (fileData.fileSize / 1024).toFixed(2) + ' KB'; // KBに変換
                } else if (fileData.fileSize >= 1024 * 1024 && fileData.fileSize < 1024 * 1024 * 1024) {
                    fileSizeCr = (fileData.fileSize / (1024 * 1024)).toFixed(2) + ' MB'; // MBに変換
                } else if (fileData.fileSize >= 1024 * 1024 * 1024) {
                    fileSizeCr = (fileData.fileSize / (1024 * 1024 * 1024)).toFixed(2) + ' GB'; // GBに変換
                } else {
                    fileSizeCr = fileData.fileSize + ' B'; // バイトで表示
                }
                    const detailsDiv = document.getElementById('fileDetails');
                    detailsDiv.innerHTML = `
                        <p>ファイル名: ${fileData.fileName}</p>
                        <p>投稿者: ${fileData.uploaderName}</p>
                        <p>アップロード日時: ${fileData.uploadDate}</p>
                        <p>パスワードの有無: ${fileData.hasPassword ? 'あり' : 'なし'}</p>
                        <p>ファイル形式: ${fileData.fileExtension}</p> 
                        <p>ファイルサイズ: ${fileSizeCr}</p> 
                        <p>備考欄: ${fileData.comment}</p> 
                        <button id="downloadButton">ダウンロード</button>
                    `;
                     // ダウンロードボタンのイベントリスナーを追加
            const downloadButton = document.getElementById('downloadButton');
            downloadButton.addEventListener('click', () => {
                if (fileData.hasPassword) {
                    const enteredPassword = prompt('パスワードを入力してください:');
                    if (enteredPassword === fileData.password) {
                        downloadFile(fileData.fileName, fileData.fileContent);
                    } else {
                        alert('パスワードが違います。');
                    }
                } else {
                    downloadFile(fileData.fileName, fileData.fileContent);
                }
            });
                } else {
                    alert('ファイルが見つかりません。');
                }
            };
            

            request.onerror = function(event) {
                console.error('Error retrieving file from database:', event.target.errorCode);
            };
            function downloadFile(fileName, fileContent) {
                const blob = new Blob([fileContent]);
                const url = URL.createObjectURL(blob);
            
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.click();
            
                URL.revokeObjectURL(url);
            }
        }