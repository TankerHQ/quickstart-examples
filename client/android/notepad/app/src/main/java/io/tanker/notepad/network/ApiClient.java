package io.tanker.notepad.network;

import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;

import io.tanker.notepad.BuildConfig;
import okhttp3.Response;

import static io.tanker.notepad.network.HttpClient.MEDIA_TYPE_PLAIN_TEXT;

// Singleton
public class ApiClient {
    // Private constructor: never call directly, use getInstance!
    private ApiClient() {
        mHttpClient = new HttpClient(BuildConfig.API_ROOT);
    }

    private static ApiClient instance = null;

    public static ApiClient getInstance() {
        if (instance == null) {
            instance = new ApiClient();
        }

        return instance;
    }

    private HttpClient mHttpClient;

    public void logout() throws IOException {
        mHttpClient.getSync("/logout");
        mHttpClient.clearCookies();
    }

    public Response login(String email, String password) throws IOException, JSONException {
        JSONObject data = new JSONObject();
        data.put("email", email);
        data.put("password", password);
        return mHttpClient.postSync("/login", data.toString());
    }

    public Response signup(String email, String password) throws IOException, JSONException {
        JSONObject data = new JSONObject();
        data.put("email", email);
        data.put("password", password);
        return mHttpClient.postSync("/signup", data.toString());
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

    public Response updateEmail(String newEmail) throws IOException, JSONException {
        JSONObject data = new JSONObject();
        data.put("email", newEmail);
        return mHttpClient.putSync("/me/email", data.toString());
    }

    public Response updatePassword(String oldPassword, String newPassword) throws IOException, JSONException {
        JSONObject data = new JSONObject();
        data.put("oldPassword", oldPassword);
        data.put("newPassword", newPassword);
        return mHttpClient.putSync("/me/password", data.toString());
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

    public Response share(String from, String to) throws IOException, JSONException {
        JSONArray recipients = new JSONArray();
        recipients.put(to);

        JSONObject data = new JSONObject();
        data.put("from", from);
        data.put("to", recipients);

        return mHttpClient.postSync("/share", data.toString());
    }
}
