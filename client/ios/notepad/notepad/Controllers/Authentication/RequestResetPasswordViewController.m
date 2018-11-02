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
  self.errorLabel.text = @" ";

  NSString *email = self.emailField.text;

  if (![StringValidator isEmail:email]) {
    self.errorLabel.text = @"Invalid email address";
    return;
  }

  [[self session].apiClient requestResetPassword:email].then(^{
    NSLog(@"Email sent");
  });
}

@end
