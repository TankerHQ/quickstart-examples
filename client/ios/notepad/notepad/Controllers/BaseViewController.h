#import "RootViewController.h"
#import "Session.h"
#import <UIKit/UIKit.h>

@import SVProgressHUD;

NS_ASSUME_NONNULL_BEGIN

@interface BaseViewController : UIViewController

- (RootViewController*)rootViewController;
- (Session*)session;

@end

NS_ASSUME_NONNULL_END
