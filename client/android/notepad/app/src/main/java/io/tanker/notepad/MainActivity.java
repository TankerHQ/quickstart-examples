package io.tanker.notepad;

import android.content.Intent;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.Toast;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;

import io.tanker.api.Tanker;
import io.tanker.api.TankerDecryptOptions;
import io.tanker.notepad.network.ApiClient;
import okhttp3.Response;

public class MainActivity extends AppCompatActivity {
    private ArrayList<String> receivedNoteAuthors = new ArrayList<>();
    private ArrayList<String> receivedNoteContents = new ArrayList<>();
    private ApiClient mApiClient;
    private EditText mNoteInput;
    private EditText mRecipientInput;

    private void showToast(String message) {
        runOnUiThread(() -> Toast.makeText(this, message, Toast.LENGTH_LONG).show());
    }

    private void loadSharedWithMe() throws Throwable {
        Response res = mApiClient.getMe();

        ObjectMapper jsonMapper = new ObjectMapper();
        JsonNode json = jsonMapper.readTree(res.body().string());

        if (json.has("accessibleNotes")) {
            JsonNode notes = json.get("accessibleNotes");
            for (final JsonNode note : notes) {
                String authorEmail = note.get("email").asText();
                String authorUserId = note.get("id").asText();
                receivedNoteAuthors.add(authorEmail);
                receivedNoteContents.add(loadDataFromUser(authorUserId));
            }

            runOnUiThread(() -> {
                ListView notesList = findViewById(R.id.notes_list);
                notesList.setAdapter(new NoteListAdapter(this, R.layout.notes_list_item, receivedNoteAuthors, receivedNoteContents));
                for (String note : receivedNoteContents) {
                    //noinspection unchecked (this is fine)
                    ((ArrayAdapter<String>) notesList.getAdapter()).add(note);
                }
            });
        }
    }

    private String loadDataFromUser(String userId) {
        TankerDecryptOptions options = new TankerDecryptOptions();

        try {
            byte[] data = mApiClient.getData(userId);
            if (data == null) {
                return null;
            }

            Tanker tanker = ((NotepadApplication) getApplication()).getTankerInstance();
            byte[] clearData = tanker.decrypt(data, options).get();
            return new String(clearData, "UTF-8");
        } catch (Throwable e) {
            Log.e("Notepad", "loadDataError", e);
            return null;
        }
    }

    private void logout() {
        LogoutTask task = new LogoutTask();
        task.execute();
        boolean ok = false;

        try {
            ok = task.get();
        } catch (Throwable e) {
            e.printStackTrace();
        }
        if (!ok) {
            showToast("Logout failed");
        }
    }

    private void setting() {
        Intent intent = new Intent(MainActivity.this, SettingsActivity.class);
        startActivity(intent);
    }

    private void saveData() {
        String clearText = mNoteInput.getText().toString();
        String recipientEmail = mRecipientInput.getText().toString();

        SaveNoteTask task = new SaveNoteTask();
        task.execute(clearText, recipientEmail);
        boolean ok = false;
        try {
            ok = task.get();
        } catch (Throwable e) {
            e.printStackTrace();
        }
        if (!ok) {
            showToast("Failed to save the note");
        }
    }


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        mApiClient = ApiClient.getInstance();

        mNoteInput = findViewById(R.id.note_input);
        mRecipientInput = findViewById(R.id.recipient_email_input);

        Button logoutButton = findViewById(R.id.main_logout_button);
        logoutButton.setOnClickListener((View v) -> logout());

        Button settingButton = findViewById(R.id.main_setting_button);
        settingButton.setOnClickListener((View v) -> setting());

        Button saveButton = findViewById(R.id.save_note_button);
        saveButton.setOnClickListener((View v) -> saveData());

        FetchDataTask backgroundTask = new FetchDataTask();
        backgroundTask.execute(mApiClient.getCurrentUserId());
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
                EditText contentEdit = findViewById(R.id.note_input);
                contentEdit.setText(data);
            });

            try {
                loadSharedWithMe();
            } catch (Throwable e) {
                Log.e("Notepad", "Failed to fetch share data: " + e.getMessage());
                return false;
            }
            return true;
        }
    }

    public class SaveNoteTask extends AsyncTask<String, Void, Boolean> {
        @Override
        protected Boolean doInBackground(String... params) {
            String clearText = params[0];
            String recipientEmail = params[1];

            try {
                Boolean sharing = !recipientEmail.isEmpty();
                String recipientUserId = null;

                if (sharing) {
                    recipientUserId = mApiClient.getUserIdFromEmail(recipientEmail);
                    if (recipientUserId == null) {
                        Log.e("Notepad", "Failed to get the UserId from Email");
                        return false;
                    }
                }

                Tanker tanker = ((NotepadApplication) getApplication()).getTankerInstance();

                byte[] clearData = clearText.getBytes();
                byte[] encryptedData = tanker.encrypt(clearData, null).get();

                mApiClient.putData(encryptedData);

                if (sharing) {
                    String resourceId = tanker.getResourceID(encryptedData);
                    tanker.share(new String[]{resourceId}, new String[]{recipientUserId}).get();
                    Response res = mApiClient.share(recipientUserId);
                    if (!res.isSuccessful()) {
                        throw new Error(res.message());
                    }
                    showToast("Note successfully shared");
                } else {
                    showToast("Note successfully saved");
                }

                return true;
            } catch (Throwable e) {
                Log.e("Notepad", "Failed to save data: " + e.getMessage());
                return false;
            }
        }
    }

    public class LogoutTask extends AsyncTask<Void, Void, Boolean> {
        @Override
        protected Boolean doInBackground(Void... params) {
            try {
                mApiClient.logout();

                Tanker tanker = ((NotepadApplication) getApplication()).getTankerInstance();
                tanker.close().get();

                runOnUiThread(() -> {
                    // Redirect to the Login activity
                    Intent intent = new Intent(MainActivity.this, LoginActivity.class);
                    startActivity(intent);
                });
            } catch (Throwable e) {
                Log.e("Notepad", "Failed to logout");
                return false;
            }
            return true;
        }
    }
}
