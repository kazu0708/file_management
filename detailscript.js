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
                    const detailsDiv = document.getElementById('fileDetails');
                    detailsDiv.innerHTML = `
                        <p>ファイル名: ${fileData.fileName}</p>
                        <p>投稿者: ${fileData.uploaderName}</p>
                        <p>アップロード日時: ${fileData.uploadDate}</p>
                        <p>パスワードの有無: ${fileData.hasPassword ? 'あり' : 'なし'}</p>
                    `;
                } else {
                    alert('ファイルが見つかりません。');
                }
            };

            request.onerror = function(event) {
                console.error('Error retrieving file from database:', event.target.errorCode);
            };
        }