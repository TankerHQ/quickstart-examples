package io.tanker.notepad;

import android.text.TextUtils;
import android.util.Patterns;

public class Utils {
    public static boolean isEmailValid(String email) {
        return (!TextUtils.isEmpty(email) && Patterns.EMAIL_ADDRESS.matcher(email).matches());
    }

    public static boolean isPasswordValid(String password) {
        //TODO: Replace this with your own logic
        return true;
    }
}
