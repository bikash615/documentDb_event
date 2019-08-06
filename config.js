var config = {}

// config.host = "<URI TO YOUR DOCUMENTDB ACCOUNT>";
//local
config.host = "https://192.168.99.91:8081/"
//test
// config.host= "https://ck-test.documents.azure.com:443/"
//Production
// config.host = "https://ckdocumentdb.documents.azure.com:443/"

// config.authKey = "<YOURKEY>";
//local
config.authKey = "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="
//test
// config.authKey='IZ6fMCM2FzOpQzeeIPl6hR0zD01N8lb1jgj4Xr2v9oGUVA3zR4JQUCxjyI4nu3UNIUwMGi8hKwq2vY2XTFE5kQ=='

//production
// config.authKey='fQ2zw3F7biZe0dw/f4HGDwOuj9PDRv9aNjgWbBPH3xQ2Gqrwlst/pBYNcPJpP/BCvXyePZwyKR60oAKVrPrcWw=='

// config.databaseId = "<YOUR DATABASE>";

config.databaseId = "CK"
// config.collectionId = "APP_DATA_DEV_01"
// config.collectionId = "<YOUR COLLECTION>";
// config.collectionId = "APP_DATA"
// config.collectionId = "CK01_01"

config.collectionId = "APP_PRODUCTION_BACKUP_01"
config.collectionId1 = "EVENT_LOGS_PRODUCTION_BACKUP"

// config.testCycles = 10;

module.exports = config;
