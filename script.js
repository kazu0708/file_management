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
};

request.onsuccess = function(event) {
    db = event.target.result;
    displayFiles();
};

request.onerror = function(event) {
    console.error('Database error:', event.target.errorCode);
};

// ファイルアップロードのフォーム要素を取得
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
    const uploadDate = new Date().toLocaleDateString();

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
            fileContent: file // ファイルデータを保存
        };

        const request = objectStore.add(fileData);
        request.onsuccess = function() {
            console.log('File added to the database.');
            displayFiles();
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
            const row = document.createElement('tr');

            // ファイル名
            const fileNameCell = document.createElement('td');
            fileNameCell.textContent = cursor.value.fileName;
            row.appendChild(fileNameCell);

            // ファイル投稿者名
            const uploaderNameCell = document.createElement('td');
            uploaderNameCell.textContent = cursor.value.uploaderName;
            row.appendChild(uploaderNameCell);

            // アップロード日付
            const uploadDateCell = document.createElement('td');
            uploadDateCell.textContent = cursor.value.uploadDate;
            row.appendChild(uploadDateCell);

            // パスワードの有無
            const hasPasswordCell = document.createElement('td');
            hasPasswordCell.textContent = cursor.value.hasPassword ? 'あり' : 'なし';
            row.appendChild(hasPasswordCell);

            // ダウンロードボタン
            const downloadCell = document.createElement('td');
            const downloadButton = document.createElement('button');
            downloadButton.textContent = 'Download';
            downloadButton.addEventListener('click', () => {
                downloadFile(cursor.value.fileName, cursor.value.fileContent);
            });
            downloadCell.appendChild(downloadButton);
            row.appendChild(downloadCell);

            fileTableBody.appendChild(row);

            cursor.continue();
        }
    };
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
