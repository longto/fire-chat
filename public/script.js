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
var presence = database.ref("presence");
var currentUser,currentUserUid;
var chatMessagesDom = document.querySelector(".chat-messages");
var online = document.querySelector(".online");
var lastMessage = {};
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
        icon = keepHeader ? `<small class="time">${getTime(message.time) || ""}</small>` : `<img src="https://www.b1g1.com/assets/admin/images/no_image_user.png" class="avatar">`,
        action = me ? `<div class="action">
            <span class="glyphicon glyphicon-pencil"></span>
            <span class="glyphicon glyphicon-trash"></span>
        </div>` : "";

    return `<div class="message ${me}" data-id="${message.id}" data-user="${message.name}">
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
        //firebase.auth().currentUser
        currentUser = !user || user.isAnonymous ? "Anonymous" : user.displayName || user.email;
        currentUserUid = user.uid;
        console.log(currentUser,"is logged in");
        document.querySelector("#profile .welcome").innerHTML = `${currentUser}`;
        document.querySelector("#login-form").classList.add("hide");
        document.querySelector(".fire-chat").classList.remove("hide");
        initApp();
    } else {
        document.querySelector("#login-form").classList.remove("hide");
        document.querySelector(".fire-chat").classList.add("hide");
        lastMessage={};
    }
});
document.querySelector("#loginGoogle").addEventListener("click",function (e) {
    let provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
    firebase.auth().signInWithPopup(provider).then(function(result) {
        let token = result.credential.accessToken;
        let user = result.user;
    }).catch(function(error) {
        console.log(error.code,error.message);
    });
});
document.querySelector("#loginAnonymous").addEventListener("click",function (e) {
    firebase.auth().signInAnonymously().catch(function(error) {
        console.log(error.code,error.message);
    }).then(function(user){
    });
});
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
    presence.child(currentUserUid).remove();
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
document.querySelector("#fileElem").addEventListener("change",function (e) {
    let file = e.target.files[0];
    console.log(file);
    storage.ref("images").child(file.name).put(file).then(function(snapshot) {
        console.log('Uploaded a blob or file!',snapshot);
        let url = snapshot.metadata.downloadURLs[0];
        if (url){
            let img = `<img src="${url}"/>`
            chat.push({name: currentUser || "Anonymous", text: img, time: firebase.database.ServerValue.TIMESTAMP });
        }
    });
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
        if(!lastMessage.name) return;
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
        let targetDom = document.querySelector(`.message[data-id=${id}]`),
            nextDom = targetDom.nextSibling;
        if(targetDom.dataset.user==nextDom.dataset.user && targetDom.querySelector(".icon img")){
            //swap content
            console.log("need to move",nextDom);
            targetDom.querySelector(".time").innerHTML = nextDom.querySelector(".time").innerHTML;
            targetDom.querySelector(".content").innerHTML = nextDom.querySelector(".content").innerHTML;
            nextDom.innerHTML=targetDom.innerHTML;
        }
        targetDom.remove();
    });
    chat.on("child_changed", function(snapshot, prevChildKey) {
        let id = snapshot.key;
        console.log("child_changed",id,snapshot.val());
        document.querySelector(`.message[data-id=${id}] .content`).innerHTML = snapshot.val().text;
    });

    /* check online user */
    var userRef = presence.child(firebase.auth().currentUser.uid);
    // Add ourselves to presence list when online.
    database.ref(".info/connected").on("value", function(snap) {
        if (snap.val()) {
            // Remove ourselves when we disconnect.
            console.log(userRef);
            userRef.onDisconnect().remove();
            userRef.set(currentUser);
        }
    });
    // Number of online users is the number of objects in the presence list.
    presence.on("value", function(snap) {
        let status = snap.val(),html="";
        for (let i in status){
            console.log(status[i]);
            html+=`<div class="offline">${status[i]}</div>`;
        }
        online.innerHTML = html;
        console.log("# of online users = " + snap.numChildren(),snap.val(),snap);
    });
};
/*var credential = firebase.auth.EmailAuthProvider.credential(email, password);
auth.currentUser.link(credential).then(function(user) {
    console.log("Anonymous account successfully upgraded", user);
}, function(error) {
    console.log("Error upgrading anonymous account", error);
});*/
//https://stackoverflow.com/questions/23227966/check-firebase-for-an-existing-object-based-on-attributes-prevent-duplicates