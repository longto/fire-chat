const functions = require('firebase-functions');
const admin = require('firebase-admin');
const elasticlunr = require('elasticlunr');

let indexSearch = null;
admin.initializeApp(functions.config().firebase);
let loadIndexSearch = (callback)=>{
    if(!indexSearch){
        console.log(`>>>>> indexSearch null, reload`);
        admin.database().ref("search/index").once("value",snapshot=>{
            let json = snapshot.val();
            indexSearch = elasticlunr.Index.load(JSON.parse(json));
            callback();
        });
    }
    else callback();
};
exports.createIndex = functions.https.onRequest((request, response) => {
    admin.database().ref("search/data").once("value",snapshot=>{
        indexSearch = elasticlunr(function () {
            this.addField('title')
            this.addField('body')
        });
        let docs = snapshot.val();
        for(var i in docs){
            indexSearch.addDoc(docs[i]);
            //console.log(docs[i]);
        }
        admin.database().ref("search/index").set(JSON.stringify(indexSearch.toJSON()));
        response.status(200).send("re-index completed");
    });
});
exports.search = functions.https.onRequest((request, response) => {
  console.log("--------------------");
  let query = `{"${decodeURI(request.url.substr(1)).replace(/&/g, '","').replace(/=/g,'":"')}"}`;
  let params = JSON.parse(query);
  console.log(params);
  loadIndexSearch(()=>{
      response.status(200).send(indexSearch.search(params.title));
  });
});