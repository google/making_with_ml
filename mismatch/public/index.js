
var blinks = document.getElementsByTagName('blink');
var visibility = 'hidden';
window.setInterval(function () {
    for (var i = blinks.length - 1; i >= 0; i--) {
        blinks[i].style.visibility = visibility;
    }
    visibility = (visibility === 'visible') ? 'hidden' : 'visible';
}, 600);

// querySnapshot.forEach((doc) => {
//     console.log(`${doc.id} => ${doc.data()}`);
//     data.push(doc.data());
// });

const docId = "fashion-pics-codergirl_-56781294_2258840601024071_2403405490020463770_n.jpg";


let outfit = db.collection("users").doc("alovelace").collection("outfits").doc(docId);
Vue.use(Vuefire.default);

var app = new Vue({
    el: '#app',
    firestore: {
        outfit: outfit
    },
    data: {
        outfit: null
    }
  })
