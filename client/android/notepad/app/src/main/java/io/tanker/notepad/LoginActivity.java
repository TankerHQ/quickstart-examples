package io.tanker.notepad;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.annotation.TargetApi;
import android.content.Intent;

import android.os.AsyncTask;

import android.os.Build;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.AutoCompleteTextView;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.net.ConnectException;

import io.tanker.api.Password;
import okhttp3.Response;

import static io.tanker.notepad.Utils.isEmailValid;
import static io.tanker.notepad.Utils.isPasswordValid;

/**
 * A login screen that offers login via email/password.
 */
public class LoginActivity extends BaseActivity {
    // Keep track of the login task to ensure we can cancel it if requested.
    private AuthenticationTask mAuthTask = null;

    // UI references.
    private AutoCompleteTextView mEmailView;
    private EditText mPasswordView;
    private View mProgressView;
    private View mLoginFormView;

    // Bind Tanker handler only when needed
    private boolean mTankerBound = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        // Set up the login form.
        mEmailView = findViewById(R.id.email);

        mPasswordView = findViewById(R.id.password);
        mPasswordView.setOnEditorActionListener((TextView textView, int id, KeyEvent keyEvent) -> {
            if (id == EditorInfo.IME_ACTION_DONE || id == EditorInfo.IME_NULL) {
                authenticate(false);
                return true;
            }
            return false;
            }
        );

        Button mEmailSignInButton = findViewById(R.id.email_sign_in_button);
        mEmailSignInButton.setOnClickListener((View v) -> {
            hideKeyboard();
            authenticate(false);
        });

        Button mSignUpButton = findViewById(R.id.email_sign_up_button2);
        mSignUpButton.setOnClickListener((View v) -> {
            hideKeyboard();
            authenticate(true);
        });

        Button mForgotPasswordButton = findViewById(R.id.forgot_password_button);
        mForgotPasswordButton.setOnClickListener((View v) -> forgotPassword());

        mLoginFormView = findViewById(R.id.login_form);
        mProgressView = findViewById(R.id.login_progress);
    }

    private void bindTanker() {
        mSession.getTanker().connectUnlockRequiredHandler(() -> runOnUiThread(() -> {
            String password = mPasswordView.getText().toString();
            mSession.getTanker().unlockCurrentDevice(new Password(password)).then((validateFuture) -> {
                if (validateFuture.getError() != null) {
                    runOnUiThread(() -> {
                        mPasswordView.setError("Tanker: Wrong unlock password");
                        mPasswordView.requestFocus();
                        showProgress(false);
                    });
                } else {
                    Intent intent = new Intent(LoginActivity.this, MyNoteActivity.class);
                    startActivity(intent);
                }
                return null;
            });
        }));
    }

    @Override
    protected void onRestart() {
        super.onRestart();
        mAuthTask = null;
        showProgress(false);
    }

    private void forgotPassword() {
        Intent intent = new Intent(LoginActivity.this, ForgotPasswordActivity.class);
        startActivity(intent);
    }

    /**
     * Attempts to sign in or register the account specified by the login form.
     * If there are form errors (invalid email, missing fields, etc.), the
     * errors are presented and no actual login attempt is made.
     */
    private void authenticate(Boolean isSignUp) {
        if (!mTankerBound) {
            bindTanker();
            mTankerBound = true;
        }

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
            mAuthTask = new AuthenticationTask(email, password, isSignUp);
            mAuthTask.execute((Void) null);
        }
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
    public class AuthenticationTask extends AsyncTask<Void, Void, Boolean> {

        private final String mEmail;
        private final String mPassword;
        private final Boolean mSignUp;
        private String mUserId;
        private Integer mError;


        AuthenticationTask(String email, String password, Boolean isSignUp) {
            mEmail = email;
            mPassword = password;
            mSignUp = isSignUp;
            mError = 200;
        }

        private String authenticate(String email, String password) throws IOException, JSONException {
            Response res = mSignUp ?
                    mApiClient.signup(email, password) :
                    mApiClient.login(email, password);

            mError = res.code();

            if (!res.isSuccessful()) {
                throw new Error("Failed to authenticate");
            }

            String token = "";
            try {
                JSONObject body = new JSONObject(res.body().string());
                token = body.getString("token");
                mUserId = body.getString("id");
            } catch (JSONException e) {
                Log.e("Notepad", "JSON error", e);
                return token;
            }

            return token;
        }

        private void goToDefaultActivity() {
            runOnUiThread(() -> {
                // Redirect to the MyNoteActivity
                Intent intent = new Intent(LoginActivity.this, MyNoteActivity.class);
                startActivity(intent);
                // Finish current LoginActivity so that you can't navigate back once logged in
                finish();
            });
        }

        @Override
        protected Boolean doInBackground(Void... params) {

            try {
                String userToken = authenticate(mEmail, mPassword);

                mSession.getTanker().open(mUserId, userToken).then((openFuture) -> {
                    if (openFuture.getError() != null) {
                        Log.e("Notepad", "Error while opening Tanker session",
                                openFuture.getError());
                        return null;
                    }

                    if (mSignUp) {
                        mSession.getTanker().setupUnlock(new Password(mPassword)).then((fut) -> {
                            Log.e("Notepad", "" + fut.getError());
                            goToDefaultActivity();
                            return null;
                        });
                    } else {
                        goToDefaultActivity();
                    }
                    return null;
                });
            } catch (ConnectException e) {
                Log.i("Notepad", "Server Connection error", e);
                mError = 503;
            } catch (IOException e) {
                Log.i("Notepad", "Login error", e);
                return false;
            } catch (Throwable e) {
                Log.e("Notepad", "Other error", e);
                return false;
            }

            return true;
        }

        @Override
        protected void onPostExecute(final Boolean success) {
            mAuthTask = null;

            switch (mError) {
                case 200:
                case 201:
                case 202:
                    return;
                case 409:
                    mEmailView.setError(getString(R.string.email_exist));
                    mEmailView.requestFocus();
                    break;
                case 401:
                    mPasswordView.setError("Wrong password");
                    mPasswordView.requestFocus();
                    break;
                case 404:
                    mEmailView.setError("Email not registered");
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
