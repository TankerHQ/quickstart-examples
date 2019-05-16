package io.tanker.notepad;

import android.support.test.InstrumentationRegistry;
import android.support.test.espresso.NoMatchingViewException;
import android.support.test.espresso.ViewInteraction;
import android.support.test.espresso.contrib.DrawerActions;
import android.support.test.filters.LargeTest;
import android.support.test.rule.ActivityTestRule;
import android.support.test.runner.AndroidJUnit4;

import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.io.File;
import java.util.UUID;

import static android.support.test.espresso.Espresso.onView;
import static android.support.test.espresso.action.ViewActions.click;
import static android.support.test.espresso.action.ViewActions.replaceText;
import static android.support.test.espresso.assertion.ViewAssertions.matches;
import static android.support.test.espresso.matcher.ViewMatchers.isDisplayed;
import static android.support.test.espresso.matcher.ViewMatchers.withId;
import static android.support.test.espresso.matcher.ViewMatchers.withText;


@LargeTest
@RunWith(AndroidJUnit4.class)
public class LoginActivityTest {
    final static String bobEmail = "bob" + UUID.randomUUID().toString() + "@bob.bob";
    final static String bobPassword = "bob";


    @Rule
    public ActivityTestRule<LoginActivity> mActivityTestRule = new ActivityTestRule<>(LoginActivity.class);

    private static void clearAppData() {
        for (File file: InstrumentationRegistry.getTargetContext().getFilesDir().listFiles()) {
            file.delete();
        }
    }

    private void openMenu() {
        onView(withId(R.id.drawer_layout)).perform(DrawerActions.open());
    }

    private void logOut() {
        openMenu();
        onView(withId(R.id.btn_logout)).perform(click());
    }

    private void openSharedNotes() {
        openMenu();
        onView(withText("Notes shared with me")).perform(click());
    }

    private void fillForm(String email, String password) {
        onView(withId(R.id.email)).perform(replaceText(email));
        onView(withId(R.id.password)).perform(replaceText(password));
    }

    private void signUp(String email, String password) {
        fillForm(email, password);
        onView(withId(R.id.email_sign_up_button2)).perform(click());
    }

    private void signIn(String email, String password) {
        fillForm(email, password);
        onView(withId(R.id.email_sign_in_button)).perform(click());
    }

    @Test
    public void loginTest() {
        signUp(bobEmail, bobPassword);
        logOut();
        signIn(bobEmail, bobPassword);
        logOut();
    }

    @Test
    public void saveNoteTest() {
        signUp(bobEmail, bobPassword);
        String noteText = "My note";
        ViewInteraction note = onView(withId(R.id.note_input));
        note.perform(replaceText(noteText));
        onView(withId(R.id.save_note_button)).perform(click());
        logOut();
        signIn(bobEmail, bobPassword);
        note.check(matches(withText(noteText)));
        logOut();
    }

    @Test
    public void shareNoteTest() {
        signUp(bobEmail, bobPassword);
        String noteText = "My note to share";
        logOut();
        signUp("alice" + UUID.randomUUID().toString() + "@alice.al", "alice");
        ViewInteraction note = onView(withId(R.id.note_input));
        note.perform(replaceText(noteText));
        onView(withId(R.id.recipient_email_input)).perform(replaceText(bobEmail));
        onView(withId(R.id.save_note_button)).perform(click());
        logOut();
        signIn(bobEmail, bobPassword);
        openSharedNotes();
        onView(withText(noteText)).check(matches(isDisplayed()));
        logOut();
    }

    @Test
    public void passwordUnlockTest() {
        signUp(bobEmail, bobPassword);
        String noteText = "My note";
        ViewInteraction note = onView(withId(R.id.note_input));
        note.perform(replaceText(noteText));
        onView(withId(R.id.save_note_button)).perform(click());
        logOut();
        clearAppData();
        signIn(bobEmail, bobPassword);
        note.check(matches(withText(noteText)));
        logOut();
    }
}
