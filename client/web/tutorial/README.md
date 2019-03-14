# Notepad application tutorial

In this tutorial we will demonstrate how to use the Tanker SDK inside an existing React JavaScript application.

Your mission, should you decide to accept it, is to follow the instructions below in order to implement end-to-end encryption.

Knowledge about UI frameworks such as React is not required. However, the functions and methods of the Tanker API are asynchronous, so to take out the most of this tutorial you should know about [async functions](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Instructions/async_function).

You are going to actually write some code there, so before you start please familiarize yourself the [api documentation](https://docs.tanker.io/latest/api/tanker/?language=javascript).

## Environment set up

Please check that [the server is started](../../../README.md) as this example application will rely on it.


## The application

### Description

The Web application is a simple notepad written in React.

Each user has access to exactly one note.

It implements the following features:

* Signing up
* Logging in and out
* Loading and saving a single note by sending it to the notepad server
* Sharing the note with other users
* Reading notes shared by other users

Here is the user experience flow:

1. A new user signs up with an email address and a password
2. A form field allows to edit, save and/or share a single note
3. A list of shared notes is displayed below the edition field

The server handles user signup by hashing their password, and can also store the user's note.

The server is also able to send to an authenticated user their [Tanker Identity](https://docs.tanker.io/latest/guide/user-token/), and Tanker Public Identities of other users they might share content with.

### Run

To start the application, run in a new terminal:

```bash
yarn start:web:tutorial
```

The application should open in a new browser tab. If not, go to http://127.0.0.1:3000/ manually.

### Start using the application

Now that the application is up and running, please follow the steps below:

1. Sign up with an email and a password, e.g. `alice_at_example.com` and the password `p4ssw0rd`.

1. Click on the `Edit my note` link, type some text in the notepad's input and click on the `Save` button.

1. Open another browser and sign up a new user, e.g. `bob_at_example.com` with the password `letmein`.

1. Go back to the first browser, edit the note (say `Alice's message for Bob`) and click on the `Share` button.

1. A list of users pops up. Select `bob_at_example.com` and click on `Share`.

1. Go back to the second browser, click on the `Refresh` link next to the `Notes shared with me` section in the home page.

1. You should see a `From alice_at_example.com` entry in the list. Click on it.

1. The text `Alice's message for Bob` should be displayed.

OK, so far we have demonstrated how users can edit and share notes.


If you have a look at the `./server/data/` directory, you will see a directory named after the TrustChain ID with a couple of json files in it.

This represents the data the notepad server knows about.

You can see that the note we just created and shared is stored in plain text.


If someone were to attack the server, they would have access to all the notes of all the users!

Let's try and fix this!

Data will be encrypted and decrypted client-side, and the notepad server will only see encrypted data.


## Step by step tutorial

Right now, we are going to make sure the data is stored encrypted on the server, while still allowing users transparent access to their notes.

As explained above, the server already contains the required modifications.

Since the tanker SDK implements end-to-end encryption, most cryptographic operations will happen client-side, so in this tutorial we will only have to change code in the `./client/web/tutorial/src/Session.js` file.

In order to help you we left some `FIXME` comments throughout the file.


### Handling a Tanker session

The goal here is to [open and close a tanker session](https://docs.tanker.io/latest/guide/open/?language=javascript).

In the `./client/web/tutorial/src/Session.js` file, the Tanker `config` has already been fetched from the server for you in the `initTanker()` method:
```javascript
const config = await this.serverApi.tankerConfig();
// e.g. { trustchainId: "..." };
```

*Use this config to initialize a new Tanker instance in `Session.initTanker()`.*

<details>
<summary><strong>Click here to see the solution</strong></summary>

```diff
async initTanker() {
  if (this.tanker) return;
  const config = await this.serverApi.tankerConfig();
+ this.tanker = new Tanker(config);
}
```
</details>
<br />

Now we need to handle the creation of a Tanker session, with the help of the [`tanker.signUp()`](https://docs.tanker.io/latest/api/tanker/?language=javascript#signup) and [`tanker.signIn()`](https://docs.tanker.io/latest/api/tanker/?language=javascript#signin) methods.

There are 3 cases here:

* the user just signed up
* the user just logged in
* the user is already logged in on page load (e.g. browser refresh)

In all cases, there's already code in place to retrieve the user's Tanker Identity from the server.

*Replace the `// FIXME: sign up with tanker` comment by an appropriate call to `this.tanker.signUp()`.*
<details>
<summary><strong>Click here to see the solution</strong></summary>

```diff
async signUp(email, password) {
  // ...

+ await this.tanker.signUp(this.user.identity);
  this.status = "open";
}
```

Note that we use `await` because a Tanker signup is not instantaneous, and we do not want to block the application while Tanker is signing the user up.
</details>
<br />

*Replace the 2 occurrences of the `// FIXME: sign in with tanker` comment by an appropriate call to `this.tanker.signIn()`.*
<details>
<summary><strong>Click here to see the solution</strong></summary>

```diff
async init() {
  await this.initTanker();

  // If existing session found (e.g. page reload), open Tanker now
  try {
    // ...

    if (this.user) {
+     await this.tanker.signIn(this.user.identity);
      this.status = "open";
      return;
    }
  }
  // ...
}

async logIn(email, password) {
  // ...

+ await this.tanker.signIn(this.user.identity);
  // FIXME: register the email and password to unlock additional devices

  this.status = "open";
}
```

Note that we use `await` because a Tanker signin is not instantaneous, and we do not want to block the application while Tanker is signing the user in.
</details>
<br />

Note that `signUp()` and `signIn()` methods will use the Tanker Identity to:

* register the user in the TrustChain if necessary,
* register the device in the TrustChain if necessary,
* fetch encryption keys to access all the resources.

Then you should *sign out from Tanker in the `Session.close()` method by using the [`tanker.signOut()`](https://docs.tanker.io/latest/api/tanker/?language=javascript#signout) method*.

<details>
<summary><strong>Click here to see the solution</strong></summary>

```diff
async close(): Promise<void> {
  await this.serverApi.logout();
+ await this.tanker.signOut();
  this._user = null;
  this.status = "closed";
}
```
</details>
<br />

The application's `close()` method will be called when the user logs out. It's important to sign out from Tanker at this moment to make sure the encrypted data is safe at rest.

At this point, nothing has changed in the application, we just made sure we could respectively open and close a Tanker session correctly when signing up, signing in, and signing out.

Now that we know how to open a Tanker session, let's use it to [encrypt, decrypt and share](https://docs.tanker.io/latest/guide/encryption/) the notes!

### Encrypting data

To encrypt data, *use [`tanker.encrypt()`](https://docs.tanker.io/latest/api/tanker/?language=javascript#encrypt) in `Session.saveText()`*.

Don't forget to use [`toBase64()`](https://docs.tanker.io/latest/api/utilities/?language=javascript#base64_to_buffer) to convert the binary encrypted data into text before sending it to the server.


<details>
<summary><strong>Click here to see the solution</strong></summary>

```diff
async saveText(text) {
  const recipients = await this.getNoteRecipients();
  const recipientPublicIdentities = recipients.map(user => user.publicIdentity);

  // use tanker to encrypt the text as binary data, then
  // encode the data and send it to the server
+ const encryptedData = await this.tanker.encrypt(text});
+ const encryptedText = toBase64(encryptedData);
  // FIXME: update this.resourceId
- await this.serverApi.push(text);
+ await this.serverApi.push(encryptedText);
}
```
</details>
<br />

### Decrypting data

To decrypt data, *use [`tanker.decrypt()`](https://docs.tanker.io/latest/api/tanker/?language=javascript#decrypt) in `Session.loadTextFromUser()`*.

Don't forget to use [`fromBase64()`](https://docs.tanker.io/latest/api/utilities/?language=javascript#base64_to_buffer) to convert the encrypted text received from the server into binary.


<details>
<summary><strong>Click here to see the solution</strong></summary>

```diff
async loadTextFromUser(userId) {
  const response = await this.serverApi.getUserData(userId);

  if (response.status === 404) return "";

  // use fromBase64 to get binary data from the response
  // of the server and use tanker to decrypt it.
- const data = await response.text();
- return data;
+ const encryptedText = await response.text();
+ const encryptedData = fromBase64(encryptedText);
+ const clear = await this.tanker.decrypt(encryptedData);
+ return clear;
}
```
</details>
<br />

### Checking it works

Now the data on the server can no longer be used by the clients. So go ahead, and edit the
`.json` files in the `./server/data/` directory to remove the data stored in plain text, by just deleting the `"data"` field.

Migrating existing data from plain text to encrypted text is of course possible, but this is beyond the scope of this tutorial.

You can then try to log in, and check that:

* you can still edit and save a note,
* the `data` field in the `json` is now encrypted.

If you get a `[Tanker] InvalidEncryptionFormat: ...` error message, you probably forgot to clean up plain text data as requested at the beginning of this section.

### Sharing

There is a problem, though. The "share" functionality no longer works.

If you try to repeat the steps we took to share notes between Alice and Bob, you will get a `[Tanker] ResourceNotFound: ...` error message when Bob tries to read Alice's note.

Indeed, the keys used to encrypt and decrypt notes never left the local storage of Alice's browser.

What we need to do is exchange keys from Alice to Bob.

Note that each time we call `tanker.encrypt()` a new encryption key is generated. This transparent key rotation mechanism helps achieving a higher level of security.

We call each version of a note a *resource*. Each time the note changes, we must get its resource ID and ask the Tanker SDK to share access to it.

They are two places we need to do this:

* In the `Session.saveText()` method, called when the user clicks on `save` on the "Edit my note" panel
* In the `Session.share()` method, called when when the users clicks on `share` in the "Share" panel.

Please read the [section about sharing in the documentation](https://docs.tanker.io/latest/guide/encryption/?language=javascript#sharing) first.

Then, *use the `shareWithUsers` option of `tanker.encrypt()` in `Session.saveText()`*.

Also make sure to *get the resource ID matching the newly generated key by using the [`tanker.getResourceId()`](https://docs.tanker.io/latest/api/tanker/?language=javascript#getresourceid) method and update the `Session.resourceId` class member*


<details>
<summary><strong>Click here to see the solution</strong></summary>

```diff
async saveText(text) {
  const recipients = await this.getNoteRecipients();
  const recipientPublicIdentities = recipients.map(user => user.publicIdentity);
- const encryptedData = await this.tanker.encrypt(text);
+ const encryptedData = await this.tanker.encrypt(text, {
+   shareWithUsers: recipientPublicIdentities
+ });
  const encryptedText = toBase64(encryptedData);
+ this.resourceId = await this.tanker.getResourceId(encryptedData);
  await this.serverApi.push(encryptedText);
}
```
</details>
<br />

Next, in the `share` method:

* *Remove the line `this.resourceId = this.user.id` since notes no longer are identified by their creator*.
* *Call [`tanker.share()`](https://docs.tanker.io/latest/api/tanker/?language=javascript#share) with a list containing the current `resourceId` as its first argument. The second argument should be an options object with a `shareWithUsers` property containing the list of recipients' public identities*.
* *To get the recipients' public identities, use the `this.getPublicIdentities()` method of the session defined by the notepad application*

<details>
<summary><strong>Click here to see the solution</strong></summary>

```diff
  async share(recipients: string[]) {
-   this.resourceId = this.user.id;
    if (!this.resourceId) throw new Error("No resource id.");
+   const recipientPublicIdentities = await this.getPublicIdentities(recipients);
+   await this.tanker.share([this.resourceId], {
+     shareWithUsers: recipientPublicIdentities
+   });
    await this.serverApi.share(this.user.id, recipients);
  }
```
</details>
<br />

You can now re-try sharing notes between Alice and Bob, the "share" functionality should be working again.

### Device management

At this point, if you try to log in the same user in any other browser, or in any other device, you will not be able to decrypt any content.

That is because we did not take care of device management so far.

Please go to the implementation guides in the [documentation](https://docs.tanker.io/latest/) to find additional resources on device management.

## Conclusion

Congrats! You now have an example of a web application using end-to-end encryption, which implements secure sharing of notes.
