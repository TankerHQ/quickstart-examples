package io.tanker.thetankershow;

import android.content.Intent;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;

import io.tanker.api.Tanker;

public class InputPassphraseActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_input_passphrase);

        Button unlockButton = (Button) findViewById(R.id.input_passphrase_unlock_button);
        unlockButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                EditText passphraseEdit = findViewById(R.id.input_passphrase_edit);
                String passphrase = passphraseEdit.getText().toString();
                if (passphrase.isEmpty()) {
                    passphraseEdit.setError("Please input your passphrase");
                    passphraseEdit.requestFocus();
                    return;
                }

                Tanker tanker = ((TheTankerApplication) getApplication()).getTankerInstance();
                if (tanker == null) {
                    Log.e("TheTankerShow", "Empty tanker instance");
                    throw new NullPointerException("Empty tanker instance");
                }

                tanker.validateDevice(passphrase).then((validateFuture) -> {
                   if (validateFuture.getError() != null) {
                       runOnUiThread (() -> {
                           passphraseEdit.setError("Wrong passphrase, please try again");
                           passphraseEdit.requestFocus();
                       });
                       return null;
                   }

                    runOnUiThread (() -> {
                        // Redirect to the MainActivity
                        Intent intent = new Intent(InputPassphraseActivity.this, MainActivity.class);
                        startActivity(intent);
                    });

                   return null;
                });

            }
        });

    }
}
