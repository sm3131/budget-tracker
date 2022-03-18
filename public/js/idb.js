let db;

const request = indexedDB.open('budget', 1);

request.onupgradeneeded = function (event) {
    // save a reference to the database 
    const db = event.target.result;
    // create an object store (table) called `new_money`, set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('new_money', { autoIncrement: true });
};

// upon a successful 
request.onsuccess = function (event) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;

    // check if app is online, if yes run uploadMoney() function to send all local db data to api
    if (navigator.onLine) {
        uploadMoney();
    }
};

request.onerror = function (event) {
    // log error here
    console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new transaction and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['new_money'], 'readwrite');

    // access the object store for `new_money`
    const moneyObjectStore = transaction.objectStore('new_money');

    // add record to store with add method
    moneyObjectStore.add(record);
}

function uploadMoney() {
    // open a transaction on the db
    const transaction = db.transaction(['new_money'], 'readwrite');

    // access the object store
    const moneyObjectStore = transaction.objectStore('new_money');

    // get all records from store and set to a variable
    const getAll = moneyObjectStore.getAll();

    getAll.onsuccess = function () {
        // if there was data in indexedDb's store, send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    // open one more transaction
                    const transaction = db.transaction(['new_money'], 'readwrite');
                    // access the new_money object store
                    const moneyObjectStore = transaction.objectStore('new_money');
                    // clear all items in the store
                    moneyObjectStore.clear();

                    alert('All saved money has been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}

window.addEventListener('online', uploadMoney);
