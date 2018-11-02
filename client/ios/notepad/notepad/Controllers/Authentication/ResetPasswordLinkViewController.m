#import "ResetPasswordLinkViewController.h"
#import "ResetPasswordViewController.h"
#import "ResetPasswordToken.h"
#import "StringValidator.h"

@interface ResetPasswordLinkViewController ()

@property (weak, nonatomic) IBOutlet UITextField *linkField;
@property (weak, nonatomic) IBOutlet UILabel *errorLabel;

@end

@implementation ResetPasswordLinkViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
}

- (IBAction)submitLink:(id)sender {
  _errorLabel.text = @" ";

  NSString* link = _linkField.text;

  if (![StringValidator isURL:link]) {
    _errorLabel.text = @"Given link is not valid";
    return;
  }

  ResetPasswordToken *token = [[ResetPasswordToken alloc] initFromLink:link];
  [self performSegueWithIdentifier:@"resetPasswordSegue" sender:token];
}

- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender {
  if ([segue.identifier isEqualToString:@"resetPasswordSegue"]) {
    ResetPasswordViewController *destViewController = segue.destinationViewController;
    destViewController.token = (ResetPasswordToken *)sender;
  }
}

@end
