package io.tanker.notepad.session;

import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;

import io.tanker.notepad.network.HttpClient;
import okhttp3.Response;

import static io.tanker.notepad.network.HttpClient.MEDIA_TYPE_PLAIN_TEXT;

public class ApiClient {
    public ApiClient(String root) {
        mHttpClient = new HttpClient(root);
    }

    private HttpClient mHttpClient;
    private String mCurrentUserId;
    private String mCurrentUserEmail;

    public String getCurrentUserId() {
        return mCurrentUserId;
    }
    public String getCurrentUserEmail() {
        return mCurrentUserEmail;
    }

    public class AuthenticationError extends Exception {
        public String mField;

        public AuthenticationError(String message, String field) {
            super(message);
            mField = field;
        }
    }

    public JSONObject authenticate(String path, String email, String password) throws AuthenticationError, IOException, JSONException {
        JSONObject data = new JSONObject();
        data.put("email", email);
        data.put("password", password);
        Response res = mHttpClient.postSync(path, data.toString());

        if (!res.isSuccessful()) {
            String message = "Unknown error";
            String field = "unknown";

            switch (res.code()) {
                case 409:
                    message = "Email already registered";
                    field = "email";
                    break;
                case 401:
                    message = "Wrong password";
                    field = "password";
                    break;
                case 404:
                    message = "Email not registered";
                    field = "email";
                    break;
                case 503:
                    message = "Could not contact the server, please try again later";
                    break;
            }

            throw new AuthenticationError(message, field);
        }

        JSONObject body = new JSONObject(res.body().string());
        mCurrentUserId = body.getString("id");
        mCurrentUserEmail = email;

        return body;
    }

    public JSONObject logIn(String email, String password) throws AuthenticationError, IOException, JSONException {
        return authenticate("/login", email, password);
    }

    public JSONObject signUp(String email, String password) throws AuthenticationError, IOException, JSONException {
        return authenticate("/signup", email, password);
    }

    public void logout() throws IOException {
        mHttpClient.getSync("/logout");
        mHttpClient.clearCookies();
        mCurrentUserId = null;
        mCurrentUserEmail = null;
    }

    public Response getMe() throws IOException {
        return mHttpClient.getSync("/me");
    }

    public JSONObject getConfig() throws IOException, JSONException {
        Response res = mHttpClient.getSync("/config");
        if (!res.isSuccessful()) {
            throw new Error("Couldn't get the Tanker config, did you start the server?");
        }
        return new JSONObject(res.body().string());
    }

    public void changeEmail(String newEmail) throws IOException, JSONException {
        JSONObject data = new JSONObject();
        data.put("email", newEmail);
        Response res = mHttpClient.putSync("/me/email", data.toString());

        if (res.isSuccessful()) {
            mCurrentUserEmail = newEmail;
        } else {
            String message = "Failed to change email address";
            if (res.code() == 409) {
                message = "Email address not available";
            }
            throw new Error(message);
        }
    }

    public void changePassword(String oldPassword, String newPassword) throws IOException, JSONException {
        JSONObject data = new JSONObject();
        data.put("oldPassword", oldPassword);
        data.put("newPassword", newPassword);
        Response res = mHttpClient.putSync("/me/password", data.toString());

        if (!res.isSuccessful()) {
            String message = "Failed to change password";
            throw new Error(message);
        }
    }

    public String getUserIdFromEmail(String email) throws IOException, JSONException {
        Response res = mHttpClient.getSync("/users");
        JSONArray users = new JSONArray(res.body().string());

        for (int i = 0; i < users.length(); i++) {
            JSONObject user = users.getJSONObject(i);
            if (user.has("email") && user.getString("email").equals(email)) {
                return user.getString("id");
            }
        }
        return null;
    }

    public void requestResetPassword(String email) throws IOException, JSONException {
        JSONObject data = new JSONObject();
        data.put("email", email);
        Response res = mHttpClient.postSync("/requestResetPassword", data.toString());
        if (!res.isSuccessful()) {
            throw new Error(res.body().string());
        }
    }

    public String resetPassword(String newPassword, String passwordResetToken) throws IOException, JSONException {
        JSONObject data = new JSONObject();
        data.put("newPassword", newPassword);
        data.put("passwordResetToken", passwordResetToken);

        Response res = mHttpClient.postSync("/resetPassword", data.toString());
        if (!res.isSuccessful()) {
            throw new Error(res.body().string());
        }

        JSONObject body = new JSONObject(res.body().string());
        return body.getString("email");
    }

    public byte[] getData(String userId) throws IOException {
        Response res = mHttpClient.getSync("/data/" + userId);
        if (!res.isSuccessful()) {
            throw new Error(res.message());
        }

        String content = res.body().string();
        if (content == null) {
            return null;
        }

        return Base64.decode(content, Base64.DEFAULT);
    }

    public void putData(byte[] encryptedData) throws IOException {
        String base64 = Base64.encodeToString(encryptedData, Base64.NO_WRAP);
        Response res = mHttpClient.putSync("/data", base64, MEDIA_TYPE_PLAIN_TEXT);
        if (!res.isSuccessful()) {
            throw new Error(res.message());
        }
    }

    public Response share(String to) throws IOException, JSONException {
        JSONArray recipients = new JSONArray();
        recipients.put(to);

        JSONObject data = new JSONObject();
        data.put("from", mCurrentUserId);
        data.put("to", recipients);

        return mHttpClient.postSync("/share", data.toString());
    }
}
