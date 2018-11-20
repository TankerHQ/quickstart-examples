package io.tanker.notepad;

import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;
import android.widget.ArrayAdapter;
import android.widget.ListView;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.ArrayList;

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
        JsonNode me = mSession.getMe();
        JsonNode notes = me.get("accessibleNotes");

        for (final JsonNode note : notes) {
            String authorEmail = note.get("email").asText();
            String authorUserId = note.get("id").asText();
            receivedNoteAuthors.add(authorEmail);
            receivedNoteContents.add(mSession.getData(authorUserId));
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
