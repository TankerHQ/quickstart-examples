#import "SignUpViewController.h"
#import "Globals.h"
#import "HomeViewController.h"
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

  if ([email stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]].length == 0)
  {
    _errorLabel.text = @"Email is empty or filled with blanks";
    return;
  }
  if ([password stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]].length == 0)
  {
    _errorLabel.text = @"Password is empty or filled with blanks";
    return;
  }

  [_activityIndicator startAnimating];

  __block NSString *userToken;

  [Globals signupWithEmail:email password:password].then(^(NSString *token) {
    userToken = token;
    return [[Globals sharedInstance] buildTanker];
  }).then(^() {
                NSString *userId = [Globals sharedInstance].userId;

                return [[Globals sharedInstance].tanker openWithUserID:userId userToken:userToken];
              }).then(^{
                  NSLog(@"Tanker is open");
                return [[Globals sharedInstance].tanker setupUnlockWithPassword:password];
              }).then(^{
                    [self.activityIndicator stopAnimating];
                    HomeViewController* controller =
                        [self.storyboard instantiateViewControllerWithIdentifier:@"HomeViewController"];
                    [self.navigationController pushViewController:controller animated:YES];
              })
              .catch(^(NSError* err) {
                [self.activityIndicator stopAnimating];
                NSString* message = @"Error during signup";
                NSLog(@"%@: %@", message, [err localizedDescription]);
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
