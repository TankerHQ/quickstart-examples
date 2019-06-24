#import "BaseViewController.h"

@interface BaseViewController ()

@end

@implementation BaseViewController

- (void)viewDidLoad
{
  [super viewDidLoad];
}

//- (void)viewWillAppear:(BOOL)animated {
//  [super viewWillAppear:animated];
//  NSLog(@"Debug navigation stack: %@", self.navigationController.viewControllers);
//}

- (RootViewController*)rootViewController
{
  return (RootViewController*)UIApplication.sharedApplication.delegate.window.rootViewController;
}

- (Session*)session
{
  return [Session sharedSession];
}

@end
