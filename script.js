let db;

// IndexedDBデータベースのオープンまたは作成
const request = indexedDB.open('fileManagerDB', 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;

    // オブジェクトストアの作成
    const objectStore = db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
    objectStore.createIndex('fileName', 'fileName', { unique: false });
};

request.onsuccess = function(event) {
    db = event.target.result;
    displayFiles();
};

request.onerror = function(event) {
    console.error('Database error:', event.target.errorCode);
};

// ファイルのアップロードと保存
uploadButton.addEventListener('click', () => {
    const files = fileInput.files;

    if (files.length === 0) {
        alert('Please select a file!');
        return;
    }

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const transaction = db.transaction(['files'], 'readwrite');
        const objectStore = transaction.objectStore('files');

        const fileData = {
            fileName: file.name,
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

    fileInput.value = '';
});

// 保存されたファイルの表示
function displayFiles() {
    fileList.innerHTML = '';
    const transaction = db.transaction(['files'], 'readonly');
    const objectStore = transaction.objectStore('files');

    objectStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;

        if (cursor) {
            const listItem = document.createElement('li');
            listItem.textContent = cursor.value.fileName;

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => {
                deleteFile(cursor.value.id);
            });

            listItem.appendChild(deleteButton);
            fileList.appendChild(listItem);

            cursor.continue();
        }
    };
}

// ファイルの削除
function deleteFile(id) {
    const transaction = db.transaction(['files'], 'readwrite');
    const objectStore = transaction.objectStore('files');

    const request = objectStore.delete(id);
    request.onsuccess = function() {
        console.log('File deleted from the database.');
        displayFiles();
    };

    request.onerror = function(event) {
        console.error('Error deleting file from database:', event.target.errorCode);
    };
}
