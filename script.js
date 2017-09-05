"use strict";
//return;
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
var lastMessage = null;
/* Utils - templates */
var getTime = function (timestamp) { // Convert UNIX epoch time into human readble time.
    let epoch = new Date(timestamp);
    return epoch.toString("t");
}
var getMessageTemplate = function(message){
    let me = message.name == currentUser ? "me" : "",
        keepHeader = lastMessage && message.name == lastMessage.name,
        header = keepHeader ? "" : `<div class="header">
            <strong>${message.name}</strong> 
            <small class="time">${getTime(message.time) || ""}</small>
        </div>`,
        icon = keepHeader ? `<small class="time">${getTime(message.time) || ""}</small>` : `<img src="img/user.png" class="avatar">`,
        action = `<div class="action">
            <span class="glyphicon glyphicon-pencil"></span>
            <span class="glyphicon glyphicon-trash"></span>
        </div>` ;

    return `<div class="message ${me} ${!keepHeader?"pt-15":""}" data-id="${message.id}" data-user="${message.name}">
        <div class="icon">
            ${icon}
        </div>
        <div class="full-width">
            ${header}
            <div class="content">
                ${message.text}
            </div>
            ${action}
        </div>
    </div>`;
};
/* login - logout */
firebase.auth().onAuthStateChanged(function(user) {
    /*if (user != null) {
        user.providerData.forEach(function (profile) {
            console.log("Sign-in provider: "+profile.providerId);
            console.log("  Provider-specific UID: "+profile.uid);
            console.log("  Name: "+profile.displayName);
            console.log("  Email: "+profile.email);
            console.log("  Photo URL: "+profile.photoURL);
        });
    }*/
    /*
    var user = firebase.auth().currentUser;
    user.updateProfile({
      displayName: "Jane Q. User",
      photoURL: "https://example.com/jane-q-user/profile.jpg"
    }).then(function() {
      // Update successful.
    }).catch(function(error) {
      // An error happened.
    });
     */
    if (user) {
        currentUser = !user || user.isAnonymous ? "Anonymous" : user.displayName || user.email;
        console.log(currentUser,"is logged in");
        document.querySelector("#profile .welcome").innerHTML = `${currentUser}`;
        document.querySelector("#login-form").classList.add("hide");
        document.querySelector(".fire-chat").classList.remove("hide");
        initApp();

    } else {
        document.querySelector("#login-form").classList.remove("hide");
        document.querySelector(".fire-chat").classList.add("hide");
    }
});

/*firebase.auth().signInAnonymously().catch(function(error) {
    console.log(error.code,error.message);
}).then(function(user){
});*/
document.querySelector("#create").addEventListener("click",function (e) {
    document.querySelector("#login-form .error").innerHTML = `&#8203`;
    let email=document.querySelector("#login-form #email").value,
        password=document.querySelector("#login-form #pwd").value;
    firebase.auth().createUserWithEmailAndPassword(email,password).catch(function(error){
        console.log(error.code,error.message);
        document.querySelector("#login-form .error").innerHTML = `${error.message} ${error.code}`;
    }).then(function(user){
    });
});
document.querySelector("#login").addEventListener("click",function (e) {
    document.querySelector("#login-form .error").innerHTML = `&#8203`;
    let email=document.querySelector("#login-form #email").value,
        password=document.querySelector("#login-form #pwd").value;
    firebase.auth().signInWithEmailAndPassword(email,password).catch(function(error){
        console.log(error.code,error.message);
        document.querySelector("#login-form .error").innerHTML = `${error.message} ${error.code}`;
    }).then(function(user){
    });
});
document.querySelector("#sign-out").addEventListener("click",function (e) {
    e.preventDefault();
    firebase.auth().signOut().then(function() {
        console.log(currentUser,"is logged out");
    }, function(error) {
        console.log(error.code,error.message);
    });
});
/* editor */
chatMessagesDom.addEventListener("click",function (e) {
    e.preventDefault();
    let target = e.target,id,parent;
    console.log(target);
    if (target.classList.contains("glyphicon-pencil")){
        //update messages
        parent = target.parentNode.parentNode.parentNode;
        id = parent.dataset.id;
        console.log(id);
        document.querySelector("#chat-area").setAttribute("data-id",id);
        document.querySelector("#chat-area").value=parent.querySelector(".content").innerHTML.trim();
    } else if (target.classList.contains("glyphicon-trash")){
        //remove message
        parent = target.parentNode.parentNode.parentNode;
        id = parent.dataset.id;
        chat.child(id).remove();
    }
});
document.querySelector("#chat-area").addEventListener("keyup",function (e) {
    e.preventDefault();
    if (e.keyCode == 13) {
        let newMessage = e.target.value.trim();
        let id = e.target.dataset.id;
        if (newMessage) {
            if (!id){
                chat.push({name: currentUser || "Anonymous", text: newMessage, time: firebase.database.ServerValue.TIMESTAMP });
            } else {
                chat.child(id).update({
                    text: newMessage
                });
                e.target.removeAttribute("data-id");
            }
        }
        e.target.value="";
    }
});

/* CRUD */
var initApp = function(messages){
    chat.once("value", function(snapshot) {
        let messages = snapshot.val();
        let html = "";
        for(let i in messages){
            messages[i].id=i;
            //console.log(messages[i]);
            html+=getMessageTemplate(messages[i],i);
            lastMessage = messages[i];
        }
        //console.log(html);
        chatMessagesDom.innerHTML = html;
        chatMessagesDom.scrollTop = chatMessagesDom.scrollHeight;
    });
    chat.limitToLast(1).on("child_added", function(snapshot, prevChildKey) {
        let newMessage = snapshot.val();
        newMessage.id = snapshot.key;
        console.log("child_added",newMessage);
        chatMessagesDom.innerHTML += getMessageTemplate(newMessage);
        chatMessagesDom.scrollTop = chatMessagesDom.scrollHeight;
        lastMessage = newMessage;
    });
    chat.on("child_removed", function(snapshot, prevChildKey) {
        let id = snapshot.key;
        console.log("child_removed",id);
        document.querySelector(`.message[data-id=${id}]`).remove();
    });
    chat.on("child_changed", function(snapshot, prevChildKey) {
        let id = snapshot.key;
        console.log("child_changed",id,snapshot.val());
        document.querySelector(`.message[data-id=${id}] .content`).innerHTML = snapshot.val().text;
    });
};
