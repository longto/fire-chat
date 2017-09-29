"use strict";
var config = {
    apiKey: "AIzaSyCSU5HodO7sSPEOePaTOK2N7I76ly3M2_4",
    authDomain: "fire-chat-3fb89.firebaseapp.com",
    databaseURL: "https://fire-chat-3fb89.firebaseio.com",
    projectId: "fire-chat-3fb89",
    storageBucket: "fire-chat-3fb89.appspot.com",
    messagingSenderId: "395021246148"
};
firebase.initializeApp(config);
var storage = firebase.storage();
var database = firebase.database();
var messaging = firebase.messaging();

var text = "Red hair crookshanks bludger Marauder’s Map Prongs sunshine daisies butter mellow Ludo Bagman. Beaters gobbledegook N.E.W.T., Honeydukes eriseD inferi Wormtail. Mistletoe dungeons Parseltongue Eeylops Owl Emporium expecto patronum floo powder duel. Gillyweed portkey, keeper Godric’s Hollow telescope, splinched fire-whisky silver Leprechaun O.W.L. stroke the spine. Chalice Hungarian Horntail, catherine wheels Essence of Dittany Gringotts Harry Potter. Prophecies Yaxley green eyes Remembrall horcrux hand of the servant. Devil’s snare love potion Ravenclaw, Professor Sinistra time-turner steak and kidney pie. Cabbage Daily Prophet letters from no one Dervish and Banges leg. Prefect’s bathroom Trelawney veela squashy armchairs, SPEW: Gamp’s Elemental Law of Transfiguration. Magic Nagini bezoar, Hippogriffs Headless Hunt giant squid petrified. Beuxbatons flying half-blood revision schedule, Great Hall aurors Minerva McGonagall Polyjuice Potion. Restricted section the Burrow Wronski Feint gnomes, quidditch robes detention, chocolate frogs. Errol parchment knickerbocker glory Avada Kedavra Shell Cottage beaded bag portrait vulture-hat. Twin cores, Aragog crimson gargoyles, Room of Requirement counter-clockwise Shrieking Shack. Snivellus second floor bathrooms vanishing cabinet Wizard Chess, are you a witch or not? Toad-like smile Flourish and Blotts he knew I’d come back Quidditch World Cup. Fat Lady baubles banana fritters fairy lights Petrificus Totalus. So thirsty, deluminator firs’ years follow me 12 inches of parchment. Head Boy start-of-term banquet Cleansweep Seven roaring lion hat. Unicorn blood crossbow mars is bright tonight, feast Norwegian Ridgeback. Come seek us where our voices sound, we cannot sing above the ground, Ginny Weasley bright red. Fanged frisbees, phoenix tears good clean match.".split(" ");
var random = function(){
    return arguments.length < 2 ? Math.random() * (arguments[0] || 10) : arguments[0] + Math.random()*arguments[1];
}
var randomText = function(){
    var len = random(100) | 0,
        start = Math.random() * (text.length - len) | 0 ,
        sub = text.slice(start,start+len).join(" ");
    return sub;
}

var indexSearch = elasticlunr(function () {
    this.addField('title');
    this.addField('body');
    this.setRef('id');
    this.saveDocument(false);
});

var limit = 5000,docs=[],tmpJson,
    option={
        isCompress : false,
        isFirebase : true
    }
var firebaseSearchData = database.ref('search/data');
var firebaseSearchIndex = database.ref('search/index');

let calcPerform = (func,title)=>{
    let start = performance.now();
    if(func) func();
    let end = performance.now();
    console.log(`${title?title:"anonymous work"} done , ${end - start} ms`);
};

let seedFunc = ()=>{
    //firebaseSearchData.set("");
    for (let i = 0; i < limit; i++) {
        let doc = {
            title: randomText(),
            body: randomText(),
            comment: randomText()
        }
        docs.push(doc);
        firebaseSearchData.push(doc);
    }
    if (option.isFirebase) {
        //firebaseSearchData.set(docs);
    }
};

let pushSearchIndex = ()=>{
    let json = JSON.stringify(indexSearch.toJSON());
    console.log(json);
    if (option.isCompress) json = LZString.compress(json)
    tmpJson = json;
    if (option.isFirebase) firebaseSearchIndex.set(json);
}

let pullSearchIndex = ()=>{
    let json;
    if (!option.isCompress) {
        json = tmpJson;
        if(option.isCompress) json = LZString.decompress(json);
        indexSearch = elasticlunr.Index.load(JSON.parse(json));
    }
    else {
        firebaseSearchIndex.once("value",function(snap){
            let json = snap.val();
            if(json!=tmpJson){
                console.error("json not match");
                debugger;;
            }
            if(option.isCompress) json = LZString.decompress(json);
            indexSearch = elasticlunr.Index.load(JSON.parse(json));
        });
    }
};
let indexFunc = function(){
    docs.forEach((doc,i)=>{
        indexSearch.addDoc(doc);
    });
};
document.querySelector("#seed").addEventListener("click",function(e) {
    calcPerform(seedFunc,e.target.id);
});
document.querySelector("#index").addEventListener("click",function(e) {
    calcPerform(indexFunc,e.target.id);
    calcPerform(pushSearchIndex,"pushSearchIndex");
});
document.querySelector("#load-index").addEventListener("click",function(e) {
    calcPerform(pullSearchIndex,"pullSearchIndex");
});

document.querySelector("#search-input").addEventListener("keydown",function (e) {
    let key = e.which || e.keyCode;
    let query = e.target.value;
    switch (key){
        case 13:
            let result = indexSearch.search(query);
            console.log(query,result);
            break;
        default:
            break;
    }
});

document.querySelector("#seed").click();
/*document.querySelector("#index").click();
setTimeout(function () {
    document.querySelector("#load-index").click();
},5000);*/
