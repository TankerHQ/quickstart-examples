package io.tanker.thetankershow;

import android.content.DialogInterface;
import android.content.Intent;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.EditText;

public class SavePassphraseActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_save_passphrase);

        Button doneButton = (Button) findViewById(R.id.passphrase_done_button);
        doneButton.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View view) {
                runOnUiThread (() -> {
                    // Redirect to the MainActivity
                    Intent intent = new Intent(SavePassphraseActivity.this, MainActivity.class);
                    intent.putExtra("EXTRA_USERID", getIntent().getStringExtra("EXTRA_USERID"));
                    intent.putExtra("EXTRA_PASSWORD", getIntent().getStringExtra("EXTRA_PASSWORD"));
                    startActivity(intent);
                });
            }
        });

        EditText passphraseDisplay = findViewById(R.id.passphrase_display);
        String s = getIntent().getStringExtra("EXTRA_PASSPHRASE");
        passphraseDisplay.setText(s);
    }
}
