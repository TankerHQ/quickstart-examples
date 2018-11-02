#import "SignUpViewController.h"
#import "StringValidator.h"

@import PromiseKit;

@interface SignUpViewController ()
@property UIActivityIndicatorView* activityIndicator;
@property(weak, nonatomic) IBOutlet UITextField* emailField;
@property(weak, nonatomic) IBOutlet UITextField* passwordField;
@property(weak, nonatomic) IBOutlet UILabel* errorLabel;

@end

@implementation SignUpViewController

- (void)viewDidLoad
{
  [super viewDidLoad];
  // Do any additional setup after loading the view.

  _emailField.returnKeyType = UIReturnKeyNext;
  _emailField.delegate = self;
  _passwordField.returnKeyType = UIReturnKeyNext;
  _passwordField.delegate = self;

  _activityIndicator = [[UIActivityIndicatorView alloc]
      initWithFrame:CGRectMake(self.view.bounds.size.width / 2 - 25, self.view.bounds.size.height / 2 - 25, 50, 50)];
  [_activityIndicator setActivityIndicatorViewStyle:UIActivityIndicatorViewStyleWhiteLarge];
  [_activityIndicator setColor:[UIColor blueColor]];
  [self.view addSubview:_activityIndicator];

  _errorLabel.textColor = [UIColor redColor];
}

- (void)didReceiveMemoryWarning
{
  [super didReceiveMemoryWarning];
  // Dispose of any resources that can be recreated.
}

- (void)signUpAction
{
  _errorLabel.text = @"";

  NSString* email = _emailField.text;
  NSString* password = _passwordField.text;

  if (![StringValidator isEmail:email]) {
    _errorLabel.text = @"Invalid email address";
    return;
  }
  if ([StringValidator isBlank:password]) {
    _errorLabel.text = @"Password is empty or filled with blanks";
    return;
  }

  [_activityIndicator startAnimating];

  [[self session] signUpWithEmail:email password:password].then(^{
    [self.activityIndicator stopAnimating];
    UITabBarController *controller = [self.storyboard
                                      instantiateViewControllerWithIdentifier:@"LoggedInTabBarController"];
    [self.navigationController pushViewController:controller animated:YES];
  })
  .catch(^(NSError *error) {
    [self.activityIndicator stopAnimating];
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
