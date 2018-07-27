package io.tanker.notepad;

import android.app.Application;
import android.net.Uri;

import java.net.MalformedURLException;
import java.net.URL;

import io.tanker.api.Tanker;

public class TheTankerApplication extends Application {
    private Tanker mTanker;
    private String mEmail;
    private String mPassword;
    private String mUserId;
    private String mServer = "http://10.0.2.2:8080";

    public Tanker getTankerInstance() {
        return mTanker;
    }

    public void setTankerInstance(Tanker tanker) {
        mTanker = tanker;
    }

    public void setEmail(String email) {
        mEmail = email;
    }

    public String getEmail() {
        return mEmail;
    }

    public void setPassword(String password) {
        mPassword = password;
    }

    public String getPassword() {
        return mPassword;
    }

    public void setUserId(String userId) {
        mUserId = userId;
    }

    public String getUserId() {
        return mUserId;
    }

    public URL makeURL(String endpoint, String email, String password) throws MalformedURLException {
        String url = Uri.parse(mServer + endpoint)
                .buildUpon()
                .appendQueryParameter("email", email)
                .appendQueryParameter("password", password)
                .build().toString();
        return new URL(url);
    }

    public URL makeURL(String endpoint) throws MalformedURLException {
        if (mEmail != null && mPassword != null)
            return makeURL(endpoint, mEmail, mPassword);
        else
            return new URL(Uri.parse(mServer + endpoint).buildUpon().build().toString());
    }
}