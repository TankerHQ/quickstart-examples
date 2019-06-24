#import "RootViewController.h"
#import "Session.h"

PMKPromise* promiseSettledWithMinDelay(PMKPromise* promise, double secDuration)
{
  return [PMKPromise promiseWithResolver:^(PMKResolver resolve) {
    float startTime = CACurrentMediaTime();

    void (^callback)(id) = ^(id resultOrError) {
      float endTime = CACurrentMediaTime();
      int64_t nsecDelay = (int64_t)MAX(0, NSEC_PER_SEC * (secDuration - (endTime - startTime)));

      dispatch_time_t delay = dispatch_time(DISPATCH_TIME_NOW, nsecDelay);
      dispatch_after(delay, dispatch_get_main_queue(), ^(void) {
        resolve(resultOrError);
      });
    };

    promise.then(callback).catch(callback);
  }];
}

@interface RootViewController ()

@property UIViewController* current;

@end

// Root controller that allows navigation between separate application parts.
// Inspired by: https://medium.com/@stasost/ios-root-controller-navigation-3625eedbbff
//
@implementation RootViewController

- (void)viewDidLoad
{
  [super viewDidLoad];

  [self displaySplashScreen];

  promiseSettledWithMinDelay([[Session sharedSession] tankerReady], 2)
      .then(^{
        [self displayLoginScreen];
      })
      .catch(^(NSError* error) {
        NSLog(@"%@", error);
        NSString* errorMessage =
            @"Failed to init the session. Verify that the server is running and restart the application.";
        [SVProgressHUD showErrorWithStatus:errorMessage];
      });
}

- (void)displaySplashScreen
{
  UIViewController* screen = [self.storyboard instantiateViewControllerWithIdentifier:@"SplashScreenController"];
  [self displayScreen:screen];
}

- (void)displayLoginScreen
{
  UIViewController* screen = [self.storyboard instantiateViewControllerWithIdentifier:@"LoggedOutNavigationController"];
  [self displayScreen:screen];
}

- (void)displayTabBarScreen
{
  UIViewController* screen = [self.storyboard instantiateViewControllerWithIdentifier:@"LoggedInTabBarController"];
  [self displayScreen:screen];
}

- (void)displayScreen:(UIViewController*)screen
{
  if (self.current == screen)
  {
    return;
  }

  if (self.current != nil)
  {
    [self.current willMoveToParentViewController:nil];
  }

  [self addChildViewController:screen];

  if (self.current == nil)
  {
    screen.view.frame = self.view.bounds;
    [self.view addSubview:screen.view];
    [screen didMoveToParentViewController:self];
    self.current = screen;
  }
  else
  {
    [self transitionFromViewController:self.current
        toViewController:screen
        duration:0.3
        options:(UIViewAnimationOptionTransitionCrossDissolve | UIViewAnimationOptionCurveEaseOut)
        animations:^{
          screen.view.frame = self.view.bounds;
        }
        completion:^(BOOL finished) {
          [self.current removeFromParentViewController];
          [screen didMoveToParentViewController:self];
          self.current = screen;
        }];
  }
}

@end
