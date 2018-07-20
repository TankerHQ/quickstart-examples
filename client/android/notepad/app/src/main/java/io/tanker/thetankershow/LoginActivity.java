package io.tanker.thetankershow;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.annotation.TargetApi;
import android.content.Intent;
import android.support.v7.app.AppCompatActivity;

import android.os.AsyncTask;

import android.os.Build;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;
import android.util.Patterns;
import android.view.KeyEvent;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.inputmethod.EditorInfo;
import android.widget.AutoCompleteTextView;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.ConnectException;
import java.net.HttpURLConnection;
import java.net.URL;

import io.tanker.api.Password;
import io.tanker.api.Tanker;
import io.tanker.api.TankerConnection;
import io.tanker.api.TankerOptions;
import io.tanker.bindings.TankerLib;

/**
 * A login screen that offers login via email/password.
 */
public class LoginActivity extends AppCompatActivity {

    /**
     * Keep track of the login task to ensure we can cancel it if requested.
     */
    private UserLoginTask mAuthTask = null;

    // UI references.
    private AutoCompleteTextView mEmailView;
    private EditText mPasswordView;
    private View mProgressView;
    private View mLoginFormView;
    private Tanker mTanker;
    private TankerConnection mEventConnection;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);
        // Set up the login form.
        mEmailView = (AutoCompleteTextView) findViewById(R.id.email);

        mPasswordView = (EditText) findViewById(R.id.password);
        mPasswordView.setOnEditorActionListener(new TextView.OnEditorActionListener() {
            @Override
            public boolean onEditorAction(TextView textView, int id, KeyEvent keyEvent) {
                if (id == EditorInfo.IME_ACTION_DONE || id == EditorInfo.IME_NULL) {
                    attemptLogin();
                    return true;
                }
                return false;
            }
        });

        Button mEmailSignInButton = (Button) findViewById(R.id.email_sign_in_button);
        mEmailSignInButton.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View view) {
                attemptLogin();
            }
        });

        Button mSignUpButton = (Button) findViewById(R.id.email_sign_up_button2);
        mSignUpButton.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View view) {
                signUp();
            }
        });

        mLoginFormView = findViewById(R.id.login_form);
        mProgressView = findViewById(R.id.login_progress);

        String writablePath = getApplicationContext().getFilesDir().getAbsolutePath();
        TankerOptions options = new TankerOptions();
        options.setTrustchainId("Y9T8griM9EJtN++BATiSwc8vpFoFwPXPry7sB//hX0I=")
                .setWritablePath(writablePath);
        mTanker = new Tanker(options);

        mEventConnection = mTanker.connectUnlockRequiredHandler(() -> runOnUiThread (() -> {
            String password = mPasswordView.getText().toString();
            mTanker.unlockCurrentDevice(new Password(password)).then((validateFuture) -> {
                if (validateFuture.getError() != null) {
                    runOnUiThread(() -> {
                        mPasswordView.setError("Tanker: Wrong unlock password");
                        mPasswordView.requestFocus();
                        showProgress(false);
                    });
                } else {
                    Intent intent = new Intent(LoginActivity.this, MainActivity.class);
                    startActivity(intent);
                }
                return null;
            });
        }));

        ((TheTankerApplication) this.getApplication()).setTankerInstance(mTanker);
    }

    /**
     * Attempts to sign in or register the account specified by the login form.
     * If there are form errors (invalid email, missing fields, etc.), the
     * errors are presented and no actual login attempt is made.
     */
    private void attemptLogin() {
        if (mAuthTask != null) {
            return;
        }

        // Reset errors.
        mEmailView.setError(null);
        mPasswordView.setError(null);

        // Store values at the time of the login attempt.
        String email = mEmailView.getText().toString();
        String password = mPasswordView.getText().toString();

        boolean cancel = false;
        View focusView = null;

        // Check for a valid password, if the user entered one.
        if (!TextUtils.isEmpty(password) && !isPasswordValid(password)) {
            mPasswordView.setError(getString(R.string.error_invalid_password));
            focusView = mPasswordView;
            cancel = true;
        }

        // Check for a valid email address.
        if (TextUtils.isEmpty(email)) {
            mEmailView.setError(getString(R.string.error_field_required));
            focusView = mEmailView;
            cancel = true;
        } else if (!isEmailValid(email)) {
            mEmailView.setError(getString(R.string.error_invalid_email));
            focusView = mEmailView;
            cancel = true;
        }

        if (cancel) {
            // There was an error; don't attempt login and focus the first
            // form field with an error.
            focusView.requestFocus();
        } else {
            // Show a progress spinner, and kick off a background task to
            // perform the user login attempt.
            showProgress(true);
            mAuthTask = new UserLoginTask(email, password, false);
            mAuthTask.execute((Void) null);
        }
    }


    /**
     * Attempts to sign in or register the account specified by the login form.
     * If there are form errors (invalid email, missing fields, etc.), the
     * errors are presented and no actual login attempt is made.
     */
    private void signUp() {
        if (mAuthTask != null) {
            return;
        }

        // Reset errors.
        mEmailView.setError(null);
        mPasswordView.setError(null);

        // Store values at the time of the login attempt.
        String email = mEmailView.getText().toString();
        String password = mPasswordView.getText().toString();

        boolean cancel = false;
        View focusView = null;

        // Check for a valid password, if the user entered one.
        if (!TextUtils.isEmpty(password) && !isPasswordValid(password)) {
            mPasswordView.setError(getString(R.string.error_invalid_password));
            focusView = mPasswordView;
            cancel = true;
        }

        // Check for a valid email address.
        if (TextUtils.isEmpty(email)) {
            mEmailView.setError(getString(R.string.error_field_required));
            focusView = mEmailView;
            cancel = true;
        } else if (!isEmailValid(email)) {
            mEmailView.setError(getString(R.string.error_invalid_email));
            focusView = mEmailView;
            cancel = true;
        }

        if (cancel) {
            // There was an error; don't attempt login and focus the first
            // form field with an error.
            focusView.requestFocus();
        } else {
            // Show a progress spinner, and kick off a background task to
            // perform the user login attempt.
            showProgress(true);
            mAuthTask = new UserLoginTask(email, password, true);
            mAuthTask.execute((Void) null);
        }
    }

    private boolean isEmailValid(String email) {
        return (!TextUtils.isEmpty(email) && Patterns.EMAIL_ADDRESS.matcher(email).matches());
    }

    private boolean isPasswordValid(String password) {
        //TODO: Replace this with your own logic
        return true;
    }

    /**
     * Shows the progress UI and hides the login form.
     */
    @TargetApi(Build.VERSION_CODES.HONEYCOMB_MR2)
    private void showProgress(final boolean show) {
        // On Honeycomb MR2 we have the ViewPropertyAnimator APIs, which allow
        // for very easy animations. If available, use these APIs to fade-in
        // the progress spinner.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB_MR2) {
            int shortAnimTime = getResources().getInteger(android.R.integer.config_shortAnimTime);

            mLoginFormView.setVisibility(show ? View.GONE : View.VISIBLE);
            mLoginFormView.animate().setDuration(shortAnimTime).alpha(
                    show ? 0 : 1).setListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    mLoginFormView.setVisibility(show ? View.GONE : View.VISIBLE);
                }
            });

            mProgressView.setVisibility(show ? View.VISIBLE : View.GONE);
            mProgressView.animate().setDuration(shortAnimTime).alpha(
                    show ? 1 : 0).setListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    mProgressView.setVisibility(show ? View.VISIBLE : View.GONE);
                }
            });
        } else {
            // The ViewPropertyAnimator APIs are not available, so simply show
            // and hide the relevant UI components.
            mProgressView.setVisibility(show ? View.VISIBLE : View.GONE);
            mLoginFormView.setVisibility(show ? View.GONE : View.VISIBLE);
        }
    }

    /**
     * Represents an asynchronous login/registration task used to authenticate
     * the user.
     */
    public class UserLoginTask extends AsyncTask<Void, Void, Boolean> {

        private final String mEmail;
        private final String mPassword;
        private final Boolean mSignUp;
        private  String mUserId;
        private Integer mError;


        UserLoginTask(String email, String password, Boolean isSignUp) {
            mEmail = email;
            mPassword = password;
            mSignUp = isSignUp;
            mError = 200;
        }

        private String fetchUserToken(String email, String password) throws IOException {
            String method = mSignUp ? "signup" : "login";
            String address  = ((TheTankerApplication) getApplication()).getServerAddress();

            URL url = new URL( address + method + "?email=" + email + "&password=" + password);

            HttpURLConnection connection = (HttpURLConnection)url.openConnection();
            connection.setRequestMethod("GET");
            connection.connect();

            mError = connection.getResponseCode();
            if(mError < 200 || mError > 202)
                throw new IOException("");

            BufferedReader in = new BufferedReader(
                    new InputStreamReader(
                            connection.getInputStream()));

            String token = "";
            try {
                JSONObject res  = new JSONObject(in.readLine());
                token = res.getString("token");
                mUserId = res.getString("id");
            } catch (JSONException e) {
                Log.e("TheTankerShow", "JSON error", e);
                return token;
            }
            return token;
        }

        private void goToMainActivity() {
            runOnUiThread(() -> {
                // Redirect to the MainActivity
                Intent intent = new Intent(LoginActivity.this, MainActivity.class);
                intent.putExtra("EXTRA_EMAIL", mEmail);
                intent.putExtra("EXTRA_USERID", mUserId);
                intent.putExtra("EXTRA_PASSWORD", mPassword);
                startActivity(intent);
                showProgress(false);
            });
        }

        @Override
        protected Boolean doInBackground(Void... params) {
            // TODO: attempt authentication against a network service.

            try {
                String userToken = fetchUserToken(mEmail, mPassword);
                mTanker.open(mUserId, userToken).then((openFuture) -> {
                    if (openFuture.getError() != null) {
                        Log.e("TheTankerShow", "Error while opening Tanker session", openFuture.getError());
                        return null;
                    }

                    if (mSignUp) {
                        mTanker.setupUnlock(new Password(mPassword)).then((fut) -> {
                            Log.e("TheTankershow", "" + fut.getError());
                            goToMainActivity();
                            return null;
                        });
                    } else {
                        goToMainActivity();
                    }
                    return null;
                });
            } catch (ConnectException e) {
                Log.i("TheTankerShow", "Server Connection error", e);
                mError = 503;
            } catch (IOException e) {
                Log.i("TheTankerShow", "Login error", e);
                return false;
            } catch (Throwable e) {
                Log.e("TheTankerShow", "Other error", e);
                return false;
            }

            return true;
        }

        @Override
        protected void onPostExecute(final Boolean success) {
            mAuthTask = null;

            switch(mError) {
                case 200:
                case 201:
                case 202:
                    return;
                case 409:
                    mEmailView.setError("User already exists");
                    mEmailView.requestFocus();
                    break;
                case 401:
                    mPasswordView.setError("Wrong password");
                    mPasswordView.requestFocus();
                    break;
                case 404:
                    mEmailView.setError("User doesn't exist");
                    mEmailView.requestFocus();
                    break;
                case 503:
                    mEmailView.setError("Could not contact the server, please try again later");
                    mEmailView.requestFocus();
                    break;
                default:
                    mPasswordView.setError("Unknown Error");
                    mPasswordView.requestFocus();
                    break;
            }
            showProgress(false);
        }

        @Override
        protected void onCancelled() {
            mAuthTask = null;
            showProgress(false);
        }
    }
}
