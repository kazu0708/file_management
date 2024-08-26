let db;

// IndexedDBデータベースのオープンまたは作成
const request = indexedDB.open('fileManagerDB', 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;

    // オブジェクトストアの作成
    const objectStore = db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
    objectStore.createIndex('fileName', 'fileName', { unique: false });
    objectStore.createIndex('uploaderName', 'uploaderName', { unique: false });
    objectStore.createIndex('uploadDate', 'uploadDate', { unique: false });
    objectStore.createIndex('hasPassword', 'hasPassword', { unique: false });
    objectStore.createIndex('password', 'password', { unique: false });
};

request.onsuccess = function(event) {
    db = event.target.result;
    displayFiles();
};

request.onerror = function(event) {
    console.error('Database error:', event.target.errorCode);
};

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileUp');
    const uploaderNameInput = document.getElementById('name');
    const passwordInput = document.getElementById('passwordInput');
    const submitButton = document.getElementById('submitButton');
    const fileTableBody = document.querySelector('#fileTable tbody');

    // ファイルのアップロードと保存
    submitButton.addEventListener('click', (event) => {
        event.preventDefault();

        const files = fileInput.files;
        const uploaderName = uploaderNameInput.value;
        const password = passwordInput.value;
        const hasPassword = password !== '';
        const now = new Date();
        const uploadDate = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();

        if (files.length === 0 || uploaderName.trim() === '') {
            alert('ファイルと投稿者名を入力してください。');
            return;
        }

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const transaction = db.transaction(['files'], 'readwrite');
            const objectStore = transaction.objectStore('files');

            const fileData = {
                fileName: file.name,
                uploaderName: uploaderName,
                uploadDate: uploadDate,
                hasPassword: hasPassword,
                password: hasPassword ? password : null,
                fileContent: file // ファイルデータを保存
            };

            const request = objectStore.add(fileData);
            request.onsuccess = function() {
                console.log('File added to the database.');
                // ファイルアップロード後にテーブルに追加して表示
                addFileToTable(fileData);
            };

            request.onerror = function(event) {
                console.error('Error adding file to database:', event.target.errorCode);
            };
        }

        // フォームをリセット
        fileInput.value = '';
        uploaderNameInput.value = '';
        passwordInput.value = '';
    });

    // 保存されたファイルの表示
    function displayFiles() {
        fileTableBody.innerHTML = '';
        const transaction = db.transaction(['files'], 'readonly');
        const objectStore = transaction.objectStore('files');

        objectStore.openCursor().onsuccess = function(event) {
            const cursor = event.target.result;

            if (cursor) {
                addFileToTable(cursor.value);
                cursor.continue();
            }
        };
    }

    // ファイルをテーブルに追加する関数
    function addFileToTable(fileData) {
        const row = document.createElement('tr');

        // ファイル名
        const fileNameCell = document.createElement('td');
        fileNameCell.textContent = fileData.fileName;
        row.appendChild(fileNameCell);

        // ファイル投稿者名
        const uploaderNameCell = document.createElement('td');
        uploaderNameCell.textContent = fileData.uploaderName;
        row.appendChild(uploaderNameCell);

        // アップロード日付
        const uploadDateCell = document.createElement('td');
        uploadDateCell.textContent = fileData.uploadDate;
        row.appendChild(uploadDateCell);

        // パスワードの有無
        const hasPasswordCell = document.createElement('td');
        hasPasswordCell.textContent = fileData.hasPassword ? 'あり' : 'なし';
        row.appendChild(hasPasswordCell);

        // ダウンロードボタン
        const downloadCell = document.createElement('td');
        const downloadButton = document.createElement('button');
        downloadButton.textContent = 'Download';
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
        downloadCell.appendChild(downloadButton);
        row.appendChild(downloadCell);

        // 削除ボタン
        const deleteCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '削除';
        deleteButton.addEventListener('click', () => {
            deleteFile(fileData.id, row);
        });
        deleteCell.appendChild(deleteButton);
        row.appendChild(deleteCell);

        fileTableBody.appendChild(row);
    }

    // ファイルのダウンロード処理
    function downloadFile(fileName, fileContent) {
        const blob = new Blob([fileContent]);
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();

        URL.revokeObjectURL(url);
    }

    // ファイルの削除処理
    function deleteFile(id, row) {
        const transaction = db.transaction(['files'], 'readwrite');
        const objectStore = transaction.objectStore('files');
        const request = objectStore.delete(id);

        request.onsuccess = function() {
            console.log('File deleted from the database.');
            row.remove(); // テーブルから行を削除
        };

        request.onerror = function(event) {
            console.error('Error deleting file from database:', event.target.errorCode);
        };
    }

    request.onsuccess = function(event) {
        db = event.target.result;
        const transaction = db.transaction(['files'], 'readonly');
        transaction.oncomplete = function() {
            console.log("Transaction completed: database modification finished.");
            displayFiles();
        };
    
        transaction.onerror = function(event) {
            console.error("Transaction error: ", event.target.errorCode);
        };
    };
});
