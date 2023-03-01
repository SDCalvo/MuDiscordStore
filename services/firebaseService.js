import admin from '../config/firebase';

//make a function called addUser that creates a user in a firestore collection called 'Users'
function addUser(id, user) {
  return admin.firestore().collection('users').doc(id).create(user);
}

function reassignUser(id, user) {
  return admin.firestore().collection('users').doc(id).set(user);
}

const usersCache = [];

function cacheUsers() {
  return admin
    .firestore()
    .collection('users')
    .get()
    .then((snapshot) => {
      snapshot.forEach((doc) => {
        usersCache.push(doc.data());
      });
    });
}

export default { addUser, reassignUser, cacheUsers };