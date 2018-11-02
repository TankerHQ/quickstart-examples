#import "RequestResetPasswordViewController.h"
#import "StringValidator.h"

@interface RequestResetPasswordViewController ()

@property (weak, nonatomic) IBOutlet UITextField *emailField;
@property (weak, nonatomic) IBOutlet UILabel *errorLabel;

@end

@implementation RequestResetPasswordViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
}

- (IBAction)requestResetLink:(id)sender {
  _errorLabel.text = @" ";

  NSString *email = _emailField.text;

  if (![StringValidator isEmail:email]) {
    _errorLabel.text = @"Invalid email address";
    return;
  }

  [[self session].apiClient requestResetPassword:email].then(^{
    NSLog(@"Email sent");
  });
}

@end
