# Notepad application tutorial

In this tutorial we will demonstrate how to use the Tanker SDK inside an existing React JavaScript application.

Knowledge about UI frameworks such as react is not required. However, the functions and methods  of the Tanker API are asynchronous, so to take out the most of this tutorial you should know about [async functions](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Instructions/async_function).


## Environment set up

Please check that [the server is started](../../../README.md) as this example application will rely on it.


## The application

### Description

The Web application is a simple notepad written in React.

Each user has access to exactly one note.

It implements the following features:

* Signing up
* Login
* Loading and saving the contents of the notes

Here is the user experience flow:

1. A user signs up and creates an account with an ID and password
2. He logs in
3. He is redirected to an edit form where he can type text, and save the contents by sending them to a remote server.

The server handles signing up of the users by hashing their passwords, and can also store the user notes. The server is also able to send [user tokens](https://www.tanker.io/docs/latest/guide/server/#user_token) to authenticated users.

### Run

To start the application, run in a new terminal:

```bash
yarn start:web:tutorial
```

The application should open in a new browser tab. If not, go to http://localhost:3000/ manually.

### Start using the application

Now that the application is up and running, please follow the steps below:

1. Sign up with the user name `alice` and the password `p4ssw0rd`. (Actually, you can use any user name and password, but if you choose to use other authentication values, please note that the server does not implement a "Forgot my password" feature ...)

2. Type some text in the notepad's input and save it.

3. Open a new tab and sign up a new user (for instance `bob` with the password `letmein`).

4. Go back to the first tab, edit a new note (say `my message for Bob`) and click on the `share` button.

5. A list of users pops up. Select `bob` and click on `share`.

6. Go back to the second tab, click on the `Refresh` button next to the `Shared with me` panel in the home page.

7. You should see a `From alice` entry in the list. Click on it.

8. The text `my message from Bob` should be displayed.

OK, so far we have demonstrated how users can edit and share notes.


If you have a look at the `server/data/` directory, you will see a directory named after the TrustChain ID with a couple of json files in it.

This represents the data the notepad server knows about.

You can see that the contents of the notes we just created are stored in plain text.


If someone were to attack the server, he would have access to all the notes of all the users!

Let's try and fix this!

Data will be encrypted and decrypted client-side, and the notepad server will only see encrypted data.


## Step by step tutorial

Right now, we are going to make sure the data is stored encrypted on the server, while still allowing users transparent access to their resources.

As explained above, the server already contains the required modifications.

Since the tanker SDK implements end-to-end encryption, most cryptographic operations will happen client-side, so in this tutorial we will only have to change code in the `./client/web/tutorial/src/Session.js` file.


### Handling a Tanker session

In the `./client/web/tutorial/src/Session.js` file, we've already extracted the `trustchainId` from the config file:
```javascript
import { trustchainId } from './config';
```

Use it to initialize a new Tanker instance:

```diff
constructor() {
  this.opened = false;
+ this.tanker = new Tanker({ trustchainId });
  ...
}
```

Note that `this.opened` is just a placeholder attribute that materializes where Tanker session opening and closing will occur.

Let's handle the creation of a Tanker session, with the help of the [`tanker.open()`](https://www.tanker.io/docs/latest/guide/open/#opening_the_session_client-side) method.

We need to handle two cases here. Either the user just created an account, or he just logged in.

In both cases, the server should have sent a user token, and we can call `open()` right away.

Note that we use `await` because opening a Tanker session is not instantaneous, and we do not want to block the application while Tanker is opening.

```diff
async openSession(userId: string, password: string): Promise<void> {
  // ...
  const userToken = await response.text();

  // Open Tanker session with userId and userToken
- this.opened = true;
+ await this.tanker.open(userId, userToken);
+ console.log("Tanker session is now ready");
}

```

<!--FIXME: explain TrustChain concept here -->

Note that `open()` will use the user token to:

* register the user in the TrustChain if necessary,
* register the device in the TrustChain if necessary,
* fetch access keys to all the resource.

With this in place we can get rid of the `opened` attribute and fix the `isOpen()` and `close()` methods:

```diff
constructor() {
  // ...
- this.opened = false;
}

isOpen(): bool {
  // Check Tanker status
- return this.opened;
+ return this.tanker.status === this.tanker.OPEN;
}

async close(): Promise<void> {
- this.opened = false;
+ await this.tanker.close();
}
```

The `close()` method will be called when the user logs out. It's important to close the Tanker session too at this moment to make sure the encrypted data is safe at rest.

At this point, nothing has changed in the application, we just made sure we could open and close a Tanker section correctly.

You can check this by refreshing your browser, and log in. You should see the text you wrote in the previous step, and in the console log, the "Tanker session is ready" you've just added.

### Encrypting data

To encrypt the data, we use [`tanker.encrypt()`](https://www.tanker.io/docs/latest/guide/encryption#encrypting):

```diff
async saveText(text: string): Promise<void> {
  const recipients = await this.getNoteRecipients();

  // use tanker to encrypt the text as binary data, then
  // encode the data and send it to the server
- await this.serverApi.push(text);
+ const encryptedData = await this.tanker.encrypt(text);
+ const encryptedText = toBase64(encryptedData);
+ this.serverApi.push(encryptedText);
}
```

The `encrypt()` method takes a string as parameter and returns some binary data. Our server used to accept the contents of the notes as strings, that's why we use `toBase64()` here.

### Decrypting data

To decrypt the data, we use the same steps, but in reverse order using the [`tanker.decrypt()`](https://www.tanker.io/docs/latest/guide/encryption/#decrypting) method:

```diff
async loadTextFromUser() Promise<string> {
  const response = await this.serverApi.get(userId);

  if (response.status === 404) return "";

  - const data = await response.text();
  - return data;

  // ...
  // use fromBase64 to get binary data from the
  // response of the server and use tanker to decrypt it.
  + const encryptedText = await response.text();
  + const encryptedData = fromBase64(encryptedText);
  + return this.tanker.decrypt(encryptedData);
}
```

### Checking it works

Now the data on the server can no longer be used by the clients. So go ahead, and edit the
`.json` files on the server to remove the data stored in plain text, keeping only the user token and the hashed password.

You can then try to log in, and check that:

* you can  still edit and save a note
* the `data` field in the `json` is now encrypted

### Sharing

There is a problem, though. The "share" functionality no longer works.

If you try to repeat the steps we took to share notes between Alice and Bob, you will get an error message when Bob tries to read Alice's note.

Indeed, the keys used to encrypt and decrypt notes never left the local storage of Alice's browser.

What we need to do is exchange keys from Alice to Bob.

Note that each time we call `tanker.encrypt()` a new key is generated. This is done for security reasons.

We call each version of a note a *resource*. Each time the note changes, we must get its resource id and ask the Tanker SDK to share access to it.

They are two places we need to do this:

* In the `Session.saveText()` method, called when the user clicks on `save` on the "Edit your note" panel
* In the `Session.share()` method, called when when the users clicks on `share` in the "Share" panel.

First, when we encrypt the data (when the user clicks on `save`), we can use the `shareWith` option of `tanker.encrypt()`:

```diff
async saveText(): Promise<string> {
  const data = await this.serverApi.get();
  // ...
- const encryptedData = await this.tanker.encrypt(content);
+ const encryptedData = await this.tanker.encrypt(content, { shareWith: recipients });
}
```

Then, we can store the resource ID matching the newly generated key by using the `getResourceId` helper method:

```diff
async saveText(): Promise<string> {
  const data = await this.serverApi.get();
  // ...
+ const encryptedData = await this.tanker.encrypt(content, { shareWith: recipients });
+ this.resourceId = getResourceId(encryptedData)
```

Next, in the `share` method, we must:

* Remove the line `this.resourceId = this.userId` since notes no longer are identified by their creator,
* And call `tanker.share()` with a list containing the current `resourceId` and the list of recipients.

```diff
  async share(recipients: string[]) {
-   this.resourceId = this.userId;
    if (!this.resourceId) throw new Error("No resource id.");
+   await this.tanker.share([this.resourceId], recipients);
    await this.serverApi.share(recipients);
  }

```

You can now re-try sharing notes between Alice and Bob, the "share" functionality should be working again.

### Device management

At this point, if you try to log in the same user in an other browser in private mode, or in any other device, you get an error message about a missing event handler.

That is because we did not take care of device management so far. Let's do that now.

First, we connect the `waitingForValidation` event of the Tanker and emit the `newDevice` event when required.

We can do this in the Session constructor, right after creating the `tanker` object:

```diff

constructor() {
    // ...
    this.tanker = new Tanker({ trustchainId });
+   this.tanker.on("waitingForValidation", () => this.emit("newDevice"));
}
```

That way, when the user needs to perform manual operations about its device, the UI will be notified.

(The `newDevice` event is handled in the other React components of the application).

Then we implement the `getUnlockKey()` and `addCurrentDevice()` device methods in `./client/web/tutorial/src/Session.js`:

```diff
async getUnlockKey(): Promise<string> {
- return 'this is the unlock key';
+ return this.tanker.generateAndRegisterUnlockKey();
}

async addCurrentDevice(unlockKey: string): Promise<void> {
- await true;
+ return this.tanker.unlockCurrentDevice(unlockKey);
}
```

Thus, when the user needs to unlock a new device, the web application will end up calling `tanker.unlockCurrentDevice()`.

You can now check that device management is indeed working by following those steps:

1. Sign up **with a new user** in the application (the previously created user cannot be used here since the unlock key feature wasn't implemented at the time of their creation),
2. Copy the user's unlock key and save it somewhere,
3. Fill the input with some content and click on the save button,
4. Keep your browser tab open.

You've just created a new user and some content associated, except this time you've saved the user's unlock key.

Now, you'll launch **a different browser** to emulate a new device (technically, different browsers don't share Tanker data and behave as separate devices):

1. Open a new tab in a second different browser,
2. You should now be redirected to a page where you can enter the unlock key you saved in the previous sequence,
3. Upon entering the unlock key, the second browser should display the same content that was saved in the first browser,
4. You can then change the content on the second browser, click save, go back to the first browser, and load the new content.

Note 1: instead of a second browser, you could also have used the first browser in private browsing mode to emulate a new device. Nevertheless, the browser won't persist Tanker data over private browsing sessions, so you would have to unlock the device every time you restart such a private browsing session.


Note 2: Of course, in a more realistic application, users should not have to copy/paste a unlock key themselves. Tanker staff is working on implementing two different ways to implement the feature properly:

* First way is to use a "passphrase" (a set of 6 to 10 words) that the user can either safely note somewhere, or store in a dedicated device for instance.
* Or, store the encrypted unlock key on the Tanker servers. The user will then have to use some form of 2-Factor authentication to retrieve their unlock key.

## Conclusion

Congrats! You now have an example of a web application using end-to-end encryption, which implements secure sharing of notes.
