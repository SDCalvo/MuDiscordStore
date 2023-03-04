import firebaseService from '../services/firebaseService';
import admin from '../config/firebase';
import Discord from 'discord.js';

const db = admin.firestore();

const storeModePrefix = {
  buy: 'c',
  sell: 'v',
  change: 'i',
};

const storeIntentions = {
  c: 'compra',
  v: 'vende',
  i: 'intercambia',
};

const modeSeparator = '>';
const priceSeparator = '=';

module.exports = {
  name: 'store',
  description: 'Vende, cambia o compra items desde discord.',
  async execute(message, args) {
    if (!message.content.startsWith('mu!store')) {
      message.reply(
        'Comando inexsistente. Utiliza "mu!store help" para ver todos los comandos disponibles.',
      );
      return;
    }
    const user = message.author;
    const userRef = db.collection('users').doc(user.id);
    const userDoc = await userRef.get().then((doc) => {
      if (!doc.exists) {
        // create user
        const newUser = {
          id: user.id,
          username: user.username,
          discriminator: user.discriminator,
          avatar: user.avatar,
        };
        firebaseService.addUser(user.id, newUser);
      }

      return doc.data();
    });

    if (!args.length) {
      message.reply(
        'Debes enviar el comando completo. Por ejemplo: ***mu!store c>item=precio*** o ***mu!store v>item=precio*** o ***mu!store i>item=otro item***',
      );
      return;
    }

    const isHelpCommand = args[0].includes('help');
    const isListCommand = args[0].includes('list');
    const isTableCommand = args[0].includes('table');

    if (isHelpCommand) {
      message.reply(
        `\`\`\`Utiliza este comando para interactuar con la tienda.
- Utiliza "mu!store list" para ver todas las entradas de la tienda.
- También puedes utilizar los comandos:
  - "mu!store list c" para ver las entradas de compra.
  - "mu!store list v" para ver las entradas de venta.
  - "mu!store list i" para ver las entradas de intercambio.
- Utiliza "mu!store table" para ver todas las entradas de la tienda en una tabla.
- También puedes utilizar los comandos:
  - "mu!store table c" para ver las entradas de compra.
  - "mu!store table v" para ver las entradas de venta.
  - "mu!store table i" para ver las entradas de intercambio.
- Utiliza el prefijo "c" para comprar, "v" para vender o "i" para intercambiar.
- Por ejemplo: 
  - mu!store c>item=precio 
  - mu!store v>item=precio 
  - mu!store i>item=otro item\`\`\``,
      );
      return;
    }

    if (isListCommand) {
      const storeEntriesArray = await getStoreEntriesArray(message);
      if (!storeEntriesArray || storeEntriesArray.length === 0) {
        message.channel.send('***No hay entradas en la tienda.***');
        return;
      }

      storeEntriesArray.forEach((entry) => {
        const row = new Discord.ActionRowBuilder().addComponents(
          new Discord.ButtonBuilder()
            .setCustomId(`delete-btn-${entry.id}`)
            .setLabel('Eliminar')
            .setStyle(Discord.ButtonStyle.Danger),
        );

        const embededMessage = new Discord.EmbedBuilder()
          .setColor('#0099ff')
          .setTitle(`${entry.content}`)
          .setDescription(
            `**${storeIntentions[entry.mode]}** por **${entry.price}**`,
          )
          .addFields({
            name: 'Usuario',
            value: `<@${entry.userId}>`,
            inline: true,
          })
          .setImage(entry.image)
          .setTimestamp();

        message.channel.send({ embeds: [embededMessage], components: [row] });
      });

      return;
    }

    if (isTableCommand) {
      const storeEntriesArray = await getStoreEntriesArray(message);
      if (!storeEntriesArray || storeEntriesArray.length === 0) {
        message.channel.send('***No hay entradas en la tienda.***');
        return;
      }
      //Table with all store entries
      const padding = 8;
      const formatedStoreEntries = storeEntriesArray
        .map((entry) => {
          return {
            mode: storeIntentions[entry.mode],
            content: entry.content,
            price: entry.price,
            user: entry.username,
          };
        })
        .sort((a, b) => {
          if (a.mode < b.mode) {
            return -1;
          }
          if (a.mode > b.mode) {
            return 1;
          }
          return 0;
        });

      const lengths = formatedStoreEntries.reduce(
        (acc, entry) => {
          acc.mode = Math.max(acc.mode, entry.mode.length);
          acc.content = Math.max(acc.content, entry.content.length);
          acc.price = Math.max(acc.price, entry.price.length);
          acc.user = Math.max(acc.user, entry.user.length);
          return acc;
        },
        {
          mode: 0,
          content: 0,
          price: 0,
          user: 0,
        },
      );

      const header = [
        '#Acción'.padEnd(lengths.mode + padding),
        'Usuario'.padEnd(lengths.user + padding),
        'Artículo'.padEnd(lengths.content + padding),
        'Acepta'.padEnd(lengths.price + padding),
      ].join('');

      const table = formatedStoreEntries
        .map((entry) => {
          return [
            entry.mode.padEnd(lengths.mode + padding),
            entry.user.padEnd(lengths.user + padding),
            entry.content.padEnd(lengths.content + padding),
            entry.price.padEnd(lengths.price + padding),
          ].join('');
        })
        .join('\n');

      message.reply(`\`\`\`md\n${header}\n${table}\`\`\``);

      return;
    }

    const completeText = args.join(' ');
    const mode = completeText.split(modeSeparator)[0];
    const content = completeText
      .split(modeSeparator)[1]
      .split(priceSeparator)[0];
    const price = completeText.split(priceSeparator)[1];

    const storeModePrefixValues = Object.values(storeModePrefix);

    if (!storeModePrefixValues.includes(mode) || !content || !price) {
      message.reply(
        'Comando incorrecto, usa "c" para comprar, "v" para vender o "i" para intercambiar (En minúsculas). Por ejemplo: ***mu!store c>item=precio*** o ***mu!store v>item=precio*** o ***mu!store i>item=otro item***.',
      );
      return;
    }

    const attachments = Array.from(message.attachments.values());

    const storeEntry = {
      userId: user.id,
      username: user.username,
      discriminator: user.discriminator,
      avatar: user.avatar,
      mode: mode,
      content,
      price,
      image: attachments[0]?.url || attachments[0]?.proxyURL || null,
      messageId: message.id,
      createdAt: new Date().toISOString(),
    };

    //Check if user has already the same store entry
    const userStoreEntries = userDoc.storeEntries || [];
    const userHasSameStoreEntry = userStoreEntries.some(
      (entry) =>
        entry.content === content &&
        entry.mode === mode &&
        entry.price === price,
    );

    if (userHasSameStoreEntry) {
      message.reply('Ya tienes una entrada igual en la tienda.');
      return;
    }

    const newEntryId = await firebaseService.addNewStoreEntry(storeEntry);

    //Add store entry id to entry object
    storeEntry.id = newEntryId;
    //Update user with new store entry
    userStoreEntries.push(storeEntry);
    userDoc.storeEntries = userStoreEntries;
    firebaseService.editUser(user.id, userDoc);
    message.reply('Tu entrada en la tienda ha sido creada.');
  },
};

async function getStoreEntriesArray(message) {
  let mode = '';
  if (
    message.content.endsWith('c') ||
    message.content.endsWith('v') ||
    message.content.endsWith('i')
  ) {
    mode = message.content.slice(-1);
  }
  const storeEntries =
    mode === ''
      ? await firebaseService.getAllStoreEntries()
      : await firebaseService.getStoreEntriesByMode(mode);
  const storeEntriesArray = [];
  storeEntries.forEach((entry) => {
    storeEntriesArray.push(entry.data());
  });

  return storeEntriesArray;
}
