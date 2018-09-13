# Notepad application tutorial

In this tutorial we will demonstrate how to use the Tanker SDK inside an existing React JavaScript application.

Your mission, should you decide to accept it, is to follow the instructions below in order to implement end-to-end encryption.

Knowledge about UI frameworks such as React is not required. However, the functions and methods of the Tanker API are asynchronous, so to take out the most of this tutorial you should know about [async functions](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Instructions/async_function).

You are going to actually write some code there, so before you start please familiarize yourself the [api documentation](https://tanker.io/docs/latest/api/tanker/?language=javascript).

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

The server handles user signup by hashing their password, and can also store the user's note. The server is also able to send their [Tanker credentials](https://tanker.io/docs/latest/guide/server/?language=javascript#tanker_users) (ID and Token) to authenticated users.

### Run

To start the application, run in a new terminal:

```bash
yarn start:web:tutorial
```

The application should open in a new browser tab. If not, go to http://localhost:3000/ manually.

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

The goal here is to [open and close a tanker session](https://tanker.io/docs/latest/guide/open/?language=javascript).

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

Now we need to handle the creation of a Tanker session, with the help of the [`tanker.open()`](https://www.tanker.io/docs/latest/api/tanker/?language=javascript#open) method.

There are 3 cases here:

* the user just signed up
* the user just logged in
* the user is already logged in on page load (e.g. browser refresh)

In all cases, there's already code in place to retrieve Tanker credentials (user ID and Token) from the server, and we can call `tanker.open()` right away.

*Replace the 3 occurrences of the `// FIXME: open a tanker session` comment by an appropriate call to `this.tanker.open()`.*
<details>
<summary><strong>Click here to see the solution</strong></summary>

```diff
async init() {
  // ...
  const user = await this.serverApi.getMe();
+ await this.tanker.open(user.id, user.token);
  this.status = "open";
  // ...
}

async signUp(email, password) {
  // ...
  const user = await response.json();
+ await this.tanker.open(user.id, user.token);
  this.status = "open";
}

async logIn(email, password) {
  // ...
  const user = await response.json();
+ await this.tanker.open(user.id, user.token);
  this.status = "open";
}
```

Note that we use `await` because opening a Tanker session is not instantaneous, and we do not want to block the application while Tanker is opening.
</details>
<br />

Note that `open()` will use the user token to:

* register the user in the TrustChain if necessary,
* register the device in the TrustChain if necessary,
* fetch encryption keys to access all the resources.

Then you should *close the Tanker session in the `Session.close()` method by using the [`tanker.close()`](https://www.tanker.io/docs/latest/api/tanker/?language=javascript#close) method*.

<details>
<summary><strong>Click here to see the solution</strong></summary>

```diff
async close(): Promise<void> {
  await this.serverApi.logout();
+ await this.tanker.close();
  this.status = "closed";
}
```
</details>
<br />

The `close()` method will be called when the user logs out. It's important to close the Tanker session too at this moment to make sure the encrypted data is safe at rest.

At this point, nothing has changed in the application, we just made sure we could respectively open and close a Tanker session correctly when authenticating and logging out.

Now that we know how to open a Tanker session, let's use it to [encrypt, decrypt and share](https://www.tanker.io/docs/latest/guide/encryption/?language=javascript) the notes!

### Encrypting data

To encrypt data, *use [`tanker.encrypt()`](https://www.tanker.io/docs/latest/api/tanker/?language=javascript#encrypt) in `Session.saveText()`*.

Don't forget to use [`toBase64()`](https://tanker.io/docs/latest/api/utilities/?language=javascript#base64_to_buffer) to convert the binary encrypted data into text before sending it to the server.


<details>
<summary><strong>Click here to see the solution</strong></summary>

```diff
async saveText(text: string) {
  const recipients = await this.getNoteRecipients();
  const recipientIds = recipients.map(user => user.id);

  // use tanker to encrypt the text as binary data, then
  // encode the data and send it to the server
- await this.serverApi.push(text);
+ const encryptedData = await this.tanker.encrypt(text);
+ const encryptedText = toBase64(encryptedData);
+ await this.serverApi.push(encryptedText);
}
```
</details>
<br />

### Decrypting data

To decrypt data, *use [`tanker.decrypt()`](https://www.tanker.io/docs/latest/api/tanker/?language=javascript#decrypt) in `Session.loadTextFromUser()`*.

Don't forget to use [`fromBase64()`](https://tanker.io/docs/latest/api/utilities/?language=javascript#base64_to_buffer) to convert the encrypted text received from the server into binary.


<details>
<summary><strong>Click here to see the solution</strong></summary>

```diff
async loadTextFromUser(userId: string) {
  const response = await this.serverApi.get(userId);

  if (response.status === 404) return "";

- const data = await response.text();
- return data;

  // use fromBase64 to get binary data from the response
  // of the server and use tanker to decrypt it.
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

If you get a `Tanker error: invalid_encryption_format` message, you probably forgot to clean up plain text data as requested at the beginning of this section.

### Sharing

There is a problem, though. The "share" functionality no longer works.

If you try to repeat the steps we took to share notes between Alice and Bob, you will get an error message when Bob tries to read Alice's note.

Indeed, the keys used to encrypt and decrypt notes never left the local storage of Alice's browser.

What we need to do is exchange keys from Alice to Bob.

Note that each time we call `tanker.encrypt()` a new encryption key is generated. This transparent key rotation mechanism helps achieving a higher level of security.

We call each version of a note a *resource*. Each time the note changes, we must get its resource ID and ask the Tanker SDK to share access to it.

They are two places we need to do this:

* In the `Session.saveText()` method, called when the user clicks on `save` on the "Edit my note" panel
* In the `Session.share()` method, called when when the users clicks on `share` in the "Share" panel.

Please read the [section about sharing in the documentation](https://tanker.io/docs/latest/guide/encryption/?language=javascript#sharing) first.

Then, *use the `shareWith` option of `tanker.encrypt()` in `Session.saveText()`*.

Also make sure to *get the resource ID matching the newly generated key by using the [`tanker.getResourceId()`](https://tanker.io/docs/latest/api/tanker/?language=javascript#getresourceid) method and update the `Session.resourceId` class member*


<details>
<summary><strong>Click here to see the solution</strong></summary>

```diff
async saveText(text: string) {
  const recipients = await this.getNoteRecipients();
  const recipientIds = recipients.map(user => user.id);
- const encryptedData = await this.tanker.encrypt(text);
+ const encryptedData = await this.tanker.encrypt(text, { shareWith: recipientIds });
  const encryptedText = toBase64(encryptedData);
+ this.resourceId = this.tanker.getResourceId(encryptedData);
  await this.serverApi.push(toBase64(encryptedText));
```
</details>
<br />

Next, in the `share` method:

* *Remove the line `this.resourceId = this.userId` since notes no longer are identified by their creator*.
* *Call [`tanker.share()`](https://tanker.io/docs/latest/api/tanker/?language=javascript#share) with a list containing the current `resourceId` and the list of recipients*.

<details>
<summary><strong>Click here to see the solution</strong></summary>

```diff
  async share(recipients: string[]) {
-   this.resourceId = this.userId;
    if (!this.resourceId) throw new Error("No resource id.");
+   await this.tanker.share([this.resourceId], recipients);
    await this.serverApi.share(this.userId, recipients);
  }
```
</details>
<br />

You can now re-try sharing notes between Alice and Bob, the "share" functionality should be working again.

### Device management

At this point, if you try to log in the same user in any other browser, or in any other device, you will get an error message about a missing event handler.

That is because we did not take care of device management so far.

You should now go read the [unlocking devices](https://tanker.io/docs/latest/guide/unlocking-devices/?language=javascript) section of the guide.

For the sake of simplicity, we will implement a password-only unlock mechanism in this tutorial.

Note that this is not [the recommended option](https://tanker.io/docs/latest/guide/unlocking-devices/?language=javascript#why_we_dont_recommend_a_password-only_unlock_mechanism) and an unlock email address should be added to handle cases where a user no longer remembers their password. However it would require to set up email templates and email delegation, which are beyond the scope of this tutorial.

That said, let's get back to coding.

*At the end of the `Session.initTanker()` method, make sure to handle the `"unlockRequired"` event by registering an event handler with the `tanker.on()` method.*

*Just set the `Session.status` property to `"openingNewDevice"` so that the notepad interface can react appropriately.*

<details>
<summary><strong>Click here to see the solution</strong></summary>

```diff
async initTanker() {
  // ...
  this.tanker = new Tanker(config);
+ this.tanker.on("unlockRequired", () => {
+   this.status = "openingNewDevice";
+ });
}
```
</details>
<br />

That way, when the user needs to perform manual operations about its device, the UI will be notified.

(The `openingNewDevice` status is shared with other UI components of the application).

Then *fill the code inside the `Session.unlockCurrentDevice()` method using [`tanker.unlockCurrentDevice()`](https://tanker.io/docs/latest/api/tanker/?language=javascript#unlockcurrentdevice)*.

<details>
<summary><strong>Click here to see the solution</strong></summary>

```diff
async unlockCurrentDevice(password) {
+ await this.tanker.unlockCurrentDevice({ password });
}
```
</details>
<br />

Thus, when the user needs to unlock a new device, the web application will end up calling `tanker.unlockCurrentDevice()`.

Finally, we need to set up the password used to unlock new devices. For the sake of simplicity, we will reuse the password defined at signup in this tutorial.

At the end of the `Session.signUp()` method, *use the [`tanker.setupUnlock()`](https://tanker.io/docs/latest/api/tanker/?language=javascript#setupunlock) method to register the password given at user sign up*.

<details>
<summary><strong>Click here to see the solution</strong></summary>

```diff
async signUp(email, password) {
  // ...
  await this.tanker.open(user.id, user.token);
+ await this.tanker.setupUnlock({ password });
}
```
</details>
<br />

You can now check that device management is indeed working by following those steps:

1. Sign up **with a new user** in the application (the previously created user cannot be used here since the unlock key feature wasn't implemented at the time of their creation),
1. Fill the input with some content and click on the save button.

You've just created a new user and some content associated, except this time you've set up a password to unlock other devices.

Now, you'll launch **a different browser** to emulate another device (technically, different browsers don't share Tanker data and behave as separate devices):

1. Open a new tab in a second different browser,
1. You should be prompted the password to unlock your new device,
1. Upon entering the password, the second browser should display the same content that was saved in the first browser,
1. You can then change the content on the second browser, click save, go back to the first browser, and load the new content.

*Finally, you can also replace all remaining `// FIXME: update the unlock password` comments by calls to `tanker.updateUnlock()` to keep the password in sync between Tanker and the Notepad application.*

<details>
<summary><strong>Click here to see the solution</strong></summary>

```diff
  async changePassword(oldPassword, newPassword) {
    await this.serverApi.changePassword(oldPassword, newPassword);
+   await this.tanker.updateUnlock({ password: newPassword });
  }

  async resetPassword(newPassword, passwordResetToken, verificationCode) {
    // ...
    await this.logIn(email, newPassword);
+   await this.tanker.updateUnlock({ password: newPassword });
  }
```
</details>
<br />

Notes:

* Using Tanker in private browsing mode is currently not working in most browsers.

* Of course, in applications with strong security needs, you should ask your users to set up a password different from the one used in authentication to unlock devices. The authentication scheme becomes a 2-Factor one, where the password to unlock devices is the second factor.

* Tanker staff is currently working on alternative second factors to achieve device unlocking:
    * By registering a phone number to which the verification code could be sent,
    * By generating a "passphrase" (a set of 6 to 10 words) that power users can either safely note somewhere, or store in a dedicated device for instance.

## Conclusion

Congrats! You now have an example of a web application using end-to-end encryption, which implements secure sharing of notes.
