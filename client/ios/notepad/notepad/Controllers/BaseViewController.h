#import <UIKit/UIKit.h>
#import "Session.h"
#import "RootViewController.h"

@import SVProgressHUD;

NS_ASSUME_NONNULL_BEGIN

@interface BaseViewController : UIViewController

- (RootViewController *)rootViewController;
- (Session *)session;

@end

NS_ASSUME_NONNULL_END
