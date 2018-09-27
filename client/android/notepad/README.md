# Notepad Android example application

## Getting started

Open with Android Studio, build and run as usual.

Be careful to only use `x86_64` Android emulators as Tanker does **not** support `x86` ones.

## Using a reset password link on an Android Simulator

When using an Android Simulator, you can simulate a user clicking on a reset link received by e-mail (which will lauch the notepad application).

To do this, ensure `adb` is available in your PATH, and run the following command passing the URL you received:

```bash
adb shell am start \
        -W -a android.intent.action.VIEW \
        -d "http://127.0.0.1:3000/confirm-password-reset#apptoken:tankertoken" io.tanker.notepad
```
