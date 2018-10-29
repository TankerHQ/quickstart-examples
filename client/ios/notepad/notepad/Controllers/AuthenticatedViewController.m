#import "Globals.h"
#import "AuthenticatedViewController.h"

@import PromiseKit;

@interface AuthenticatedViewController ()
@end

@implementation AuthenticatedViewController

- (void)viewDidLoad {
  [super viewDidLoad];
  [self initNavbar];
  [self initStatusbarBackground];
}

- (UIBarPosition) positionForBar:(id<UIBarPositioning>)bar {
  return UIBarPositionTopAttached;
}

// Standalone navbar: https://dev.to/onmyway133/using-standalone-uinavigationbar-in-ios-5b8j
- (void)initNavbar {
  UINavigationBar* navbar = [[UINavigationBar alloc] initWithFrame:CGRectMake(0, 0, self.view.frame.size.width, 100)];

  [self.view addSubview:navbar];

  UINavigationItem* navItem = [[UINavigationItem alloc] initWithTitle:self.navbarTitle];

  UIBarButtonItem* logoutButton = [[UIBarButtonItem alloc]
                                   initWithTitle:@"Logout"
                                   style:UIBarButtonItemStylePlain
                                   target:self
                                   action:@selector(triggerLogout:)];

  navItem.rightBarButtonItem = logoutButton;

  if (self.navbarBackButton) {
    UIBarButtonItem* backButton = [[UIBarButtonItem alloc]
                                  initWithTitle:@"Back"
                                  style:UIBarButtonItemStylePlain
                                  target:self
                                  action:@selector(triggerBack:)];

    navItem.leftBarButtonItem = backButton;
  }

  [navbar setItems:@[navItem]];

  navbar.translatesAutoresizingMaskIntoConstraints = NO;
  [navbar.leftAnchor constraintEqualToAnchor:(self.view.leftAnchor)].active = YES;
  [navbar.rightAnchor constraintEqualToAnchor:(self.view.rightAnchor)].active = YES;
  [navbar.topAnchor constraintEqualToAnchor:(self.view.safeAreaLayoutGuide.topAnchor)].active = YES;
}

- (void)initStatusbarBackground {
  // Use same background color for the status bar above the navbar: https://stackoverflow.com/a/40564347
  CGFloat width = self.view.frame.size.width;
  CGFloat height = [UIApplication sharedApplication].statusBarFrame.size.height;
  UIView* statusBarView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, width, height)];

  UIColor* grey = [UIColor colorWithRed:(247.0f/255.0f) green:(247.0f/255.0f) blue:(247.0f/255.0f) alpha:1];
  statusBarView.backgroundColor = grey;

  [self.view addSubview:statusBarView];
}

- (void)triggerLogout:(UIBarButtonItem*)sender
{
  [[Globals sharedInstance] logout].then(^{
    NSLog(@"Did log out");
    UIViewController* controller = [self.storyboard instantiateViewControllerWithIdentifier:@"LoginViewController"];
    [self.navigationController pushViewController:controller animated:YES];
  });
}

- (void)triggerBack:(UIBarButtonItem*)sender
{
  [self.navigationController popViewControllerAnimated:YES];
}

@end

