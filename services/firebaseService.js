import admin from '../config/firebase';

//make a function called addUser that creates a user in a firestore collection called 'Users'
function addUser(id, user) {
  return admin.firestore().collection('users').doc(id).create(user);
}

console.log('text');

function editUser(id, user) {
  return admin.firestore().collection('users').doc(id).set(user);
}

function reassignUser(id, user) {
  return admin.firestore().collection('users').doc(id).set(user);
}

function getUserById(id) {
  return admin.firestore().collection('users').doc(id).get();
}

function getAllUsers() {
  return admin.firestore().collection('users').get();
}

// Store functions
async function addNewStoreEntry(storeEntry) {
  //Return the new doc id
  const docRef = admin.firestore().collection('store').doc();
  //Add new doc id as a field in the storeEntry object
  storeEntry.id = docRef.id;
  docRef.set(storeEntry);
  console.log('New store entry added with id: ', docRef.id);
  return docRef.id;
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

function getStoreEntryById(id) {
  return admin.firestore().collection('store').doc(id).get();
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
  getUserById,
  getAllUsers,
  cacheUsers,
  addNewStoreEntry,
  getStoreEntryById,
  editStoreEntry,
  deleteStoreEntry,
  getAllStoreEntries,
  getStoreEntriesByMode,
};
