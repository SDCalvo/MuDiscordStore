import firebaseService from './firebaseService';

async function deleteOldStoreEntries() {
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const users = await firebaseService.getAllUsers();
  const storeEntries = await firebaseService.getAllStoreEntries();
  const usersData = [];
  const storeEntriesData = [];
  users.forEach((user) => {
    usersData.push(user.data());
  });
  storeEntries.forEach((entry) => {
    storeEntriesData.push(entry.data());
  });
  await Promise.all(
    usersData.map(async (user) => {
      const storeEntries = user.storeEntries || [];
      const newStoreEntries = storeEntries.filter((entry) => {
        const entryDate = new Date(entry.createdAt);
        return entryDate > threeDaysAgo;
      });
      user.storeEntries = newStoreEntries;
      await firebaseService.reassignUser(user.id, user);
    }),
  );
  await Promise.all(
    storeEntriesData.map(async (entry) => {
      const entryDate = new Date(entry.createdAt);
      if (entryDate < threeDaysAgo) {
        await firebaseService.deleteStoreEntry(entry.id);
      }
    }),
  );
}

export default {
  deleteOldStoreEntries,
};
