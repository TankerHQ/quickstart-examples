package io.tanker.notepad;

import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;
import android.widget.ArrayAdapter;
import android.widget.ListView;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;

import io.tanker.api.Tanker;
import io.tanker.api.TankerDecryptOptions;
import okhttp3.Response;

public class SharedNotesActivity extends DrawerActivity {
    private ArrayList<String> receivedNoteAuthors = new ArrayList<>();
    private ArrayList<String> receivedNoteContents = new ArrayList<>();

    public int getContentResourceId() {
        return R.layout.content_shared_notes;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        FetchDataTask backgroundTask = new FetchDataTask();
        backgroundTask.execute();
    }

    private void loadSharedWithMe() throws Throwable {
        Response res = mApiClient.getMe();

        ObjectMapper jsonMapper = new ObjectMapper();
        JsonNode json = jsonMapper.readTree(res.body().string());

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

    private String loadDataFromUser(String userId) {
        TankerDecryptOptions options = new TankerDecryptOptions();

        try {
            byte[] data = mApiClient.getData(userId);
            if (data == null) {
                return null;
            }

            Tanker tanker = mSession.getTanker();
            byte[] clearData = tanker.decrypt(data, options).get();
            return new String(clearData, "UTF-8");
        } catch (Throwable e) {
            Log.e("Notepad", "loadDataError", e);
            return null;
        }
    }

    public class FetchDataTask extends AsyncTask<Void, Void, Boolean> {
        @Override
        protected Boolean doInBackground(Void... params) {
            try {
                loadSharedWithMe();
            } catch (Throwable e) {
                Log.e("Notepad", "Failed to fetch share data: " + e.getMessage());
                return false;
            }

            return true;
        }
    }
}
