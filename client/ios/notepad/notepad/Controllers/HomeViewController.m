#import "HomeViewController.h"
#import "Globals.h"

@import PromiseKit;

@interface HomeViewController ()
@end

@implementation HomeViewController

- (IBAction)triggerLogout:(UIButton*)sender
{
  [[Globals sharedInstance].tanker close].then(^{
    NSLog(@"Did log out");
    UIViewController* controller = [self.storyboard instantiateViewControllerWithIdentifier:@"home"];
    [self.navigationController pushViewController:controller animated:YES];
  });
}

@end
