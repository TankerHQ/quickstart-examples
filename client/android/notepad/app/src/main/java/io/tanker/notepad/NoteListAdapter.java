package io.tanker.notepad;

import android.content.Context;
import android.support.annotation.NonNull;
import android.text.Html;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;

import java.util.ArrayList;

public class NoteListAdapter extends ArrayAdapter<String> {
    private ArrayList<String> receivedNoteAuthors;
    private ArrayList<String> receivedNoteContents;

    public NoteListAdapter(@NonNull Context context, int resource,
                           ArrayList<String> receivedNoteAuthors, ArrayList<String> receivedNoteContents) {
        super(context, resource);
        this.receivedNoteAuthors = receivedNoteAuthors;
        this.receivedNoteContents = receivedNoteContents;
    }

    @NonNull
    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        LayoutInflater inflater = (LayoutInflater)getContext().getSystemService(Context.LAYOUT_INFLATER_SERVICE);
        View rowView = convertView != null ? convertView : inflater.inflate(R.layout.notes_list_item, parent, false);

        TextView authorView = rowView.findViewById(R.id.list_item_author);
        authorView.setText("Note from "+receivedNoteAuthors.get(position));

        TextView messageView = rowView.findViewById(R.id.list_item_message);
        messageView.setText(receivedNoteContents.get(position));
        messageView.requestLayout();

        return rowView;
    }
}
