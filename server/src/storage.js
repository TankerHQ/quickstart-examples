const fs = require('fs');

class Storage {
  constructor(dataFolder) {
    this.dataFolder = dataFolder;
  }

  save(user) {
    const path = this.dataFilePath(user.id);
    fs.writeFileSync(path, JSON.stringify(user, null, 2));
  }

  get(userId) {
    const path = this.dataFilePath(userId);
    return this.parseJson(path);
  }

  exists(userId) {
    const path = this.dataFilePath(userId);
    return fs.existsSync(path);
  }

  clearData(userId)  {
    const path = this.dataFilePath(userId);
    const user = this.get(userId);
    user.data = undefined;
    fs.writeFileSync(path, JSON.stringify(user, null, 2));
  }

  // Record a share from `author` to a list of recpients
  share(author, recipients) {
    recipients.forEach(recipient => {
      this.addAccessibleNoteId(author, recipient);
    });
    this.addNoteRecipients(author, recipients);
  }

  // Record that `to` shared a note with `from`
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

  // Record that the note of `from` is shared with `to`
  addNoteRecipients(from, to) {
    const user = this.get(from);
    user.noteRecipients = to;
    this.save(user);
  }

  dataFilePath(userId) {
    return `${this.dataFolder}/${userId.replace(/[/\\]/g, '_')}.json`;
  }

  parseJson(path) {
    const data = fs.readFileSync(path);
    return JSON.parse(data);
  }

  getAllIds() {
    const jsonFiles = fs.readdirSync(this.dataFolder).filter(f => f.match(/\.json$/));
    return jsonFiles.map(path => {
    const fullPath = `${this.dataFolder}/${path}`;
      const user = this.parseJson(fullPath);
      return user.id;
    });
  }

}

module.exports.default = Storage;
