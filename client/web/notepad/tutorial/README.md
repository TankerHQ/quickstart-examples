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

1. Signup with any e-mail and password you want.
    Remember your password, because the server does not implement a "Forgot my password" feature.

2. Right after sign up, you are asked to save a mysterious "unlock key". Just skip this step for now, we'll explain this later.

3. Type some text in the notepad's input and save it.

4. Have a look in the `server/data/` directory. You will see a strange directory name with a json file in it.

    Opening it, you'll see that the text saved in the previous step is stored in plain text.

    If someone were to attack the server, he would have access to all the notes of all the users!

5. Let's fix this!


## Step by step tutorial

Right now, we are going to make sure the data is stored encrypted on the server, while still allowing users transparent access to their resources.

As explained above, the server already contains the required modifications.

Since the tanker SDK implements end-to-end encryption, most cryptographic operations will happen client-side, so in this tutorial we will only have to change code in the `./client/web/tutorial/src/Session.js` file.

We've marked the places we are going to modify with these place holder comments:

```javascript
// [[
// FIXME
     <- code to change lies here
// ]]
```

### Handling a Tanker session

In the `./client/web/tutorial/src/Session.js` file, let's use the `trustchainId` found in the config file to initialize a new Tanker instance:

```javascript
constructor() {
  ...
- // [[
- // FIXME: create a new tanker object with the trustchainId
- // this.tanker = ...;
- // ]]
+  this.tanker = new Tanker({ trustchainId });
  ...
}
```

Note that `this.opened` is just a placeholder attribute that materializes where Tanker session opening and closing will occur.

Let's handle the creation of a Tanker session, with the help of the [`tanker.open()`](https://www.tanker.io/docs/latest/guide/open/#opening_the_session_client-side) method.

We need to handle two cases here. Either the user just created an account, or he just logged in.

In both cases, the server should have sent a user token, and we can call `open()` right away.

Note that we use `await` because opening a Tanker session is not instantaneous, and we do not want to block the application while Tanker is opening.

```javascript
async create(userId: string, password: string): Promise<void> {
  // ...
  const userToken = await response.text

  // Open Tanker session with userId and userToken
- this.opened = true;
- await true;
+ return this.tanker.open(userId, userToken);
}

async login(userId: string, password: string): Promise<void> {
  // ...
- this.opened = true;
- await true
+ const userToken = await response.text();
+ await this.tanker.open(userId, userToken);
}
```

<!--FIXME: explain trustchain concept here -->

Note that `open()` will use the user token to:

* register the user in the trustchain if necessary,
* register the device in the trustchain if necessary,
* fetch access keys to all the resource.

With this in place we can get rid of the `opened` attribute and fix the `isOpen()` and `close()` methods:

```javascript
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

You can check this by refreshing your browser, and log in. You should see the text you wrote in the previous step.

### Encrypting data

To encrypt the data, we use [`tanker.encrypt()`](https://www.tanker.io/docs/latest/guide/encryption#encrypting):

```javascript
async saveText(content: string): Promise<void> {
  // use tanker to encrypt the text as binary data, then
  // encode the data and send it to the server
  - const data = content;
  - this.api.push(data);
  + const encryptedData = await this.tanker.encrypt(content);
  + this.api.push(toBase64(encryptedData));
}
```

The `encrypt()` method takes a string as parameter and returns some binary data. Our server used to accept the contents of the notes as strings, that's why we use `toBase64()` here.

At this point, return to the application in your browser and save again some content in the input. It should be already encrypted when pushed to the server.

### Decrypting data

To decrypt the data, we use the same steps, but in reverse order using the [`tanker.decrypt()`](https://www.tanker.io/docs/latest/guide/encryption/#decrypting) method:

```javascript
async loadText(): Promise<string> {
  const data = await this.api.get();
  // ...
  // use fromBase64 to get binary data from the
  // response of the server and use tanker to decrypt it.
- return data;
+ return this.tanker.decrypt(fromBase64(data));
```

Now the users can still load and save their notes, but now the contents are encrypted on the server. Feel free to take look at the `.json` files in the `./server/data/` directory to make sure.

### Device management

At this point, if you try to log in the same user in an other browser in private mode, or in any other device, you get an error message about a missing event handler.

That is because we did not take care of device management so far. Let's do that now.

First, we connect the `waitingForValidation` event of the Tanker and emit the `newDevice` event when required:

``` javascript
async login(userId: string, password: string): Promise<void> {
  this.api.setUserInfo(userId, password);
+ this.tanker.on('waitingForValidation', () => this.emit('newDevice'));
  // ...
}
```

That way, when the user needs to perform manual operations about its device, the UI will be notified.

(The `newDevice` event is handled in the other React components of the application).

Then we implement the `getUnlockKey()` and `addCurrentDevice()` device methods in `./client/web/tutorial/src/Session.js`:

```javascript
async getUnlockKey(): Promise<string> {
- return 'this is the unlock key';
- return this.tanker.generateAndRegisterUnlockKey();
}

async addCurrentDevice(unlockKey: string): Promise<void> {
- await true;
+ return this.tanker.unlockCurrentDevice(unlockKey);
}
```

So instead of display 'this in the unlock key' to the user, we actually ask Tanker to generate one.

Then, when the user needs the unlock a new device, the web application will end up calling `tanker.unlockCurrentDevice()`.

You can now check that device management is indeed working by following those steps:

1. sign up **with a new user** in the application (the previously created user cannot be used here since the unlock key feature wasn't implemented at the time of their creation),
2. copy the user's unlock key and save it somewhere,
3. fill the input with some content and click on the save button,
4. keep your browser tab open.

You've just created a new user and some content associated, except this time you save the user's unlock key.

Now, you'll use your browser **in private browsing mode** to emulate a new device:

1. open a new tab **in private browsing mode** in your browsern
2. you should now be redirected to a page where you can enter the unlock key you saved in the previous sequence,
3. upon entering the unlock key, the new tab in private browsing mode should contain the same content that was saved in the first regular tab,
4. you can then change the content on the second device (tab in private browsing mode), click save, go back to the first device (regular tab), and load the new content.


## Conclusion

Congrats! You now have an example of a web application using end-to-end encryption.
