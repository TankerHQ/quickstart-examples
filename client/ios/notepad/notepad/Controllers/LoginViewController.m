#import "LoginViewController.h"
#import "Globals.h"
#import "HomeViewController.h"
@import PromiseKit;

@interface LoginViewController ()
@property UIActivityIndicatorView *activityIndicator;
@property(weak, nonatomic) IBOutlet UITextField *emailField;
@property(weak, nonatomic) IBOutlet UITextField *passwordField;
@property(weak, nonatomic) IBOutlet UILabel *errorLabel;

@end

@implementation LoginViewController

- (void)viewDidLoad {
  [super viewDidLoad];
  // Do any additional setup after loading the view.

  _emailField.returnKeyType = UIReturnKeyNext;
  _emailField.delegate = self;
  _passwordField.returnKeyType = UIReturnKeyNext;
  _passwordField.delegate = self;

  _activityIndicator = [[UIActivityIndicatorView alloc]
      initWithFrame:CGRectMake(self.view.bounds.size.width / 2 - 25,
                               self.view.bounds.size.height / 2 - 25, 50, 50)];
  [_activityIndicator
      setActivityIndicatorViewStyle:UIActivityIndicatorViewStyleWhiteLarge];
  [_activityIndicator setColor:[UIColor blueColor]];
  [self.view addSubview:_activityIndicator];

  _errorLabel.textColor = [UIColor redColor];
}

- (void)didReceiveMemoryWarning {
  [super didReceiveMemoryWarning];
  // Dispose of any resources that can be recreated.
}

- (void)loginAction {
  _errorLabel.text = @"";
  NSString *email = _emailField.text;
  NSString *password = _passwordField.text;
  if ([email
          stringByTrimmingCharactersInSet:[NSCharacterSet
                                              whitespaceAndNewlineCharacterSet]]
          .length == 0) {
    _errorLabel.text = @"Email is empty or filled with blanks";
    return;
  }
  if ([password
          stringByTrimmingCharactersInSet:[NSCharacterSet
                                              whitespaceAndNewlineCharacterSet]]
          .length == 0) {
    _errorLabel.text = @"Password is empty or filled with blanks";
    return;
  }

  __block NSString *userToken;
  [_activityIndicator startAnimating];
  [Globals loginWithEmail:email password:password]
      .then(^(NSString *token) {
        userToken = token;
        return [[Globals sharedInstance] buildTanker];
      })
      .then(^() {
        [[Globals sharedInstance].tanker connectUnlockRequiredHandler:^{
          [[Globals sharedInstance].tanker
              unlockCurrentDeviceWithPassword:password];
        }];

        NSString *userId = [Globals sharedInstance].userId;

        return [[Globals sharedInstance].tanker openWithUserID:userId
                                                     userToken:userToken];
      })
      .then(^{
        return [[Globals sharedInstance].tanker isUnlockAlreadySetUp];
      })
      .then(^(NSNumber *setUp) {
        if ([setUp isEqualToNumber:@NO])
          return [[Globals sharedInstance].tanker
              setupUnlockWithPassword:password];
        return [PMKPromise promiseWithValue:nil];
      })
      .then(^{
        [self.activityIndicator stopAnimating];
        HomeViewController *controller = [self.storyboard
            instantiateViewControllerWithIdentifier:@"HomeViewController"];
        [self.navigationController pushViewController:controller animated:YES];
      })
      .catch(^(NSError *error) {
        // TODO check error domain to show app errors
        [self.activityIndicator stopAnimating];
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
