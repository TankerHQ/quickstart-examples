#import "SignUpViewController.h"
#import "StringValidator.h"

@import PromiseKit;

@interface SignUpViewController ()
@property(weak, nonatomic) IBOutlet UITextField* emailField;
@property(weak, nonatomic) IBOutlet UITextField* passwordField;
@property(weak, nonatomic) IBOutlet UILabel* errorLabel;

@end

@implementation SignUpViewController

- (void)viewDidLoad
{
  [super viewDidLoad];
  // Do any additional setup after loading the view.

  self.emailField.returnKeyType = UIReturnKeyNext;
  self.emailField.delegate = self;
  self.passwordField.returnKeyType = UIReturnKeyNext;
  self.passwordField.delegate = self;
}

- (void)signUpAction
{
  self.errorLabel.text = @" ";

  NSString* email = self.emailField.text;
  NSString* password = self.passwordField.text;

  if (![StringValidator isEmail:email]) {
    self.errorLabel.text = @"Invalid email address";
    return;
  }
  if ([StringValidator isBlank:password]) {
    self.errorLabel.text = @"Password is empty or filled with blanks";
    return;
  }

  [SVProgressHUD showWithStatus: @"Signing up..."];

  [[self session] signUpWithEmail:email password:password].then(^{
    UITabBarController *controller = [self.storyboard
                                      instantiateViewControllerWithIdentifier:@"LoggedInTabBarController"];
    [self.navigationController pushViewController:controller animated:YES];

    [SVProgressHUD dismiss];
  })
  .catch(^(NSError *error) {
    [SVProgressHUD dismiss];

    NSString *message = @"Error during signup";
    NSLog(@"%@: %@", message, [error localizedDescription]);
    self.errorLabel.text = message;
  });
}

- (IBAction)signUpButton:(UIButton*)sender
{
  [self signUpAction];
}

- (BOOL)textFieldShouldReturn:(UITextField*)textField
{
  if (textField == self.emailField)
  {
    [self.passwordField becomeFirstResponder];
  }
  else if (textField == self.passwordField)
  {
    [self signUpAction];
  }
  return true;
}

@end
