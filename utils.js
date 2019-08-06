//we require the DocumentDB node.js package
var DocumentDBClient = require('documentdb').DocumentClient;

//creat utils class that exposes functionality
var utils = {
    //go find a database
    getOrCreateDatabase: function (client, databaseId, callback) {
        var querySpec = {
            query: 'SELECT * FROM root r WHERE r.id=@id',
            parameters: [{
                name: '@id',
                value: databaseId
            }]
        };
        //search for our DB
        client.queryDatabases(querySpec).toArray(function (err, results) {
            if (err) {
                callback(err);

            } else {
                if (results.length === 0) {
                    var databaseSpec = {
                        id: databaseId
                    };
                    //no db, that's why we create one
                    client.createDatabase(databaseSpec, function (err, created) {
                        callback(null, created);
                    });

                } else {
                    //db already exists, return it
                    callback(null, results[0]);
                }
            }
        });
    },

    //get or create a collection inside the db
    getOrCreateCollection: function (client, databaseLink, collectionId, callback) {
        var querySpec = {
            query: 'SELECT * FROM root r WHERE r.id=@id',
            parameters: [{
                name: '@id',
                value: collectionId
            }]
        };

        client.queryCollections(databaseLink, querySpec).toArray(function (err, results) {
            if (err) {
                callback(err);

            } else {
                if (results.length === 0) {
                    var collectionSpec = {
                        id: collectionId
                    };

                    var requestOptions = {
                        offerType: 'S1'
                    };
                    //create a S1 collection inside the database and return
                    client.createCollection(databaseLink, collectionSpec, requestOptions, function (err, created) {
                        callback(null, created);
                    });

                } else {
                    //return database
                    callback(null, results[0]);
                }
            }
        });
    },

    find: function (client, collection, querySpec, callback) {
        var self = this;
        client.queryDocuments(collection._self, querySpec).toArray(function (err, results) {
            if (err) {
                if (err.code == 'ECONNRESET' || err.code == 'ENOTFOUND') {
                    self.find(client, collection, querySpec, callback);
                } else if (err.code === 429) {
                    let retryAfter = err.retryAfterInMilliseconds || 500;
                    setTimeout(() => self.find(client, collection, querySpec, callback), retryAfter);
                    console.log('retrying after ', retryAfter);
                    console.log("error for doc", err)
                    
                } else {
                    console.log('error inside find utils', err);
                    console.log('error inside find utils', err.code);

                    callback(err);
                }

            } else {
                callback(null, results);
            }
        });
    },

    //create a dummy document containing two properties
    createDocument: function (client, collection, callback) {
        var document = {
            firstName: "Jane",
            lastName: "Doe"
        }
        client.createDocument(collection._self, document, function (err, doc) {
            if (err) {
                //something went wrong, return the error
                callback(err);

            } else {
                console.log('Id of created record', doc.id);
                //success, return the document
                callback(null, doc, collection);
            }
        });
    },

    // replace document
    replaceDocument: function (client, documentLink, document, callback) {
        var self = this;
        client.replaceDocument(documentLink, document, function (err, doc) {
            if (err) {

                if (err.code == 'ECONNRESET' || err.code == 'ENOTFOUND') {
                    self.replaceDocument(client, documentLink, document, callback);
                } else if (err.code === 429) {
                    let retryAfter = err.retryAfterInMilliseconds || 500;
                    setTimeout(() => self.replaceDocument(client, documentLink, document, callback), retryAfter);
                    console.log('retrying after ', retryAfter);
                    console.log("error for doc", document.id)
                } else {
                    console.log('error inside replace', err);
                    console.log("error for doc", document.id)
                    
                    callback(err);
                }
            } else {
                callback(doc);
            }
        });
    }
};

module.exports = utils;