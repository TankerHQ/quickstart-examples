package io.tanker.notepad;

import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;

import io.tanker.api.Tanker;
import io.tanker.api.TankerDecryptOptions;
import okhttp3.Response;

public class MyNoteActivity extends DrawerActivity {
    private EditText mNoteInput;
    private EditText mRecipientInput;

    public int getContentResourceId() {
        return R.layout.content_my_note;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        mNoteInput = findViewById(R.id.note_input);
        mRecipientInput = findViewById(R.id.recipient_email_input);

        Button saveButton = findViewById(R.id.save_note_button);
        saveButton.setOnClickListener((View v) -> {
            hideKeyboard();
            saveData();
        });

        FetchDataTask backgroundTask = new FetchDataTask();
        backgroundTask.execute(mApiClient.getCurrentUserId());
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
                        showToast("Failed to get the UserId from Email");
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
}
