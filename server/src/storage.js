const fs = require('fs');
const pathlib = require('path');

const diffArrays = (a, b) => {
  const aSet = new Set(a);
  const bSet = new Set(b);
  const removed = [];
  aSet.forEach((el) => {
    if (!bSet.delete(el)) {
      removed.push(el);
    }
  });
  const added = Array.from(bSet.values());
  return { added, removed };
};

class Storage {
  constructor(dataFolder, trustchainId) {
    const escapedTrustchainId = trustchainId.replace(/[/\\]/g, '_');
    this.dataFolder = `${dataFolder}/${escapedTrustchainId}`;
    if (!fs.existsSync(this.dataFolder)) {
      fs.mkdirSync(this.dataFolder);
    }
  }

  save(user) {
    const path = this.dataFilePath(user.id);
    fs.writeFileSync(path, JSON.stringify(user, null, 2));
  }

  exists(userId) {
    const path = this.dataFilePath(userId);
    return fs.existsSync(path);
  }

  get(userId) {
    const path = this.dataFilePath(userId);
    return this.parseJson(path);
  }

  getByEmail(email) {
    const users = this.getAll();
    for (const user of users) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  clearData(userId) {
    const path = this.dataFilePath(userId);
    const user = this.get(userId);
    user.data = undefined;
    fs.writeFileSync(path, JSON.stringify(user, null, 2));
  }

  // Record a share from `author` to a list of recipients
  share(authorId, recipientIds) {
    const author = this.get(authorId);

    const prevRecipientIds = author.noteRecipients || [];
    const { added, removed } = diffArrays(prevRecipientIds, recipientIds);
    added.forEach((recipientId) => this.addAccessibleNoteId(authorId, recipientId));
    removed.forEach((recipientId) => this.removeAccessibleNoteId(authorId, recipientId));

    author.noteRecipients = recipientIds;
    this.save(author);
  }

  // Record that `to` has access to the note of `from`
  addAccessibleNoteId(from, to) {
    const user = this.get(to);
    if (!user.accessibleNotes) {
      user.accessibleNotes = [];
    }
    if (!user.accessibleNotes.includes(from)) {
      user.accessibleNotes.push(from);
    }
    this.save(user);
  }

  // Record that `to` has no longer access to the note of `from`
  removeAccessibleNoteId(from, to) {
    const user = this.get(to);
    if (!user.accessibleNotes) {
      user.accessibleNotes = [];
    }
    user.accessibleNotes = user.accessibleNotes.filter((id) => id !== from);
    this.save(user);
  }

  setPasswordResetSecret(userId, secret) {
    const user = this.get(userId);
    user.password_reset_secret = secret;
    this.save(user);
  }

  getAll() {
    const jsonFiles = fs.readdirSync(this.dataFolder).filter((f) => f.match(/\.json$/));
    return jsonFiles.map((path) => {
      const fullPath = `${this.dataFolder}/${path}`;
      const user = this.parseJson(fullPath);
      return user;
    });
  }

  dataFilePath(userId) {
    return `${this.dataFolder}/${userId.replace(/[/\\]/g, '_')}.json`;
  }

  parseJson(path) {
    try {
      const data = fs.readFileSync(path);
      return JSON.parse(data);
    } catch (e) {
      const relPath = pathlib.relative(this.dataFolder, path);
      throw Error(`Could not parse ${relPath}: ${e}`);
    }
  }
}

module.exports = Storage;
