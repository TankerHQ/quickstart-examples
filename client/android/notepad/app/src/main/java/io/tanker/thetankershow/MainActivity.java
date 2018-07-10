package io.tanker.thetankershow;

import android.content.Intent;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.util.Base64;
import android.util.Log;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.Toast;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;

import io.tanker.api.Tanker;
import io.tanker.api.TankerDecryptOptions;
import io.tanker.api.TankerEncryptOptions;

public class MainActivity extends AppCompatActivity {
    private String resourceId = null;
    private ArrayList<String> receivedNoteAuthors = new ArrayList<>();
    private ArrayList<String> receivedNoteContents = new ArrayList<>();

    private void logout() {
        Tanker tanker = ((TheTankerApplication) getApplication()).getTankerInstance();
        tanker.close().then((closeFuture) -> {
            runOnUiThread(() -> {
                // Redirect to the Login activity
                Intent intent = new Intent(MainActivity.this, LoginActivity.class);
                startActivity(intent);
            });

            return null;
        });
    }

    private void showToast(String message) {
        runOnUiThread(() -> {
            Toast.makeText(this, message,
                    Toast.LENGTH_LONG).show();
        });
    }

    private URL makeURL(String endpoint) throws MalformedURLException {
        String address  = ((TheTankerApplication) getApplication()).getServerAddress();
        String userId = getIntent().getStringExtra("EXTRA_USERID");
        String password = getIntent().getStringExtra("EXTRA_PASSWORD");

        return new URL(address + endpoint + "?userId=" + userId + "&password=" + password);
    }

    private URL getNoteUrl(String friendId) throws Throwable {
        if (friendId == null)
            friendId = getIntent().getStringExtra("EXTRA_USERID");
        return makeURL("data/"+friendId);
    }

    private URL putNoteUrl() throws Throwable {
        return makeURL("data/");
    }

    private URL shareNoteUrl() throws Throwable {
        return makeURL("share/");
    }

    private URL getMeUrl() throws Throwable {
        return makeURL("me/");
    }

    private void uploadToServer(byte[] encryptedData) throws Throwable{
        URL url = putNoteUrl();
        HttpURLConnection connection = (HttpURLConnection)url.openConnection();
        connection.setRequestProperty("Content-Type", "text/plain; charset=utf-8");
        connection.setRequestMethod("PUT");
        connection.setDoOutput(true);

        String base64 = Base64.encodeToString(encryptedData, Base64.NO_WRAP);
        Log.i("TheTankerShow", base64);
        connection.getOutputStream().write( base64.getBytes() );
        connection.getInputStream();
    }

    private byte[] dataFromServer(String userId) throws Throwable {
        URL url = getNoteUrl(userId);
        HttpURLConnection connection = (HttpURLConnection)url.openConnection();
        connection.setRequestMethod("GET");
        connection.connect();

        BufferedReader in = new BufferedReader(
                new InputStreamReader(
                        connection.getInputStream()));
        String content = in.readLine();

        if(content == null) {
            return null;
        }
        return Base64.decode(content, Base64.DEFAULT);
    }

    private void loadSharedWithMe() throws Throwable {
        URL url = getMeUrl();
        HttpURLConnection connection = (HttpURLConnection)url.openConnection();
        connection.setRequestMethod("GET");
        connection.connect();

        BufferedReader in = new BufferedReader(
                new InputStreamReader(
                        connection.getInputStream()));
        String data = in.readLine();

        ObjectMapper jsonMapper = new ObjectMapper();
        JsonNode json = jsonMapper.readTree(data);
        if (json.has("accessibleNotes")) {
            JsonNode notes = json.get("accessibleNotes");
            for (final JsonNode note : notes) {
                String author = note.asText();
                receivedNoteAuthors.add(author);
                receivedNoteContents.add(loadDataFromUser(author));
            }


            runOnUiThread(() -> {
                ListView notesList = findViewById(R.id.notes_list);
                notesList.setAdapter(new NoteListAdapter(this, R.layout.notes_list_item, receivedNoteAuthors, receivedNoteContents));
                for (String note : receivedNoteContents) {
                    //noinspection unchecked (this is fine)
                    ((ArrayAdapter<String>)notesList.getAdapter()).add(note);
                }
            });
        }
    }

    private String loadDataFromUser(String userId) {
        TankerDecryptOptions options = new TankerDecryptOptions();

        try {
            byte[] data = dataFromServer(userId);
            if(data == null) {
                return null;
            }

            Tanker tanker = ((TheTankerApplication) getApplication()).getTankerInstance();
            byte[] clearData = tanker.decrypt(data, options).get();
            return new String(clearData, "UTF-8");
        } catch (Throwable e) {
            Log.e("TheTankerShow", "loadDataError", e);
            return null;
        }
    }

    private void registerShareWithServer(String recipient) throws Throwable {
        URL url = shareNoteUrl();
        HttpURLConnection connection = (HttpURLConnection)url.openConnection();
        connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
        connection.setRequestMethod("POST");
        connection.setDoOutput(true);

        String userId = getIntent().getStringExtra("EXTRA_USERID");

        String jsonPasCher = String.format("{\"to\": [\"%s\"], \"from\": \"%s\" }", recipient, userId);
        Log.i("TheTankerShow", jsonPasCher);
        connection.getOutputStream().write( jsonPasCher.getBytes() );
        connection.getInputStream();
    }


    private void updatePassword() {
        Intent intent = new Intent(MainActivity.this, UpdateUnlockPasswordActivity.class);
        intent.putExtra("EXTRA_USERID", getIntent().getStringExtra("EXTRA_USERID"));
        intent.putExtra("EXTRA_PASSWORD", getIntent().getStringExtra("EXTRA_PASSWORD"));
        startActivity(intent);
    }

    private void share() {
        EditText recipientEdit = findViewById(R.id.recipient_name_edit);
        String recipient = recipientEdit.getText().toString();
        ShareDataTask task = new ShareDataTask();
        task.execute(recipient);
        boolean ok = false;
        try {
            ok = task.get();
        } catch (Throwable e) {
            e.printStackTrace();
        }
        if (!ok) {
            showToast("Share failed");
        }
    }

    private void saveData() {
        EditText contentEdit = findViewById(R.id.main_content_edit);
        String clearText = contentEdit.getText().toString();
        UploadDataTask task = new UploadDataTask();
        task.execute(clearText);
        boolean ok = false;
        try {
            ok = task.get();
        } catch (Throwable e) {
            e.printStackTrace();
        }
        if (!ok) {
            showToast("Upload failed");
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        Button logoutButton = findViewById(R.id.main_logout_button);
        logoutButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                logout();
            }
        });

        Button updatePasswordButton = findViewById(R.id.main_update_password_button);
        updatePasswordButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                updatePassword();
            }
        });

        Button saveButton =  findViewById(R.id.main_save_button);
        saveButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                saveData();
            }
        });

        Button shareButton = findViewById(R.id.share_button);
        shareButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                share();
            }
        });

        FetchDataTask backgroundTask = new FetchDataTask();
        backgroundTask.execute((String)null);
    }

    @Override
    public void onBackPressed() {
        logout();
    }


    public class FetchDataTask extends AsyncTask<String, Void, Boolean> {
        @Override
        protected Boolean doInBackground(String... params) {
            String userId = params[0];
            String data = loadDataFromUser(userId);
            runOnUiThread(() -> {
                EditText contentEdit = findViewById(R.id.main_content_edit);
                contentEdit.setText(data);
            });

            try {
                loadSharedWithMe();
            } catch (Throwable e) {
                Log.e("notepad", "Failed to fetch share data: " + e.getMessage());
                return false;
            }
            return true;
        }
    }

    public class UploadDataTask extends AsyncTask<String, Void, Boolean> {

        @Override
        protected Boolean doInBackground(String... params) {
            String clearText = params[0];
            byte[] clearData;
            try {
                clearData = clearText.getBytes();
                Tanker tanker = ((TheTankerApplication) getApplication()).getTankerInstance();
                byte[] encryptedData = tanker.encrypt(clearData, null).get();
                resourceId = tanker.getResourceID(encryptedData);
                uploadToServer(encryptedData);
            } catch (Throwable e) {
                Log.e("notepad", "Failed to upload data: " + e.getMessage());
                return false;
            }
            return true;
        }
    }

    public class ShareDataTask extends AsyncTask<String, Void, Boolean> {

        @Override
        protected Boolean doInBackground(String... params) {
            String recipient = params[0];
            try {
                Tanker tanker = ((TheTankerApplication) getApplication()).getTankerInstance();
                tanker.share(new String[]{resourceId}, new String[]{recipient}).get();
                registerShareWithServer(recipient);
            } catch (Throwable e) {
                Log.e("notepad", "Failed to register share with server: " + e.getMessage());
                return false;
            }
            return true;
        }
    }
}
