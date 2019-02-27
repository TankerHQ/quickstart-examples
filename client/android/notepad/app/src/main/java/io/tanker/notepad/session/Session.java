package io.tanker.notepad.session;

import android.content.Context;
import android.os.AsyncTask;
import android.util.Log;

import com.fasterxml.jackson.databind.JsonNode;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;

import io.tanker.api.Tanker;
import io.tanker.api.TankerAuthenticationMethods;
import io.tanker.api.TankerDecryptOptions;
import io.tanker.api.TankerException;
import io.tanker.api.TankerFutureException;
import io.tanker.api.TankerOptions;
import io.tanker.api.TankerShareOptions;
import io.tanker.api.TankerSignInOptions;
import io.tanker.api.TankerSignInResult;
import io.tanker.api.TankerUnlockOptions;
import io.tanker.bindings.TankerErrorCode;
import io.tanker.notepad.BuildConfig;
import io.tanker.notepad.R;
import okhttp3.Response;

// Singleton
public class Session {
    private Context mAppContext;
    private ApiClient mApiClient;

    private Tanker mTanker;
    private TankerOptionsTask mTankerOptionsTask;

    private static Session instance = null;

    public static Session getInstance(Context context) {
        if (instance == null) {
            instance = new Session(context);
        }

        return instance;
    }

    // Private constructor: never call directly, use getInstance!
    private Session(Context context) {
        mAppContext = context;
        mApiClient = new ApiClient(BuildConfig.API_ROOT);
        mTankerOptionsTask = new TankerOptionsTask();
        mTankerOptionsTask.execute();
    }

    public ApiClient getApiClient() {
        return mApiClient;
    }

    public Tanker getTanker() {
        if (mTanker == null) {
            mTanker = buildTanker();
            Tanker.setLogHandler((cat, level, message) -> {
                Log.d("Tanker", message);
            });
        }

        return mTanker;
    }

    private Tanker buildTanker() {
        try {
            TankerOptions options = mTankerOptionsTask.get();
            Tanker tanker = new Tanker(options);
            tanker.connectDeviceRevokedHandler(() -> {
                Log.w("Session", "Tanker device has been revoked");
            });

            Log.w("Session", "Tanker initialized");
            return tanker;
        } catch (Throwable throwable) {
            Log.e("Session", mAppContext.getString(R.string.tanker_init_error));
            throwable.printStackTrace();
            return null;
        }
    }

    public String getCurrentUserId() {
        return mApiClient.getCurrentUserId();
    }
    public String getCurrentUserEmail() {
        return mApiClient.getCurrentUserEmail();
    }

    public void signUp(String email, String password) throws ApiClient.AuthenticationError, IOException, JSONException, TankerFutureException {
        JSONObject user = mApiClient.signUp(email, password);

        String identity = user.getString("identity");

        tankerSignUp(identity, email, password);
    }

    private void tankerSignUp(String identity, String email, String password) throws TankerFutureException {
        TankerAuthenticationMethods authenticationMethods = new TankerAuthenticationMethods();
        authenticationMethods.setEmail(email);
        authenticationMethods.setPassword(password);

        getTanker().signUp(identity, authenticationMethods).get();
    }

    public void logIn(String email, String password) throws ApiClient.AuthenticationError, IOException, JSONException, TankerFutureException {
        JSONObject user = mApiClient.logIn(email, password);

        String identity = user.getString("identity");

        TankerSignInOptions signInOptions = new TankerSignInOptions();
        signInOptions.password = password;

        try {
            TankerSignInResult result = getTanker().signIn(identity, signInOptions).get();
            if (result == TankerSignInResult.IDENTITY_NOT_REGISTERED)
                tankerSignUp(identity, email, password);
            else if (result == TankerSignInResult.IDENTITY_VERIFICATION_NEEDED) {
                // This should never happen because we always give the password as argument.
                // If the password is wrong, signIn will throw.
                Log.wtf("Session", "Tanker verification needed, should never happen");
                mApiClient.logout();
            }
        } catch (TankerFutureException e) {
            mApiClient.logout();
            if (e.getCause() instanceof TankerException) {
                TankerException te = (TankerException)e.getCause();
                if (te.getErrorCode() == TankerErrorCode.INVALID_UNLOCK_PASSWORD)
                    throw new ApiClient.AuthenticationError("wrong password", "password");
            }
            throw e;
        }
    }

    public void changeEmail(String newEmail) throws IOException, JSONException, TankerFutureException {
        mApiClient.changeEmail(newEmail);

        TankerUnlockOptions unlockOptions = new TankerUnlockOptions();
        unlockOptions.setEmail(newEmail);

        getTanker().registerUnlock(unlockOptions).get();
    }

    public void changePassword(String oldPassword, String newPassword) throws IOException, JSONException, TankerFutureException {
        mApiClient.changePassword(oldPassword, newPassword);

        TankerUnlockOptions unlockOptions = new TankerUnlockOptions();
        unlockOptions.setPassword(newPassword);

        getTanker().registerUnlock(unlockOptions).get();
    }

    public void resetPassword(String newPassword, String passwordResetToken, String verificationCode) throws ApiClient.AuthenticationError, IOException, JSONException, TankerFutureException {
        String email = mApiClient.resetPassword(newPassword, passwordResetToken);

        {
            JSONObject user = mApiClient.logIn(email, newPassword);
            String identity = user.getString("identity");
            mApiClient.logout();

            TankerSignInOptions signInOptions = new TankerSignInOptions();
            signInOptions.verificationCode = verificationCode;
            getTanker().signIn(identity, signInOptions).get();
            getTanker().registerUnlock(new TankerUnlockOptions().setPassword(newPassword));
            getTanker().signOut();
        }

        logIn(email, newPassword);

        TankerUnlockOptions unlockOptions = new TankerUnlockOptions();
        unlockOptions.setPassword(newPassword);

        getTanker().registerUnlock(unlockOptions).get();
    }

    public void close() throws IOException, TankerFutureException {
        mApiClient.logout();
        if (mTanker != null) {
            mTanker.signOut().get();
            mTanker = null;
        }
    }

    public JsonNode getMe() throws IOException {
        return mApiClient.getMe();
    }

    public String getData(String userId) {
        TankerDecryptOptions options = new TankerDecryptOptions();

        try {
            byte[] data = mApiClient.getData(userId);
            if (data == null) {
                return null;
            }

            byte[] clearData = getTanker().decrypt(data, options).get();
            return new String(clearData, "UTF-8");
        } catch (Throwable e) {
            Log.e("Notepad", "loadDataError", e);
            return null;
        }
    }

    public class User {
        public String id;
        public String email;
        public String publicIdentity;
    }

    private User[] emailsToUsers(String[] emails) throws IOException, JSONException {
        JSONArray jusers = mApiClient.getUsers();
        User[] users = new User[emails.length];

        outer: for (int i = 0; i < emails.length; i++) {
            String email = emails[i];

            for (int j = 0; j < jusers.length(); j++) {
                JSONObject juser = jusers.getJSONObject(j);
                if (juser.has("email") && juser.getString("email").equals(email)) {
                    users[i] = new User();
                    users[i].id = juser.getString("id");
                    users[i].email = juser.getString("email");
                    users[i].publicIdentity = juser.getString("publicIdentity");
                    continue outer;
                }
            }

            throw new Error("User not found with email: " + email);
        }

        return users;
    }


    public void putData(String data, String[] recipientEmails) throws IOException, JSONException, TankerFutureException {
        boolean sharing = recipientEmails.length > 0;
        Tanker tanker = getTanker();

        byte[] clearData = data.getBytes();
        byte[] encryptedData = tanker.encrypt(clearData, null).get();

        mApiClient.putData(encryptedData);

        if (sharing) {
            String resourceId = tanker.getResourceID(encryptedData);
            String[] resourceIds = new String[]{resourceId};

            User[] recipientUsers = emailsToUsers(recipientEmails);
            String[] recipientIdentities = new String[recipientUsers.length];
            String[] recipientUserIds = new String[recipientUsers.length];
            for (int i = 0; i < recipientUsers.length; ++i) {
                recipientIdentities[i] = recipientUsers[i].publicIdentity;
                recipientUserIds[i] = recipientUsers[i].id;
            }

            TankerShareOptions shareOptions = new TankerShareOptions();
            shareOptions.shareWithUsers(recipientIdentities);

            tanker.share(resourceIds, shareOptions).get();

            Response res = mApiClient.share(recipientUserIds);
            if (!res.isSuccessful()) {
                throw new Error(res.message());
            }
        }
    }

    public class TankerOptionsTask extends AsyncTask<String, Void, TankerOptions> {
        @Override
        protected TankerOptions doInBackground(String... params) {
            TankerOptions options = new TankerOptions();

            String writablePath = mAppContext.getFilesDir().getAbsolutePath();
            options.setWritablePath(writablePath);

            try {
                JSONObject tankerConfig = mApiClient.getConfig();

                String trustchainId = tankerConfig.getString("trustchainId");
                options.setTrustchainId(trustchainId);

                if (tankerConfig.has("url")) {
                    String url = tankerConfig.getString("url");
                    options.setTrustchainUrl(url);
                }
            } catch (Throwable throwable) {
                Log.e("Session", mAppContext.getString(R.string.no_trustchain_config));
                throwable.printStackTrace();
                return null;
            }

            return options;
        }
    }
}
