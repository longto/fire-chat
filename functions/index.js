const functions = require('firebase-functions');
const admin = require('firebase-admin');
const elasticlunr = require('elasticlunr');

let indexSearch = null;

admin.initializeApp(functions.config().firebase);

let loadIndexSearch = (callback)=>{
    if(!indexSearch){
        console.log(`>>>>> indexSearch null, reload`);
        admin.database().ref("search/index").once("value",snapshot=>{
            let json = snapshot.val().join("");
            indexSearch = elasticlunr.Index.load(JSON.parse(json));
            callback();
        });
    }
    else callback();
};
let doSearch = (params,callback)=>{
    let result = indexSearch.search(params.query);
    console.log(result);
    //TODO setup a cache here
    let promises=result.map(e=>admin.database().ref(`search/data/${e.ref}`).once("value").then(snapshot=>snapshot.val()));
    Promise.all(promises).then(results=>callback(results));
};
let splitChunks = (arr,len)=>{
    let res = [],start=0;
    while(start<arr.length) {
        res.push(arr.substr(start,len));
        start+=len;
    }
    return res;
}
exports.createIndex = functions.https.onRequest((request, response) => {
    const options = {
        indexFiels : ['title','body'],
        ref : 'id',
        saveDocument : false
    };
    admin.database().ref("search/data").once("value",snapshot=>{
        indexSearch = elasticlunr(function () {
            options.indexFiels.forEach(e=>{
                this.addField(e)
            });
            this.setRef(options.ref);
            this.saveDocument(options.saveDocument);
        });
        let docs = snapshot.val();
        for(let id in docs){
            let doc = docs[id];
            doc.id=id;
            indexSearch.addDoc(doc);
        }
        let result = splitChunks(JSON.stringify(indexSearch.toJSON()),1000000);
        console.log(result.length);
        for(let i in result){
            admin.database().ref(`search/index/${i}`).set(result[i]);
        }
        response.status(200).send("re-index completed");
    });
});
exports.search = functions.https.onRequest((request, response) => {
  console.log("--------------------");
  let query = `{"${decodeURI(request.url.substr(2)).replace(/&/g, '","').replace(/=/g,'":"')}"}`;
  let params = JSON.parse(query);
  console.log(params);
  loadIndexSearch(()=>doSearch(params,results=>response.status(200).send(results)));
});