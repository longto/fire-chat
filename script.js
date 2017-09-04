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
var chat = database.ref('chat');
var currentUser;
var chatMessagesDom = document.querySelector(".chat-messages");
var updateCurrentUser = function(user){
    currentUser = user.isAnonymous ? "Anonymous" : user.displayName || user.email;
    console.log(currentUser);
}
firebase.auth().signInAnonymously().catch(function(error) {
    console.log(error.code,error.message);
}).then(function(user){
    updateCurrentUser(user);
});
document.querySelector("#login").addEventListener("click",function (e) {
    let email=document.querySelector("#login-form #email").value,
        password=document.querySelector("#login-form #pwd").value;
    firebase.auth().signInWithEmailAndPassword(email,password).catch(function(error){
        console.log(error.code,error.message);
    }).then(function(user){
        updateCurrentUser(user);
    });
})

document.querySelector("#chat-area").addEventListener("keyup",function (e) {
    e.preventDefault();
    if (e.keyCode == 13) {
        addMessage(e.target.value,currentUser);
        e.target.value="";
    }
});
var getTime = function (timestamp) { // Convert UNIX epoch time into human readble time.
    var epoch = new Date(timestamp);
    return epoch.toString("t");
}
var getMessageTemplate = function(message,id){
    var me = message.name == currentUser ? "me" : "";
    return `<div class="message ${me}" data-id="${id}">
        <div>
            <strong>${message.name}</strong>
            <small>${getTime(message.time) || ""}</small>
        </div>
        <div class="content">${message.text}</div>
    </div>`;
};
var previousMessages = function(messages){
    var html = "";
    for(let i in messages){
        console.log(messages[i]);
        html+=getMessageTemplate(messages[i],i);
    }
    console.log(html);
    chatMessagesDom.innerHTML = html;
    chatMessagesDom.scrollTop = chatMessagesDom.scrollHeight;
}
var addMessage = function(text,user){
    return chat.push({name: user || "Anonymous", text: text, time: firebase.database.ServerValue.TIMESTAMP });
};
chat.once("value", function(snapshot) {
    previousMessages(snapshot.val());
});
chat.on("child_added", function(snapshot, prevChildKey) {
    console.log(snapshot.val(),snapshot.key);
    document.querySelector(".chat-messages").innerHTML += getMessageTemplate(snapshot.val(),snapshot.key);
    chatMessagesDom.scrollTop = chatMessagesDom.scrollHeight;
});
