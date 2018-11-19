package io.tanker.notepad;

import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;

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
            saveNote();
        });

        FetchDataTask backgroundTask = new FetchDataTask();
        backgroundTask.execute(mSession.getCurrentUserId());
    }

    private void saveNote() {
        String clearText = mNoteInput.getText().toString();
        String recipientEmail = mRecipientInput.getText().toString();

        SaveNoteTask task = new SaveNoteTask();
        task.execute(clearText, recipientEmail);
        try {
            task.get();
        } catch (Throwable e) {
            e.printStackTrace();
        }
    }

    public class FetchDataTask extends AsyncTask<String, Void, Boolean> {
        @Override
        protected Boolean doInBackground(String... params) {
            String userId = params[0];
            String data = mSession.getData(userId);
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
            String[] recipientEmails = recipientEmail.isEmpty() ? new String[]{} : new String[]{recipientEmail};

            try {
                mSession.putData(clearText, recipientEmails);
            } catch (Throwable e) {
                showToast(e.getMessage());
                Log.e("Notepad", "Failed to save data: " + e.getMessage());
                return false;
            }

            String successMessage = "Note successfully " + (recipientEmails.length > 0 ? "shared" : "saved");
            showToast(successMessage);
            return true;
        }
    }
}
