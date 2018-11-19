#import "LoginViewController.h"
#import "StringValidator.h"

@import PromiseKit;

@interface LoginViewController ()
@property(weak, nonatomic) IBOutlet UITextField *emailField;
@property(weak, nonatomic) IBOutlet UITextField *passwordField;
@property(weak, nonatomic) IBOutlet UILabel *errorLabel;

@end

@implementation LoginViewController

- (void)viewDidLoad {
  [super viewDidLoad];
  // Do any additional setup after loading the view.

  self.emailField.returnKeyType = UIReturnKeyNext;
  self.emailField.delegate = self;
  self.passwordField.returnKeyType = UIReturnKeyNext;
  self.passwordField.delegate = self;
}

- (void)loginAction {
  self.errorLabel.text = @" ";

  NSString *email = self.emailField.text;
  NSString *password = self.passwordField.text;

  if (![StringValidator isEmail:email]) {
    self.errorLabel.text = @"Invalid email address";
    return;
  }
  if ([StringValidator isBlank:password]) {
    self.errorLabel.text = @"Password is empty or filled with blanks";
    return;
  }

  [SVProgressHUD showWithStatus: @"Connecting..."];

  [[self session] logInWithEmail:email password:password].then(^{
    [[self rootViewController] displayTabBarScreen];
    [SVProgressHUD dismiss];
  })
  .catch(^(NSError *error) {
    [SVProgressHUD dismiss];

    // TODO check error domain to show app errors
    NSLog(@"Could not open session: %@", [error localizedDescription]);
    self.errorLabel.text = @"Could not open session";
  });
}

- (IBAction)triggerLogin:(UIButton *)sender {
  [self loginAction];
}

- (BOOL)textFieldShouldReturn:(UITextField *)textField {
  if (textField == self.emailField) {
    [self.passwordField becomeFirstResponder];
  } else if (textField == self.passwordField) {
    [self loginAction];
  }
  return true;
}

@end
