var DocumentDBClient = require('documentdb').DocumentClient;
var utils = require('./utils')
var config = require('./config');
var fs = require('fs');
var jsonexport = require('jsonexport');
const constant = require('./constant');
xlsxj = require("xlsx-to-json");


var client = new DocumentDBClient(config.host, { masterKey: config.authKey },{
    DisableSSLVerification :true,
    EnableEndpointDiscovery : false,
    MediaReadMode : "Buffered",
    RequestTimeout : 10000,
    MediaRequestTimeout : 10000,
    PreferredLocations : [],
    RetryOptions: {}
});
var database, appDataCollection, eventLogCollection;

utils.getOrCreateDatabase(client, config.databaseId, createDatabaseCallback);

function createDatabaseCallback(err, db) {
    if (err) {
        console.log('error', err);
    } else {
        if (db) { //try get or create the collection and callback to createCollectionCallBack
            database = db;
            // utils.getOrCreateCollection(client, db._self, config.collectionId, createCKWGENCSVCallBack);
            // utils.getOrCreateCollection(client, db._self, config.collectionId, firstUpdateProduct)
            // utils.getOrCreateCollection(client, db._self, config.collectionId, updateVariationInProduct)
            // utils.getOrCreateCollection(client, db._self, config.collectionId, updateSchoolEntity)
            // utils.getOrCreateCollection(client, db._self, config.collectionId, createCollectionCallBack);
            // utils.getOrCreateCollection(client, db._self, config.collectionId, createCollectionForActivityLogsCallBack);     
            // utils.getOrCreateCollection(client, db._self, config.collectionId, updateCIPToStringInSchoolEntity)
            // utils.getOrCreateCollection(client, db._self, config.collectionId, getUnavailableSchoolId)
            // utils.getOrCreateCollection(client, db._self, config.collectionId, getUnavailableCIP)
            // utils.getOrCreateCollection(client, db._self, config.collectionId, getCareerData)
            // utils.getOrCreateCollection(client, db._self, config.collectionId, updateApiKeysEntity)
            // utils.getOrCreateCollection(client, db._self, config.collectionId, updateMedianPay)
            // utils.getOrCreateCollection(client, db._self, config.collectionId, updateDescriptionIoCareerMajor)
            // utils.getOrCreateCollection(client, db._self, config.collectionId, updateUnpublishToPublish)
            utils.getOrCreateCollection(client, db._self, config.collectionId, createNewCollection)    
            // utils.getOrCreateCollection(client, db._self, config.collectionId, checkInvalidMajors)         
            // utils.getOrCreateCollection(client, db._self, config.collectionId, getWorkgroups)                                
            // utils.getOrCreateCollection(client, db._self, config.collectionId, updateDiscovererHostURL)
            // utils.getOrCreateCollection(client, db._self, config.collectionId, updateCustomerIdToApiKeys)
        }
    }
};

function createNewCollection(err, coll) {
    appDataCollection = coll;
    let productName = 'ckp.US.base'
    let language='en'

    return
}

function checkInvalidMajors(err, coll) {
    appDataCollection = coll;
    let productName = 'ckp.US.base'
    let language='en'
    // let productName = 'sch.16880583-5e5d-4aad-b1b7-cb7a976318b0'
    // let language='en'

    if (err) {
        console.log('error', err);
    } else {
        var querySpec = {
            query: 'SELECT * FROM c WHERE c.id = @id',
            parameters: [
                {
                    name: '@id',
                    value: productName
                }
            ]
        };

        let newIP = [];
        let totalExistingIP = [];

        xlsxj({
            input: "test32.xlsx", 
            output: "test32.json"
            }, function(err, result) {
            if(err) {
                console.error(err);
            }

            utils.find(client, appDataCollection, querySpec, function (err, product) {
                if(product.length && product[0].workgroups && product[0].workgroups.length===0){
                    console.log("no ckwg data")
                    return;
                }
    
                let workGroupIds = '(';
    
                product[0].workgroups.forEach((workgroup, index)=>{
                    if(product[0].workgroups.length-1===index)
                        workGroupIds += `"${workgroup.id}")`
                    else
                        workGroupIds += `"${workgroup.id}",`
                })
    
                querySpec = {
                    query: `SELECT * FROM c WHERE c.id in ${workGroupIds}`,
                    parameters: []
                };
    
                // ckwgs start
                utils.find(client, appDataCollection, querySpec, function (err, ckwg) {
    
                    
                    ckwg.forEach(ckwgData=>{
                        if(ckwgData.instructionalPrograms.length>0){
                            ckwgData.instructionalPrograms.forEach(ip=>{
                                totalExistingIP.push({id: ip.id, workgroupId: ckwgData.classificationNumber})
                            })
                        }       
                        
                    });
                
                    result.forEach(ip=>{
                        if(ip.id){
                            newIP.push({id: ip.id, workgroupId: ip.workgroupId})
                        }
                    })

                    var res = newIP.filter(item1 => !totalExistingIP.some(item2 => (item2.id === item1.id && item2.workgroupId === item1.workgroupId)))
                    var json = JSON.stringify(res);
                    fs.writeFile(`nonExistingIp.json`, json, function(err) {
                        if(err) {
                            return console.log(err);
                        }
                    
                        console.log("Title file was saved!");
                    }); 
                    console.log('final response ', res)
                });
            });
            
        })
    }
}

function createCollectionForActivityLogsCallBack(err, coll) {
    appDataCollection = coll;

    if (err) {
        console.log('error', err);
    } else {
        var querySpec = {
            query: 'SELECT c.id FROM c WHERE  c.entity = @entity and c.customerId="966db4b8-ad7c-1da8-e1da-f5ae875b5664"',
            parameters: [
                {
                    name: '@entity',
                    value: 'activitylog'
                }
            ]
        };

        utils.find(client, appDataCollection, querySpec, function (err, result) {
            console.log(result.length);
            var countUpdated=result.length;

            utils.getOrCreateCollection(client, database._self, config.collectionId1, function (err, coll) {
                eventLogCollection = coll;

                for (i = 0; i < result.length; i++) {
                    console.log('============Sequence=================', i);
                    var querySpec1 = {
                        query: 'SELECT * FROM c WHERE c.id = @id',
                        parameters: [{
                            name: '@id',
                            value: result[i].id
                        }]
                    }

                    console.log('activitylog id', result[i].id);

                    utils.find(client, appDataCollection, querySpec1, function (err, result1) {
                        if (err) {
                            console.log('error inside find', err);
                        } else {
                            var length=result.length;
                            if (length > 0) {
                                var activityLog = result1[0];

                                activityLog.customerId='';
                                activityLog.modifiedName=[activityLog.modifiedName];
                                activityLog.sponsoredOrganizationId='0d83ac69-be4e-a76f-2310-336945663433';

                                utils.replaceDocument(client, activityLog._self, activityLog, function (updatedDiscoverer) {
                                    console.log('actvitylog.id updated', updatedDiscoverer.id);
                                    console.log("----------------updated left------------", countUpdated--);
                                });

                            }
                            else
                                console.log('No record found');
                        }
                    });


                }
                console.log('Operation completed');
            });
        });

    }
}

function createCollectionCallBack(err, coll) {
    appDataCollection = coll;
    let groupsTestData=[
        {
            "id": "1369db0b-957d-ce03-ec23-72eadb8a2069",
            "name": "Class of XI"
        },
        {
            "id": "96dd0cb1-afd9-0930-9f7d-6a2300957d1b",
            "name": "Class of XI"
        },
        {
            "id": "38af15da-128e-5fdd-a5d3-ff4bc84f7d34",
            "name": "Class of IX"
        },
        {
            "id": "127f7509-3a41-c404-98f1-5e148f119263",
            "name": "Class of IIX"
        },
        {
            "id": "54698428-167a-436e-d381-4e9caedc38c7",
            "name": "Class of IIX"
        },
        {
            "id": "201f9216-3602-37c2-804e-30fd450f89a9",
            "name": "Class of IV"
        },
        {
            "id": "d168a333-baea-ce04-100c-c22eaf643082",
            "name": "Test"
        },
        {
            "id": "67ed527f-541c-5bc6-eaa0-e944e6fbb285",
            "name": "Group1"
        },
        {
            "id": "87589302-038f-b61c-cbe2-e1ffc2940839",
            "name": "Group 2"
        },
        {
            "id": "899df560-b24c-2cd7-dbbc-cc67d8d1a751",
            "name": "Group1"
        },
        {
            "id": "f3df0f16-828e-115b-9a04-f145d307c792",
            "name": "New Test Group"
        },
        {
            "id": "ab2c4c95-4511-84fc-52af-b00c59d57df6",
            "name": "Class of 2018"
        },
        {
            "id": "b83c10c2-2c4e-7998-034f-722b8d50ebf4",
            "name": "Group1"
        },
        {
            "id": "3599a038-6199-6461-e566-46c7fcbb4865",
            "name": "Class of 2018"
        },
        {
            "id": "9ac7f5a8-63e1-5f90-4771-e5602d1c7c40",
            "name": "class of 2007"
        },
        {
            "id": "5b49892a-4b4e-b7db-f756-e76eade9695d",
            "name": "Class of 2018"
        },
        {
            "id": "15d280bb-f65e-5d86-06c2-e11cfbb11938",
            "name": "Group1"
        },
        {
            "id": "6ba21756-9a74-5348-a255-891a33d68beb",
            "name": "Group1"
        },
        {
            "id": "5b3c6ca3-458e-ea94-7cfe-80a31a65498f",
            "name": "Group2"
        },
        {
            "id": "f3ca322e-3271-ff85-316a-fec2ca687d15",
            "name": "Group1"
        },
        {
            "id": "8984059d-7a2a-cf42-26d8-c73156cccb1e",
            "name": "Group3"
        },
        {
            "id": "3f54deab-2797-3dc5-6640-ddc4b1e306b7",
            "name": "Group4"
        },
        {
            "id": "b7c7ec5c-4718-715e-096d-23237d70f95f",
            "name": "Test CSV Upload"
        },
        {
            "id": "ca9c1df6-4807-5c6e-dd18-5ffa30cb0a5e",
            "name": "Group2"
        },
        {
            "id": "04b4d9b9-c6d0-96f1-3720-e71b6a95d9f1",
            "name": "Group3"
        },
        {
            "id": "ed643ae2-3e66-c11f-c886-b91670dd2a09",
            "name": "Group4"
        },
        {
            "id": "f1969698-a34b-be3d-6107-a08231e102cf",
            "name": "Group2"
        },
        {
            "id": "1a351b6d-18d8-c84e-f6b0-eaf5944a5725",
            "name": "Group3"
        },
        {
            "id": "06d20059-9295-2d2f-c7f4-387acb8733c0",
            "name": "Group4"
        },
        {
            "id": "f754cc4e-1cbf-0e1d-0a52-9e67213153a1",
            "name": "Class of 92"
        },
        {
            "id": "a69300cc-b20a-df61-bbb3-ab3aabcad3ec",
            "name": "fall18"
        },
        {
            "id": "dbf384e2-fcca-7693-725a-87343b587c73",
            "name": "Winter18"
        },
        {
            "id": "19dd53d9-565f-1f4a-caf0-ae383408cfcf",
            "name": "A"
        },
        {
            "id": "791dd6f6-14c1-b02c-0705-a6f48099f369",
            "name": "B"
        },
        {
            "id": "5c9da02c-05d2-7828-a8be-497910766eed",
            "name": "C"
        }
    ];

    let shouldUpdateFlag=false;

    if (err) {
        console.log('error', err);
    } else {
        var querySpec = {
            query: 'SELECT c.id FROM c WHERE  c.entity = @entity',
            parameters: [
                {
                    name: '@entity',
                    value: 'dis'
                }
            ]
        };
        console.log("query is", querySpec)
        utils.find(client, appDataCollection, querySpec, function (err, result) {
            console.log(result);
            var countUpdated=result.length;

            utils.getOrCreateCollection(client, database._self, config.collectionId1, function (err, coll) {
                eventLogCollection = coll;

                for (i = 0; i < result.length; i++) {
                    console.log('============Sequence=================', i);
                    var querySpec1 = {
                        query: 'SELECT * FROM c WHERE c.id = @id',
                        parameters: [{
                            name: '@id',
                            value: result[i].id
                        }]
                    }

                    console.log('dis', result[i].id);

                    utils.find(client, appDataCollection, querySpec1, function (err, result1) {
                        if (err) {
                            console.log('error inside find', err);
                        } else {
                            var length=result.length;
                            if (length > 0) {
                                var discoverer = result1[0];
                                discoverer.groupsName=[];
                                // var lastEventType = getDiscovererlastEvent(eventLogCollection, discoverer, function (eventLog) {
                                    shouldUpdateFlag=false;
                                    if(discoverer.groupId.length){
                                        shouldUpdateFlag=true;
                                        discoverer.groupId.forEach(id => {
                                            groupsTestData.map(group => {
                                              if (group.id === id) {
                                                discoverer.groupsName.push(group.name);
                                              }
                                            });
                                          });
                                    }

                                    if(shouldUpdateFlag){
                                        utils.replaceDocument(client, discoverer._self, discoverer, function (updatedDiscoverer) {
                                            console.log('discoverer.id updated', updatedDiscoverer.id);
                                            console.log("----------------updated left------------", countUpdated--);
                                        })
                                    }
                                    else{
                                        console.log('discoverer.id updated', discoverer.id);
                                        console.log("----------------updated left------------", countUpdated--);
                                    }
                                    // discoverer.email=discoverer.email.toLowerCase();
                                    // if(discoverer.lastEventCategory==='not_started'){
                                    //     // discoverer.lastEventCategory='not_completed';
                                    //     discoverer.lastEventType='Not started'
                                    // }
                                    // else if(discoverer.lastEventCategory==='invite_to_start'){
                                    //     discoverer.lastEventCategory='not_started';
                                    //     discoverer.lastEventType='Invite to start'
                                    // }
                                    // let discovererEvent = getEventTypeAndCategory(eventLog.eventType);

                                    // discoverer.lastEventAt = eventLog.timestamp;
                                    // discoverer.lastEventType = discovererEvent.lastEventType;
                                    // discoverer.lastEventCategory = discovererEvent.lastEventCategory;
                                    // discoverer.isRegistered= false;
                                    // discoverer.customerId='e25803c0-5bdd-f8a8-848f-d3161da57577';
                                    // discoverer.sponsoredOrganizationId='0d83ac69-be4e-a76f-2310-336945663433';
                                    // if(discoverer && discoverer.personalityProfile && discoverer.personalityProfile.PersonalityScores){
                                    //     if(!discoverer.personalityProfile.details){
                                    //         calculateNewPersonalityScore(discoverer);
                                        
                                    //     discoverer.isRegistered= true;
                                    //     // discoverer.RIASEC1 = riasecValue.riasec1;
                                    //     // discoverer.RIASEC2 = riasecValue.riasec2;

                                    //         // utils.replaceDocument(client, discoverer._self, discoverer, function (updatedDiscoverer) {
                                    //         //     console.log('discoverer.id updated', updatedDiscoverer.id);
                                    //         //     console.log("----------------updated left------------", countUpdated--);
                                    //         // })
                                    //     }else{
                                    //         // console.log("-------------updated left-------------", countUpdated--);                                            
                                    //     }
                                    // }
                                // });

                            }
                            else
                                console.log('No record found');
                        }
                    });


                }
                console.log('Operation completed');
            });
        });

    }
}

function createCKWGENCSVCallBack(err, coll) {
    appDataCollection = coll;
    let productName = 'ckwg.CA.en'
    let language='en'


    if (err) {
        console.log('error', err);
    } else {
        var querySpec = {
            query: 'SELECT * FROM c WHERE c.id = @id',
            parameters: [
                {
                    name: '@id',
                    value: productName
                }
            ]
        };
        let careerRecord = [];
        let ipRecord = [];
        let titleRecord = [];        

        utils.find(client, appDataCollection, querySpec, function (err, product) {
            if(product.length && product[0].workgroups && product[0].workgroups.length===0){
                console.log("no ckwg data")
                return;
            }

            console.log("Ca ko", product)

            let workGroupIds = '(';

            product[0].workgroups.forEach((workgroup, index)=>{
                if(product[0].workgroups.length-1===index)
                    workGroupIds += `"${workgroup.id}")`
                else
                    workGroupIds += `"${workgroup.id}",`
            })

            console.log("workgroup is ", workGroupIds)

            // get all product workgroups
            querySpec = {
                query: 'SELECT * FROM c WHERE c.id in '+workGroupIds,
                parameters: []
            };

            utils.find(client, appDataCollection, querySpec, function (err, ckwg) {
                ckwg.forEach(ckwgData=>{
                    let tempTitle = {};
                    let tempCareer = [];
                    let tempIPs = [];
                    tempTitle = {id: ckwgData.id, 
                        title:ckwgData.title
                    };
                    titleRecord.push(tempTitle)
                    
                    if(ckwgData.careers.length)
                        tempCareer = calculateCareer(ckwgData.careers, ckwgData.id)
                    if(ckwgData.instructionalPrograms.length)
                        tempIPs = calculateIP(ckwgData.instructionalPrograms, ckwgData.id)
                    
                    careerRecord=careerRecord.concat(tempCareer)
                    ipRecord=ipRecord.concat(tempIPs)
                })
    
                jsonexport(titleRecord,function(err, csv){
                    if(err) return console.log(err);
    
                    fs.writeFile(`product-title-${language}.csv`, csv, function(err) {
                        if(err) {
                            return console.log(err);
                        }
                    
                        console.log("Title file was saved!");
                    }); 
                });
    
                jsonexport(careerRecord,function(err, csv){
                    if(err) return console.log(err);
                    
                    fs.writeFile(`ckwg-careers-${language}.csv`, csv, function(err) {
                        if(err) {
                            return console.log(err);
                        }
                    
                        console.log("Career file was saved!");
                    }); 
                });
    
                jsonexport(ipRecord,function(err, csv){
                    if(err) return console.log(err);
                    
                    fs.writeFile(`ckwg-ips-${language}.csv`, csv, function(err) {
                        if(err) {
                            return console.log(err);
                        }
                    
                        console.log("IP file was saved!");
                    }); 
                });

            })

            // var file = fs.createWriteStream('newFile.csv');
            // file.on('error', function(err) { console.log("error is", err) });
            // totalData.forEach(item => {
            //     console.log("join is ", item)
            //     file.write(item.join() + '\n'); 
            // });
            // file.end();
        });
    }
}

function updateApiKeysEntity(err, coll) {
    appDataCollection = coll;

    if (err) {
        console.log('error', err);
    } else {
        var querySpec = {
            query: 'SELECT * FROM c WHERE c.entity = @entity and not is_defined(c.cks)',
            parameters: [
                {
                    name: '@entity',
                    value: 'apikey'
                }
            ]
        };

        utils.find(client, appDataCollection, querySpec, function (err, apikeys) {
            if(!apikeys.length){
                console.log("no apikeys data")
                return;
            }


            apikeys.forEach((apikey, index)=>{
                try{
                    apikey.cks= `cks.${apikey.locale.language.id}.${apikey.locale.country.id}`
                }
                catch(err){
                    console.log("error in cks in id : ", apikey.id)
                }
                console.log("api key updated is ", apikey)
                utils.replaceDocument(client, apikey._self, apikey, function (updatedProduct) {
                    console.log("apikey is updated", updatedProduct.id)
                })
            })
        });
    }
}

function calculateCareer(careers, id){
    let record = []
    let tempRecord = {}
    
    careers.forEach(career=>{
        tempRecord = {
            id,
            careerId: career.id,
            name: career.name || '',
            socname: career.socname || '',
            educationalRequirementName: career.educationalRequirementName || '',
            description: career.description || '',
            Values: career.Values
        };

        record.push(tempRecord)
    });

    return record;
}

function calculateIP(IPs, id){
    let record =[];
    let tempRecord = []

    IPs.forEach(ip=>{
        tempRecord = {
            id,
            name: ip.name,
            description: ip.description,
            cipName: ip.cipName
        }

        record.push(tempRecord)
    });

    return record;
}

function firstUpdateProduct(err, coll) {
    appDataCollection = coll;
    let productName = 'ckp.CA.Algonquin'
    let language='en'


    if (err) {
        console.log('error', err);
    } else {
        var querySpec = {
            query: 'SELECT * FROM c WHERE c.id = @id',
            parameters: [
                {
                    name: '@id',
                    value: productName
                }
            ]
        };

        utils.find(client, appDataCollection, querySpec, function (err, product) {
            if(product.length && product[0].workgroups && product[0].workgroups.length===0){
                console.log("no ckwg data")
                return;
            }

            let workGroupIds = '(';

            product[0].workgroups.forEach((workgroup, index)=>{
                if(product[0].workgroups.length-1===index)
                    workGroupIds += `"${workgroup.id}")`
                else
                    workGroupIds += `"${workgroup.id}",`

                workgroup.variations={}
                workgroup.variations[language]={
                    title: workgroup.title
                }
                
                delete workgroup.title;
                workgroup.id = workgroup.id.replace(language, 'base');
            })

            querySpec = {
                query: 'SELECT * FROM c WHERE c.id in '+workGroupIds,
                parameters: []
            };

            utils.find(client, appDataCollection, querySpec, function (err, ckwg) {
                ckwg.forEach(ckwgData=>{
                    // let tempTitle = {};
                    // let tempCareer = [];
                    // let tempIPs = [];
                    // ckwgData.variations={};
                    // ckwgData.variations[language]=ckwgData.title
                    // delete ckwgData.title;
                    
                    // if(ckwgData.careers.length)
                    //     ckwgData.careers = updateCareers(ckwgData.careers, ckwgData.id, language)
                    if(ckwgData.instructionalPrograms.length)
                        ckwgData.instructionalPrograms = updateIP(ckwgData.instructionalPrograms, ckwgData.id, language)
                    
                    // ckwgData.id=ckwgData.id.replace(language, 'base');
                    // ckwgData.id=ckwgData.id.replace('sch.16880583-5e5d-4aad-b1b7-cb7a976318b0', 'CA.Algonquin')
                    // console.log("ckwg id is ", ckwgData.id)
                    utils.replaceDocument(client, ckwgData._self, ckwgData, function (updatedCKWG) {
                        console.log("ckwg is updated", updatedCKWG)
                    })
                })
            })

            // product[0].entity='product'
            // product[0].id=product[0].id.replace('ckwg', 'ckp');
            // product[0].id=product[0].id.replace(language, 'base');

            // console.log("final is ", product[0])

            // utils.replaceDocument(client, product[0]._self, product[0], function (updatedProduct) {
            //     console.log("product is updated", updatedProduct.id)
            // })
        });
    }
}

function updateMedianPay(err, coll) {
    appDataCollection = coll;


    if (err) {
        console.log('error', err);
    } else {
        var querySpec = {
            query: 'SELECT * FROM c WHERE c.entity = @entity',
            parameters: [
                {
                    name: '@entity',
                    value: 'ckwg'
                }
            ]
        };
        utils.find(client, appDataCollection, querySpec, function (err, ckwg) {
            ckwg.forEach(ckwgData=>{

                if(ckwgData.careers.length){
                    ckwgData.careers = updateCareerMedianPay(ckwgData.careers)                    
                }                
                utils.replaceDocument(client, ckwgData._self, ckwgData, function (updatedCKWG) {
                    console.log("ckwg is updated", updatedCKWG)
                })
            })
        })
    }
}

function updateCareerMedianPay(careers){
    careers.forEach(career=>{
        if(career.medianPay)
            career.medianPay = parseInt(career.medianPay.replace(/,/g, ''));
        else
            career.medianPay = null

        console.log("ip id is ", career.medianPay)

    });

    return careers;
}

function updateDescriptionIoCareerMajor(err, coll){
    appDataCollection = coll;

    xlsxj({
        input: "LongDescriptions2019.xlsx", 
        output: "LongDescriptions2019.json"
        }, function(err, result) {
        if(err) {
            console.error(err);
        }

        var querySpec = {
            query: 'SELECT * FROM c WHERE c.entity = @entity',
            parameters: [
                {
                    name: '@entity',
                    value: 'ckwg'
                }
            ]
        };

        utils.find(client, appDataCollection, querySpec, function (err, workgroups) {
            console.log("err ", err)
            if(!workgroups.length){
                console.log("no ckwg data")
                return;
            }

            var mappedCareer=[];
            workgroups.forEach(workgroup=>{
                workgroup.careers && workgroup.careers.forEach(career=>{
                    mappedCareer=[];
                    if(career.variations.en){
                        career.variations.en.shortDescription = career.variations.en.description
                        career.variations.en.description = ''
                    }
                    if(career.variations.es){
                        career.variations.es.shortDescription = career.variations.es.description
                        career.variations.es.description = ''
                            // console.log("the variration ", career.variations.es)
                        
                    }
                    if(career.variations.vi){
                        career.variations.vi.shortDescription = career.variations.vi.description
                        career.variations.vi.description = ''
                            console.log("the variration ", career.variations.vi)
                        
                    }
                        
                    mappedCareer = result.filter(car=>car.id===career.id);
                    if(mappedCareer.length>0){
                        if(career.variations.en){
                            career.variations.en.description=mappedCareer[0].en
                        }
                    }
                })

                utils.replaceDocument(client, workgroup._self, workgroup, function(workgroup) {
                    console.log('updated ckwg ----->> ', workgroup);
                });
            })
        });
        
    })
}

function updateCareers(careers, id, language){
    careers.forEach(career=>{
        career.variations={};
        career.variations[language]={
            name: career.name,
            socname: career.socname,
            educationalRequirementName: career.educationalRequirementName,
            description: career.description,
            Values: career.Values
        }
        career.id = career.id.replace(language, 'base');
        delete career.name || '',
        delete career.socname || '',
        delete career.educationalRequirementName || '',
        delete career.description || '',
        delete career.Values
    });

    return careers;
}

function updateIP(IPs, id, language){
    IPs.forEach(ip=>{
        // ip.variations={};
        // ip.variations[language]={
        //     name: ip.name,
        //     description: ip.description,
        //     cipName: ip.cipName
        // }
        ip.id = ip.id.replace('sch.16880583-5e5d-4aad-b1b7-cb7a976318b0', 'CA.Algonquin');
        console.log("ip id is ", ip.id)

        // if(ip.careers && ip.careers.length){
        //     ip.careers.forEach(career=>{
        //         career.id = career.id.replace(language, 'base')
        //         career.workgroupID = career.workgroupID.replace(language, 'base')
        //     })
        // }
        // delete ip.name,
        // delete ip.description,
        // delete ip.cipName
    });

    return IPs;
}

function updateVariationInProduct(err, coll) {
    appDataCollection = coll;
    let productName = 'ckp.US.base'
    let language='en'
    // let productName = 'sch.16880583-5e5d-4aad-b1b7-cb7a976318b0'
    // let language='en'

    if (err) {
        console.log('error', err);
    } else {
        var querySpec = {
            query: 'SELECT * FROM c WHERE c.id = @id',
            parameters: [
                {
                    name: '@id',
                    value: productName
                }
            ]
        };

        utils.find(client, appDataCollection, querySpec, function (err, product) {
            if(product.length && product[0].workgroups && product[0].workgroups.length===0){
                console.log("no ckwg data")
                return;
            }

            let workGroupIds = '(';

            product[0].workgroups.forEach((workgroup, index)=>{
                if(product[0].workgroups.length-1===index)
                    workGroupIds += `"${workgroup.id}")`
                else
                    workGroupIds += `"${workgroup.id}",`
            })

            querySpec = {
                query: `SELECT * FROM c WHERE c.id in ${workGroupIds}`,
                parameters: []
            };

            // ckwgs start
            utils.find(client, appDataCollection, querySpec, function (err, ckwg) {

                // ----------- Spanish content read adn update
                // xlsxj({
                //     input: "CareerDetailswithURL.xlsx", 
                //     output: "orderedCareerDetails.json"
                //     }, function(err, result) {
                //     if(err) {
                //         console.error(err);
                //     }
                
                ckwg.forEach(ckwgData=>{         
                    // if(ckwgData.careers.length)
                        // ckwgData.careers = updateVariationInCareers(ckwgData.careers, ckwgData.id, language, result)
                        // ckwgData.careers = updateVariationInCareers(ckwgData.careers, ckwgData.id, language)
                        // ckwgData.careers = updateSchoolInCareers(ckwgData.careers, ckwgData.id)
                    if(ckwgData.instructionalPrograms.length)
                        // ckwgData.instructionalPrograms = updateVariationInIP(ckwgData.instructionalPrograms, ckwgData.id, language)
                        // ckwgData.instructionalPrograms = updateIP(ckwgData.instructionalPrograms, ckwgData.id, language)
                        ckwgData.instructionalPrograms = updateSchoolIdInIP(ckwgData.instructionalPrograms, ckwgData.id)
                    
                    utils.replaceDocument(client, ckwgData._self, ckwgData, function (updatedCKWG) {
                        console.log("ckwg is updated", updatedCKWG)
                    })
                })
                });

                // ------Spanish content updated

                // -------Spanish title read and update

                // xlsxj({
                //     input: "ckwg-title-es.xlsx", 
                //     output: "orderedTitleDetails.json"
                //     }, function(err, result) {
                //     if(err) {
                //         console.error(err);
                //     }
                    

                //------------------title-------------

                    // ckwg.forEach(ckwgData=>{
                    //     console.log("data ", ckwgData)
                    //     // ckwgData.id = ckwgData.id.replace(language, 'base')
                    //     // console.log("result s", ckwgData.id)
                    //     // selectedtitle = result.find(wg=>(ckwgData.id===wg.id))
                    //     // console.log("selected title", selectedtitle)

                    //     let name = ckwgData.title || '';
                    //     ckwgData.variations={};
                    //     // ckwgData.variations={
                    //     //     en: {title: name},
                    //     // }
                    //     ckwgData.variations[language]={title: name}
                    //     ckwgData.pt = ckwgData.personalityType && ckwgData.personalityType[0] || ''

                    //     delete ckwgData.title

                
                    //     // if(ckwgData.careers.length)
                    //     //     ckwgData.careers = updateVariationInCareers(ckwgData.careers, ckwgData.id, language)
                    //     //     ckwgData.careers = updateVariationInCareers(ckwgData.careers, ckwgData.id, language, result)
                    //     // if(ckwgData.instructionalPrograms.length)
                    //     //     ckwgData.instructionalPrograms = updateIP(ckwgData.instructionalPrograms, ckwgData.id, language)
                        
                    //     utils.replaceDocument(client, ckwgData._self, ckwgData, function (updatedCKWG) {
                    //         console.log("ckwg is updated", updatedCKWG)
                    //     })
                    // })

                    //----------------title complete-----------------
                // });
            // })
            // ckwgs ends

            // xlsxj({
            //     input: "ckwg-title-es.xlsx", 
            //     output: "orderedTitleDetails.json"
            //     }, function(err, result) {
            //     if(err) {
            //         console.error(err);
            //     }
                
            //     let ckwg;
            //     console.log("result is", result)

                // product[0].workgroups.forEach((workgroup, index)=>{
                //     // selectedCKWG = result.find(wg=>(wg.id===workgroup.id))
                //     // console.log("selected ckwg", selectedCKWG)
                //     workgroup.variations = {}
                //     workgroup.variations[language] = {}
                //     workgroup.variations[language].title=workgroup.title;
                //     // workgroup.variations['en'].title = workgroup.title;
                //     delete workgroup.title;
                // })

            //     //title
                // utils.replaceDocument(client, product[0]._self, product[0], function (updatedProduct) {
                //     console.log("product is updated", updatedProduct.id)
                // })
            // });
        });
    }
}

function updateSchoolEntity(err, coll) {
    appDataCollection = coll;

    if (err) {
        console.log('error', err);
    } else {
        var querySpec = {
            query: 'SELECT * FROM c WHERE c.entity = @entity',
            parameters: [
                {
                    name: '@entity',
                    value: 'sch'
                }
            ]
        };

        utils.find(client, appDataCollection, querySpec, function (err, schools) {
            if(!schools.length){
                console.log("no sch data")
                return;
            }

            schools.forEach(school=>{    
                school.id= school.id.replace('en', 'base')
                console.log(school)
            
                utils.replaceDocument(client, school._self, school, function (updateSchool) {
                    console.log("ckwg is updated", updateSchool)
                })
            });
        });
    }
}

function updateCIPToStringInSchoolEntity(err, coll) {
    appDataCollection = coll;
    console.log("inside main")

    if (err) {
        console.log('error', err);
    } else {
        var querySpec = {
            query: 'SELECT * FROM c WHERE c.entity = @entity',
            parameters: [
                {
                    name: '@entity',
                    value: 'sch'
                }
            ]
        };

        utils.find(client, appDataCollection, querySpec, function (err, schools) {
            console.log("inside for each ", schools.length)
            if(!schools.length){
                console.log("no sch data")
                return;
            }

            schools.forEach(school=>{    
                // school.id= school.id.replace('en', 'base')
                school.majors.length && school.majors.forEach(major=>{
                    major.cip = major.cip.toString()
                })
                console.log("school", school.majors)
                utils.replaceDocument(client, school._self, school, function (updateSchool) {
                    console.log("ckwg is updated", updateSchool)
                })
            });
        });
    }
}

function updateDiscovererHostURL(err, coll) {
    appDataCollection = coll;

    if (err) {
        console.log('error', err);
    } else {
        var querySpec = {
            query: 'SELECT * FROM c WHERE c.entity = @entity and not is_defined(c.hostPageUrl)',
            parameters: [
                {
                    name: '@entity',
                    value: 'dis'
                }
            ]
        };

        utils.find(client, appDataCollection, querySpec, function (err, discoverer) {
            console.log("inside for each ", discoverer.length)
            // let b2cURL='http://localhost:8181';
            let b2cURL = 'https://ckdiscovery.careerkey.org/';
            let algonquinURL = 'https://www.algonquincollege.com/html/careerkey/'
            // let algonquinURL='http://localhost:8181/algonquin';
            // let thriventURL='http://localhost:8181/thrivent';
            let thriventURL = 'https://www.thriventstudentresources.com/tools-resources/plan-your-path/career-assessment'
            let ourURL='http://localhost:8181/ours'

            if(!discoverer.length){
                console.log("no sch data")
                return;
            }

            discoverer.forEach(discoverer=>{    

                if(!discoverer.sponsoredOrganizationId)
                    discoverer.hostPageUrl=b2cURL
                else if(discoverer.customerId === 'e25803c0-5bdd-f8a8-848f-d3161da57577')
                    discoverer.hostPageUrl = algonquinURL
                else if (discoverer.customerId=== '2605b9ff-9567-e1b7-32d4-d763e2eb2c45')
                    discoverer.hostPageUrl = thriventURL
                else if(discoverer.customerId==='cc0a1cbe-59db-b625-e0ec-8926a951b071' || discoverer.customerId==='abc3028d-e287-cb93-5501-b9609f9a2ba6' || discoverer.customerId==='89603930-ecde-2d36-2238-00cd4e8cabf8' || discoverer.customerId==='0ee8f7e5-c5b5-0587-da52-c5ba5c3e5673')
                    discoverer.hostPageUrl=ourURL;
                else
                    discoverer.hostPageUrl=''

                // discoverer.email = discoverer.email.split('@')[0] + '@yopmail.com'

                utils.replaceDocument(client, discoverer._self, discoverer, function (updatediscoverer) {
                    console.log("discoverer is updated", updatediscoverer)
                })
            });
        });
    }
}

function updateCustomerIdToApiKeys(err, coll) {
    appDataCollection = coll;

    if (err) {
        console.log('error', err);
    } else {
        var querySpec = {
            query: 'SELECT c.id FROM c WHERE  c.entity = @entity and (not is_defined(c.customerId) OR c.customerId = "")',
            parameters: [
                {
                    name: '@entity',
                    value: 'apikey'
                }
            ]
        };

        utils.find(client, appDataCollection, querySpec, function (err, result) {
            console.log('Query result length', result.length);
            console.log('Query result', result);

            utils.getOrCreateCollection(client, database._self, config.collectionId1, function (err, coll) {
                eventLogCollection = coll;

                for (i = 0; i < result.length; i++) {
                    console.log('============Sequence=================');
                    var querySpec1 = {
                        query: 'SELECT * FROM c WHERE c.id = @id',
                        parameters: [{
                            name: '@id',
                            value: result[i].id
                        }]
                    }


                    utils.find(client, appDataCollection, querySpec1, function (err, result1) {
                        if (err) {
                            console.log('error inside find', err);
                        } else {
                            if (result.length > 0) {

                                var apikey = result1[0];
                                var sponsoredOrganizationId = apikey.sponsoredOrganizationId;

                                var querySpec2 = {
                                    query: 'SELECT c.customerId FROM c WHERE c.id = @sponsoredOrganizationId',
                                    parameters: [{
                                        name: '@sponsoredOrganizationId',
                                        value: sponsoredOrganizationId
                                    }]
                                };

                                utils.find(client, appDataCollection, querySpec2, function (err, result2) {
                                    if (err) {
                                        console.log('error inside find', err);
                                    } else {
                                        console.log('result2--->', result2);
                                        if (result2.length) {
                                            apikey.customerId = result2[0].customerId;

                                            utils.replaceDocument(client, apikey._self, apikey, function(updatedApiKey) {
                                                console.log('updated api key ----->> ', updatedApiKey);
                                            });
                                        } else {
                                            console.log('sponsored organization id not available');
                                        }
                                    }
                                });
                            }
                            else
                                console.log('No record found');
                        }
                    });

                }
                console.log('Operation completed');
            });
        });
    }
}

function getUnavailableSchoolId(err, coll) {
    appDataCollection = coll;

    if (err) {
        console.log('error', err);
    } else {
        var querySpec = {
            query: 'SELECT ip.Schools  FROM c JOIN ip in c.instructionalPrograms where c.entity=@entity',
            parameters: [
                {
                    name: '@entity',
                    value: 'ckwg'
                }
            ]
        };

        var schoolIdQuerySpec = {
            query: 'SELECT Value c.id  FROM c where c.entity=@entity',
            parameters: [
                {
                    name: '@entity',
                    value: 'sch'
                }
            ]
        };

        utils.find(client, appDataCollection, querySpec, function (err, schools) {
            let schoolsId=[]
            let unavailableSchool = []
            

            if(!schools.length){
                console.log("no sch data")
                return;
            }

            schools.forEach(ckwgSchool=>{    
                if(ckwgSchool.Schools && ckwgSchool.Schools.length){
                    ckwgSchool.Schools.forEach(schoolId=>{
                        if(schoolsId.indexOf(schoolId)<0){
                            schoolsId.push(schoolId)
                        }
                    })
                }  
            });

            utils.find(client, appDataCollection, schoolIdQuerySpec, function (err, schools) {
                if(!schools.length){
                    console.log("no sch data")
                    return;
                }
    
                schoolsId.forEach(id=>{
                    if(schools.indexOf(id)<0)
                        unavailableSchool.push(id)
                })   
                fs.writeFile('no_school.text', unavailableSchool, (err) => {
                    if (err) throw err;
                
                    console.log("The file was succesfully saved!");
                });      
                console.log("school that are unavailable are ", unavailableSchool)    
            });
        });
    }
}

function getUnavailableCIP(err, coll) {
    appDataCollection = coll;

    if (err) {
        console.log('error', err);
    } else {
        var querySpec = {
            query: 'SELECT Value major.cip FROM c join major in c.majors where c.entity=@entity',
            parameters: [
                {
                    name: '@entity',
                    value: 'sch'
                }
            ]
        };
        let unavailableCIP =[];
        
        utils.find(client, appDataCollection, querySpec, function (err, cips) {
            let uniqueCIP = [...new Set(cips)]
            console.log("final cip", uniqueCIP)
            
            let queryStringForIn = '('
            uniqueCIP.forEach((cip, index)=>{
                if (index !== uniqueCIP.length - 1) queryStringForIn += `'${cip}',`;
                else queryStringForIn += `'${cip}')`;
            })

            var schoolIdQuerySpec = {
                query: `SELECT Value major.cip FROM c join major in c.instructionalPrograms where c.entity=@entity and major.cip in ${queryStringForIn}`,
                parameters: [
                    {
                        name: '@entity',
                        value: 'ckwg'
                    }
                ]
            };

            console.log("query is ", schoolIdQuerySpec)

            utils.find(client, appDataCollection, schoolIdQuerySpec, function (err, majors) {
                if(!majors.length){
                    console.log("no sch data")
                    return;
                }
    
                uniqueCIP.forEach(id=>{
                    if(majors.indexOf(id)<0)
                        unavailableCIP.push(id)
                })   
                fs.writeFile('no_cip.text', unavailableCIP, (err) => {
                    if (err) throw err;
                
                    console.log("The file was succesfully saved!", unavailableCIP);
                });      
                // console.log("school that are unavailable are ", unavailableSchool)    
            });
        });
    }
}

function getCareerData(err, coll) {
    appDataCollection = coll;

    if (err) {
        console.log('error', err);
    } else {
        var querySpec = {
            query: `SELECT career.id, career.soc, career.variations.en.name  FROM c join career in c.careers where c.entity = "ckwg" and c.id in (    "ckwg.US.base.1.01",
            "ckwg.US.base.1.02",
            "ckwg.US.base.1.03",
            "ckwg.US.base.1.04",
            "ckwg.US.base.1.05",
            "ckwg.US.base.1.06",
            "ckwg.US.base.1.07",
            "ckwg.US.base.1.08",
            "ckwg.US.base.1.09",
            "ckwg.US.base.1.1",
            "ckwg.US.base.1.11",
            "ckwg.US.base.1.12",
            "ckwg.US.base.2.01",
            "ckwg.US.base.2.02",
            "ckwg.US.base.2.03",
            "ckwg.US.base.2.04",
            "ckwg.US.base.2.05",
            "ckwg.US.base.2.06",
            "ckwg.US.base.2.07",
            "ckwg.US.base.2.08",
            "ckwg.US.base.3.01",
            "ckwg.US.base.3.02",
            "ckwg.US.base.3.03",
            "ckwg.US.base.3.04",
            "ckwg.US.base.3.05",
            "ckwg.US.base.4.01",
            "ckwg.US.base.4.02",
            "ckwg.US.base.4.03",
            "ckwg.US.base.4.04",
            "ckwg.US.base.4.05",
            "ckwg.US.base.5.01",
            "ckwg.US.base.5.02",
            "ckwg.US.base.5.03",
            "ckwg.US.base.5.04",
            "ckwg.US.base.5.05",
            "ckwg.US.base.5.06",
            "ckwg.US.base.5.07",
            "ckwg.US.base.5.08",
            "ckwg.US.base.6.01",
            "ckwg.US.base.6.02",
            "ckwg.US.base.6.03",
            "ckwg.US.base.6.04",
            "ckwg.US.base.6.05")`,
            parameters: []
        };
        let unavailableCIP =[];
        
        utils.find(client, appDataCollection, querySpec, function (err, careers) {
            jsonexport(careers,function(err, csv){
                if(err) return console.log(err);
                console.log(csv);
                fs.writeFile('majors.csv', csv, (err) => {
                    if (err) throw err;
                
                    console.log("The file was succesfully saved!", unavailableCIP);
                });    
            });
        });
    }
}

function getWorkgroups(err, coll) {
    appDataCollection = coll;

    if (err) {
        console.log('error', err);
    } else {
        var querySpec = {
            query: `SELECT wg.careerKeyId, wg.variations.en.title, wg.personalityType  FROM c join wg in c.workgroups where c.id='ckp.US.base'`,
            parameters: []
        };
        let unavailableCIP =[];
        
        utils.find(client, appDataCollection, querySpec, function (err, careers) {
            jsonexport(careers,function(err, csv){
                if(err) return console.log(err);
                console.log(csv);
                fs.writeFile('workgroups.csv', csv, (err) => {
                    if (err) throw err;
                
                    console.log("The file was succesfully saved!", unavailableCIP);
                });    
            });
        });
    }
}

function updateUnpublishToPublish(err, coll){
    appDataCollection = coll;

    if (err) {
        console.log('error', err);
    } else {
        var querySpec = {
            query: `SELECT VALUE wg.id  FROM c join wg in c.workgroups where c.id='ckp.US.HCC'`,
            parameters: []
        };
        let unavailableCIP =[];
        
        utils.find(client, appDataCollection, querySpec, function (err, workgroupId) {
            console.log("workgroup id ",workgroupId )
            let stringId = JSON.stringify(workgroupId).replace(/^\[|]$/g, '')
            var querySpec = {
                query: `SELECT *  FROM c where c.id in ( ${stringId} )`,
                parameters: []
            };

            utils.find(client, appDataCollection, querySpec, function (err, workgroups) {
                if (err) {
                    console.log('error', err);
                } else{
                    workgroups.forEach(workgroup=>{
                        if(workgroup.unpublished.instructionalPrograms.length){
                            workgroup.instructionalPrograms = workgroup.unpublished.instructionalPrograms;

                            utils.replaceDocument(client, workgroup._self, workgroup, function (updatedCKWG) {
                                console.log("ckwg is updated", updatedCKWG)
                            })
                        }
                    })
                }
            });
        });
    }
}

function updateSchoolIdInIP(IPs, id){
    let selectedCareers;
    IPs.forEach(ip=>{

        //change en to base in instructionalPrograms inside careers
        // if(ip.careers && ip.careers.length){
        //     ip.careers.forEach(career=>{
        //         career.id = career.id.replace(language, 'base')
        //         career.workgroupID = career.workgroupID.replace(language, 'base')
        //     })
        // }
        if(ip.Schools && ip.Schools.length){
            schools= [];
            ip.Schools.forEach(sch=>{
                schools.push(sch.replace('en', 'base'))
            })
            ip.Schools=schools
        }
    });
    console.log("Ip is ", IPs)
    return IPs;
}

function updateVariationInIP(IPs, id, language){
    let selectedCareers;
    IPs.forEach(ip=>{

        //change en to base in instructionalPrograms inside careers
        if(ip.careers && ip.careers.length){
            ip.careers.forEach(career=>{
                career.id = career.id.replace(language, 'base')
                career.workgroupID = career.workgroupID.replace(language, 'base')
            })
        }
    });

    return IPs;
}

function updateVariationInCareers(careers, id, language, esCareers){
    let selectedCareers;
    careers.forEach(career=>{
        selectedCareers={};
        // career.variations={}
        career.id = career.id.replace(language, 'base')
        // console.log("career id db ", career.id)
        // console.log("career id file ", esCareers)
        selectedCareers = esCareers.find(car=>(car.careerId===career.id))
        // console.log("selected ", selectedCareers)
        // career.variations[language]={}
        // career.variations[language]={
        //     name: selectedCareers.name || '',
        //     socname: selectedCareers.socname || '',
        //     educationalRequirementName: selectedCareers.educationalRequirementName || '',
        //     description: selectedCareers.description || '',
        //     descriptionUrl: selectedCareers.descriptionUrl || '',
        //     Values: selectedCareers.Values && selectedCareers.Values.split(";").map(word=>word.replace(/ /g,'')) || []
        // }
        // career.variations['en']={
        //     name: career.name || '',
        //     socname: career.socname || '',
        //     educationalRequirementName: career.educationalRequirementName || '',
        //     description: career.description || '',
        //     descriptionUrl: selectedCareers.url || '',
        //     Values: career.Values || []
        // }
        // console.log("career is ", car)
        career.variations.es.descriptionUrl = selectedCareers.url || '';
        // console.log("aako value ", career.descriptionUrl);
        // career.variations.en.educationalRequirementName = career.variations.en.educationalRequirementName || 'None';
        // career.variations.en.Values = career.variations.en.Values || '';
        // career.variations.en.descriptionUrl = career.descriptionUrl || '';
        // delete career.descriptionUrl;
        // delete career.name;
        // delete career.socname;
        // delete career.educationalRequirementName;
        // delete career.description;
        // delete career.Values;
        
        // console.log("careers ", career)
        // career.id = career.id.replace(language, 'base')
        // change en to base in instructionalPrograms inside careers
        // console.log(career)
        // if(career.instructionalPrograms && career.instructionalPrograms.length){
        //     career.instructionalPrograms.forEach(IP=>{
        //         IP.id = IP.id.replace(language, 'base')
        //         IP.workgroupID = IP.workgroupID.replace(language, 'base')
        //     })
        // }
    });

    return careers;
}

function findDocumentCallBack(err, result) {
    if (err) {
        console.log('error inside findDocument', err);
    } else {
        if (result.length > 0) {
            console.log('length', result.length);
            updateDiscovererlastEvent(result);
        }

        else
            console.log('No record found');
    }
}

function getDiscovererlastEvent(coll, discoverer, callback) {

    // utils.getOrCreateCollection(client, database._self, config.collectionId1, function (err, coll) {
    // if (err) {
    //     if (err.code === 429) {
    //         let retryAfter = err.retryAfterInMilliseconds || 500;
    //         setTimeout(() => getDiscovererlastEvent(discovererId, callback), retryAfter);
    //         console.log('retrying after ', retryAfter);
    //     } else {
    //         console.log('error getOrCreateCollection', err);
    //     }

    // } else {
    var querySpec = {
        query: 'SELECT c.timestamp, c.eventType FROM c WHERE c.discovererId= @discovererId and c.entity= @entity',
        parameters: [
            {
                name: '@discovererId',
                value: discoverer.id
            },
            {
                name: '@entity',
                value: 'evtl'
            }
        ]
    }

    utils.find(client, coll, querySpec, function (err, result) {
        if (err) {
            console.log('error inside find', err);
        } else {
            if (result.length > 0) {

                var eventLog = result.reduce(function (r, a) {
                    return (typeof a === 'undefined') ? r : new Date(r.timestamp) > new Date(a.timestamp) ? r : a
                });

                callback(eventLog);
            } else {
                callback({
                    timestamp: discoverer._ckCreatedAt,
                    eventType: 'Login - User Registration Success'
                });
            }
        }
    });
    // }
    // });
}

function findRiasecValues(discoverData) {
    let riasecValues = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    let riasec1 = 'R';
    let riasec2 = 'I';
    if (discoverData.personalityProfile && typeof discoverData.personalityProfile.PersonalityScores != 'undefined') {
        for (let personalityScore of discoverData.personalityProfile.PersonalityScores) {
            riasecValues[personalityScore.personalityType] = personalityScore.score;
        }

        let personalityScores = [];
        for (let riasecKey in riasecValues) {
            personalityScores.push({
                emphasized: true,
                personalityType: riasecKey,
                score: riasecValues[riasecKey]
            });
        }

        discoverData.personalityProfile.PersonalityScores = personalityScores;
    }

    if (riasecValues[riasec1] < riasecValues[riasec2]) {
        let tempRiasec = riasec1;
        riasec1 = riasec2;
        riasec2 = tempRiasec;
    }

    for (let riasacKey in riasecValues) {
        if (riasec1 != riasacKey && riasecValues[riasec1] < riasecValues[riasacKey]) {
            riasec2 = riasec1;
            riasec1 = riasacKey;
        } else if (riasec2 != riasacKey && riasec1 != riasacKey && riasecValues[riasec2] < riasecValues[riasacKey] && riasecValues[riasacKey] <= riasecValues[riasec1]) {
            riasec2 = riasacKey;
        }
    }

    return {
        riasec1: riasecValues[riasec1] != 0 ? riasec1 : '-',
        riasec2: riasecValues[riasec2] != 0 ? riasec2 : '-'
    };
}

function calculateNewPersonalityScore(discoverData){
    try {
        let localeName = '';
        let personalityProfile = {};
        let additionalInformation = [];
        let inCompatibleTypesFlag = false;
        let topPersonalityProfileCount = 0;
        let inCompatibleTypes = ['R-S', 'S-R', 'I-E', 'E-I', 'A-C', 'C-A'];
        localeName = `${discoverData.locale.language}-${discoverData.locale.country}`;

        let description=constant[localeName];
        // fs.readFile(`resources/${localeName}/ARHeadersDescriptors.json`, 'utf8', function (err, response) {
    
        //   let description = JSON.parse(response);

            let aggregatedData=[];

            discoverData.personalityProfile.PersonalityScores.forEach(o=>{
                aggregatedData.push({
                    jobs: '',
                    pt: o.personalityType,
                    oneSentence: '',
                    environment: '',
                    scoreDisplay: '',
                    score: o.score,
                    environmentType: 'promising',
                    personalityType: description[0].ShortDescriptions[o.personalityType].personalityType,
                })
            })
        
            aggregatedData.sort(function (a, b) {
                return b.score - a.score;
            });
        
            if (aggregatedData[0].score - aggregatedData[1].score >= 5) {
                topPersonalityProfileCount = 1;
            } else {
                // Note: topPersonalityProfileCount(1=One highest score, 2=2 highest score, 0=more then 2 highest score)
                if (aggregatedData[1].score - aggregatedData[2].score >= 5) {
                topPersonalityProfileCount = 2;
                }
            }
        
            // Note: Calculating environment for bottom 3 score
            aggregatedData.forEach(function (element, index, arr) {
                if (index > 2 && (arr[2].score - element.score) >= 4) {
                element.environmentType = 'challenging';
                } else {
                element.jobs = description[0].ShortDescriptions[element.pt].Jobs.join(', ');
                element.oneSentence = description[0].ShortDescriptions[element.pt].OneSentence;
                element.environment = description[0].ShortDescriptions[element.pt].Environment;
                element.scoreDisplay = description[0].ShortDescriptions[element.pt].scoreDisplay;
        
                additionalInformation.push({
                    pt: element.pt,
                    personalityType: element.personalityType,
                    avoids: description[0].ShortDescriptions[element.pt].Avoids,
                    values: description[0].ShortDescriptions[element.pt].Values,
                    likesTo: description[0].ShortDescriptions[element.pt].Likesto,
                    compatibleTypes: description[0].ShortDescriptions[element.pt].compatibleTypes,
                    hasGoodSkillsWith: description[0].ShortDescriptions[element.pt].Hasgoodskillswith
                });
                }
            }, this);
        
            if(topPersonalityProfileCount === 1)
                {aggregatedData[0].environmentType = 'thriving';}
        
            if (topPersonalityProfileCount === 2) {
                if((inCompatibleTypes.indexOf(aggregatedData[0].pt + '-' + aggregatedData[1].pt) > -1))
                {inCompatibleTypesFlag = true;}
                aggregatedData[0].environmentType = 'thriving';
                aggregatedData[1].environmentType = 'thriving';
            }
        
            personalityProfile = {
                details: aggregatedData,
                header: {
                title: '',
                information: '',
                message: {
                    thriving: '',
                    promising: ''
                }
                },
                additionalInformation: additionalInformation
            };
        
            getResultTaxonomy(description[0], topPersonalityProfileCount, personalityProfile, inCompatibleTypesFlag);
        
            discoverData.personalityProfile=personalityProfile;
            
            return;
        // });
      }
      catch (error) {
        throw error;
      }
}

function getResultTaxonomy(description, topPersonalityProfileCount, personalityProfile, inCompatibleTypesFlag) {
    let ARHeadersDescriptors = description.HeadersDescriptors;
  
    if (topPersonalityProfileCount === 1) {
      personalityProfile.header.title = `${ARHeadersDescriptors.Header1}: ${personalityProfile.details[0].personalityType}`;
      personalityProfile.header.information = `${ARHeadersDescriptors.Descriptor1[0].OnePersonality} ${description.ShortDescriptions[personalityProfile.details[0].pt].scoreDisplay}`;
    }
    else if (topPersonalityProfileCount === 2) {
      personalityProfile.header.title = `${ARHeadersDescriptors.Header1}: ${personalityProfile.details[0].personalityType} and ${personalityProfile.details[1].personalityType}`;
      personalityProfile.header.information = `${ARHeadersDescriptors.Descriptor1[0].TwoPersonalityCompatible} ${description.ShortDescriptions[personalityProfile.details[0].pt].pageHeader} and ${description.ShortDescriptions[personalityProfile.details[1].pt].pageHeader}`;
  
      if (inCompatibleTypesFlag) {
        personalityProfile.header.information = `${ARHeadersDescriptors.Descriptor1[0].TwoPersonalityInConsistent}`;
        personalityProfile.header.message.thriving = `${ARHeadersDescriptors.Descriptor3[0].TwoPersonalityInConsistent}`;
      }
    }
    else if (topPersonalityProfileCount !== 2) {
      personalityProfile.header.title = `${ARHeadersDescriptors.Header1}: ${personalityProfile.details[0].personalityType}, ${personalityProfile.details[1].personalityType} and ${personalityProfile.details[2].personalityType}`;
      personalityProfile.header.information = `${ARHeadersDescriptors.Descriptor1[0].MoreThanTwo}`;
      personalityProfile.header.message.promising = `${ARHeadersDescriptors.Descriptor3[0].MoreThanTwo}`;
    }

    return;
  }

function getEventTypeAndCategory(eventType) {
    switch (eventType) {
        case "Discoverer Account Created":
        case "Login - User Registration Success":
            return { "lastEventType": "Invite and Remind to Start", "lastEventCategory": "invite_to_start" };
            break;

        case "Assessment Start":
            return { "lastEventType": "Not Started", "lastEventCategory": "not_started" };
            break;

        case "Assessment End":
            return { "lastEventType": "Completed Assessment", "lastEventCategory": "completed_assessment" };
            break;

        case "Selection Added":
            return { "lastEventType": "Started Profile", "lastEventCategory": "started_profile" };
            break;

        default:
            return { "lastEventType": "Returned To Profile", "lastEventCategory": "returned_to_profile" };
            break;
    }
}
