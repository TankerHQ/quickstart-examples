package io.tanker.thetankershow;

import android.content.Intent;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;

import io.tanker.api.Tanker;

public class InputUnlockKeyActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_input_unlock_key);

        Button unlockButton = (Button) findViewById(R.id.input_unlock_key_unlock_button);
        unlockButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                EditText unlockKeyEdit = findViewById(R.id.input_unlock_key_edit);
                String unlockKey = unlockKeyEdit.getText().toString();
                if (unlockKey.isEmpty()) {
                    unlockKeyEdit.setError("Please input your unlock key");
                    unlockKeyEdit.requestFocus();
                    return;
                }

                Tanker tanker = ((TheTankerApplication) getApplication()).getTankerInstance();
                if (tanker == null) {
                    Log.e("TheTankerShow", "Empty tanker instance");
                    throw new NullPointerException("Empty tanker instance");
                }

                tanker.unlockCurrentDevice(unlockKey).then((validateFuture) -> {
                   if (validateFuture.getError() != null) {
                       runOnUiThread (() -> {
                           unlockKeyEdit.setError("Wrong unlock key, please try again");
                           unlockKeyEdit.requestFocus();
                       });
                       return null;
                   }

                    runOnUiThread (() -> {
                        // Redirect to the MainActivity
                        Intent intent = new Intent(InputUnlockKeyActivity.this, MainActivity.class);
                        startActivity(intent);
                    });

                   return null;
                });

            }
        });

    }
}
