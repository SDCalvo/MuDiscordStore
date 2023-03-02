import admin from '../config/firebase';

//make a function called addUser that creates a user in a firestore collection called 'Users'
function addUser(id, user) {
  return admin.firestore().collection('users').doc(id).create(user);
}

function editUser(id, user) {
  return admin.firestore().collection('users').doc(id).set(user);
}

function reassignUser(id, user) {
  return admin.firestore().collection('users').doc(id).set(user);
}

// Store functions
function addNewStoreEntry(id, storeEntry) {
  return admin.firestore().collection('store').doc().create(storeEntry);
}

function editStoreEntry(id, storeEntry) {
  return admin.firestore().collection('store').doc(id).set(storeEntry);
}

function deleteStoreEntry(id) {
  return admin.firestore().collection('store').doc(id).delete();
}

function getAllStoreEntries() {
  return admin.firestore().collection('store').get();
}

function getStoreEntriesByMode(mode) {
  return admin.firestore().collection('store').where('mode', '==', mode).get();
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

export default {
  addUser,
  editUser,
  reassignUser,
  cacheUsers,
  addNewStoreEntry,
  editStoreEntry,
  deleteStoreEntry,
  getAllStoreEntries,
  getStoreEntriesByMode,
};
